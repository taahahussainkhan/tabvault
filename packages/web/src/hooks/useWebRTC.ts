import { useRef, useCallback } from 'react';
import { SignalingMessage } from '@tabvault/core';
import { LocalIdentity } from '../services/crypto.service.js';
import { SignalingClient } from '../services/signaling.client.js';

export function useWebRTC(identity: LocalIdentity | null, signalingClient: SignalingClient | null) {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

  const getOrCreatePeerConnection = useCallback(
    (targetDeviceId: string, onDataChannelMessage?: (event: MessageEvent) => void): RTCPeerConnection => {
      let pc = peerConnectionsRef.current.get(targetDeviceId);
      if (pc && pc.connectionState !== 'closed' && pc.connectionState !== 'failed') {
        return pc;
      }

      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
        if (onDataChannelMessage) {
          channel.onmessage = onDataChannelMessage;
        }
        dataChannelsRef.current.set(targetDeviceId, channel);
      };

      peerConnectionsRef.current.set(targetDeviceId, pc);
      return pc;
    },
    [identity, signalingClient]
  );

  return {
    getOrCreatePeerConnection,
    peerConnections: peerConnectionsRef.current,
    dataChannels: dataChannelsRef.current,
  };
}
