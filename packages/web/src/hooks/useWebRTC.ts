import { useRef, useCallback, useEffect } from 'react';
import {
  SignalingMessage,
  WebRtcOfferPayload,
  WebRtcAnswerPayload,
  WebRtcIceCandidatePayload,
} from '@tabvault/core';
import { LocalIdentity } from '../services/crypto.service.js';
import { SignalingClient } from '../services/signaling.client.js';

export function useWebRTC(
  identity: LocalIdentity | null,
  signalingClient: SignalingClient | null,
  onIncomingDataChannel?: (targetDeviceId: string, channel: RTCDataChannel) => void
) {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

  const createPeerConnection = useCallback(
    (targetDeviceId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && signalingClient && identity) {
          signalingClient.send({
            type: 'webrtc:ice-candidate',
            vaultId: identity.vaultId,
            senderDeviceId: identity.deviceId,
            targetDeviceId,
            payload: { candidate: event.candidate },
            timestamp: Date.now(),
          });
        }
      };

      pc.ondatachannel = (event) => {
        const channel = event.channel;
        channel.binaryType = 'arraybuffer';
        dataChannelsRef.current.set(targetDeviceId, channel);
        if (onIncomingDataChannel) {
          onIncomingDataChannel(targetDeviceId, channel);
        }
      };

      peerConnectionsRef.current.set(targetDeviceId, pc);
      return pc;
    },
    [identity, signalingClient, onIncomingDataChannel]
  );

  const getOrCreateDataChannel = useCallback(
    async (targetDeviceId: string): Promise<RTCDataChannel> => {
      let channel = dataChannelsRef.current.get(targetDeviceId);
      if (channel && channel.readyState === 'open') {
        return channel;
      }

      let pc = peerConnectionsRef.current.get(targetDeviceId);
      if (!pc || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
        pc = createPeerConnection(targetDeviceId);
      }

      channel = pc.createDataChannel('tabvault-transfer', { ordered: true });
      channel.binaryType = 'arraybuffer';
      dataChannelsRef.current.set(targetDeviceId, channel);

      if (onIncomingDataChannel) {
        onIncomingDataChannel(targetDeviceId, channel);
      }

      // Create Offer and send via Signaling
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (signalingClient && identity) {
        signalingClient.send({
          type: 'webrtc:offer',
          vaultId: identity.vaultId,
          senderDeviceId: identity.deviceId,
          targetDeviceId,
          payload: { sdp: offer },
          timestamp: Date.now(),
        });
      }

      // Wait for DataChannel to open or timeout
      return new Promise<RTCDataChannel>((resolve, reject) => {
        if (channel!.readyState === 'open') {
          return resolve(channel!);
        }

        const timeout = setTimeout(() => {
          reject(new Error('WebRTC DataChannel connection timeout'));
        }, 5000);

        channel!.onopen = () => {
          clearTimeout(timeout);
          resolve(channel!);
        };

        channel!.onerror = (err) => {
          clearTimeout(timeout);
          reject(err);
        };
      });
    },
    [createPeerConnection, signalingClient, identity, onIncomingDataChannel]
  );

  // Listen for incoming WebRTC signaling messages
  useEffect(() => {
    if (!signalingClient || !identity) return;

    const unsubscribe = signalingClient.onMessage(async (msg: SignalingMessage) => {
      if (msg.targetDeviceId && msg.targetDeviceId !== identity.deviceId) return;

      const senderId = msg.senderDeviceId;

      if (msg.type === 'webrtc:offer') {
        const payload = msg.payload as WebRtcOfferPayload;
        let pc = peerConnectionsRef.current.get(senderId);
        if (!pc || pc.connectionState === 'closed') {
          pc = createPeerConnection(senderId);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        signalingClient.send({
          type: 'webrtc:answer',
          vaultId: identity.vaultId,
          senderDeviceId: identity.deviceId,
          targetDeviceId: senderId,
          payload: { sdp: answer },
          timestamp: Date.now(),
        });
      } else if (msg.type === 'webrtc:answer') {
        const payload = msg.payload as WebRtcAnswerPayload;
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
      } else if (msg.type === 'webrtc:ice-candidate') {
        const payload = msg.payload as WebRtcIceCandidatePayload;
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && payload.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (err) {
            console.warn('Error adding ICE candidate:', err);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [signalingClient, identity, createPeerConnection]);

  return {
    getOrCreateDataChannel,
    peerConnections: peerConnectionsRef.current,
    dataChannels: dataChannelsRef.current,
  };
}
