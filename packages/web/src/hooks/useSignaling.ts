import { useState, useEffect, useRef } from 'react';
import { DeviceInfo, SignalingMessage } from '@tabvault/core';
import { LocalIdentity, WebCryptoService } from '../services/crypto.service.js';
import { SignalingClient } from '../services/signaling.client.js';

const LIVE_WS_ENDPOINT = 'wss://id1j2eilb0.execute-api.ap-south-1.amazonaws.com/prod';

export function useSignaling(identity: LocalIdentity | null, wsUrl?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);
  const signalingClientRef = useRef<SignalingClient | null>(null);

  useEffect(() => {
    if (!identity) return;

    const host = window.location.hostname;
    // Connect to live AWS API Gateway WebSocket when deployed on Amplify or remote
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const defaultWsUrl = isLocalhost
      ? `ws://${host}:${window.location.port === '5173' ? '8080' : window.location.port}/ws`
      : LIVE_WS_ENDPOINT;

    const targetUrl = wsUrl || defaultWsUrl;

    const localDeviceInfo: DeviceInfo = {
      deviceId: identity.deviceId,
      deviceName: identity.deviceName,
      platform: WebCryptoService.detectPlatform(),
      publicKeyBase64: identity.publicKeyBase64,
      status: 'online_local',
      lastSeen: Date.now(),
    };

    const client = new SignalingClient(targetUrl, identity.vaultId, localDeviceInfo);
    signalingClientRef.current = client;

    const unsubscribeStatus = client.onStatus((connected) => {
      setIsConnected(connected);
    });

    const unsubscribePresence = client.onPresence((devices) => {
      const peers = devices.filter((d) => d.deviceId !== identity.deviceId);
      setActiveDevices(peers);
    });

    client.connect();

    return () => {
      unsubscribeStatus();
      unsubscribePresence();
      client.disconnect();
      signalingClientRef.current = null;
    };
  }, [identity, wsUrl]);

  const sendMessage = (msg: SignalingMessage) => {
    return signalingClientRef.current?.send(msg) ?? false;
  };

  return {
    isConnected,
    activeDevices,
    signalingClient: signalingClientRef.current,
    sendMessage,
  };
}
