import { useState, useEffect, useRef } from 'react';
import { DeviceInfo, SignalingMessage } from '@tabvault/core';
import { LocalIdentity, WebCryptoService } from '../services/crypto.service.js';
import { SignalingClient } from '../services/signaling.client.js';

export function useSignaling(identity: LocalIdentity | null, wsUrl?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);
  const signalingClientRef = useRef<SignalingClient | null>(null);

  useEffect(() => {
    if (!identity) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port === '5173' ? '8080' : window.location.port;
    
    // Auto-connect to live EC2 backend when on Amplify or fallback to local
    const isProductionAmplify = host.includes('amplifyapp.com');
    const defaultWsUrl = isProductionAmplify
      ? 'ws://13.203.219.102:8080/ws'
      : `${protocol}//${host}${port ? `:${port}` : ''}/ws`;
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
      // Filter out local device from active peers list
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
