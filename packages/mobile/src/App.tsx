import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Alert, Platform } from 'react-native';
import { DeviceInfo } from '@tabvault/core';
import { Header, QRScannerModal, ClipboardFeed, MobileClipboardItem } from './components';
import { MobileSignalingClient } from './services';
import { MOBILE_CONFIG } from './config/app.config';

export function App() {
  const [vaultId, setVaultId] = useState<string>('vault_demo');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activePeers, setActivePeers] = useState<DeviceInfo[]>([]);
  const [clipboardItems, setClipboardItems] = useState<MobileClipboardItem[]>([
    {
      id: 'clip_welcome',
      text: '⚡ TabVault Mobile Client Initialized - Ready to Pair!',
      senderName: 'System',
      timestamp: Date.now(),
    },
  ]);

  const localDeviceRef = useRef<DeviceInfo>({
    deviceId: `dev_android_${Math.random().toString(36).substring(2, 9)}`,
    deviceName: `Android Phone (${Platform.OS})`,
    platform: 'android',
    publicKeyBase64: '',
    status: 'online_local',
    lastSeen: Date.now(),
  });

  const clientRef = useRef<MobileSignalingClient | null>(null);

  // Initialize and maintain WebSocket connection
  useEffect(() => {
    const client = new MobileSignalingClient(
      MOBILE_CONFIG.DEFAULT_SIGNALING_URL,
      vaultId,
      localDeviceRef.current
    );
    clientRef.current = client;

    const unsubStatus = client.onStatus((connected) => {
      setIsConnected(connected);
    });

    const unsubPresence = client.onPresence((devices) => {
      const peers = devices.filter((d) => d.deviceId !== localDeviceRef.current.deviceId);
      setActivePeers(peers);
    });

    const unsubMessage = client.onMessage((msg) => {
      if (msg.type === 'clipboard:sync' || (msg as any).type === 'clipboard') {
        const payload = msg.payload as { text?: string; senderName?: string } | string;
        const text = typeof payload === 'string' ? payload : payload.text || '';
        const senderName = typeof payload === 'object' ? payload.senderName || 'Web Device' : 'Web Device';

        if (text) {
          setClipboardItems((prev) => [
            {
              id: `clip_${Date.now()}`,
              text,
              senderName,
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }
      }
    });

    client.connect();

    return () => {
      unsubStatus();
      unsubPresence();
      unsubMessage();
      client.disconnect();
      clientRef.current = null;
    };
  }, [vaultId]);

  const handleScanSuccess = (rawScannedData: string) => {
    try {
      let extractedVaultId = rawScannedData.trim();

      // Check if scanned QR data is a full URL e.g. https://.../?vaultId=vault_xxx&code=123
      const match = rawScannedData.match(/[?&]vaultId=([^&]+)/);
      if (match && match[1]) {
        extractedVaultId = decodeURIComponent(match[1]);
      } else if (rawScannedData.startsWith('http')) {
        const url = new URL(rawScannedData);
        const queryVault = url.searchParams.get('vaultId');
        if (queryVault) {
          extractedVaultId = queryVault;
        }
      }

      setVaultId(extractedVaultId);
      Alert.alert(
        '🎉 Pairing Successful!',
        `Connected to Vault: ${extractedVaultId.substring(0, 16)}...\nYour mobile device will now appear on the Desktop Radar.`,
        [{ text: 'OK' }]
      );
    } catch {
      setVaultId(rawScannedData);
      Alert.alert('🎉 Paired!', `Connected to ${rawScannedData}`);
    }
  };

  const handleSendClipboardText = (text: string) => {
    // 1. Add locally
    setClipboardItems((prev) => [
      {
        id: `clip_${Date.now()}`,
        text,
        senderName: 'This Android Phone',
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    // 2. Broadcast over WebSocket to all devices in the vault
    clientRef.current?.send({
      type: 'clipboard:sync',
      vaultId,
      senderDeviceId: localDeviceRef.current.deviceId,
      payload: {
        text,
        senderName: localDeviceRef.current.deviceName,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1420" />
      <Header
        vaultId={vaultId}
        isConnected={isConnected}
        onOpenScan={() => setIsScannerOpen(true)}
      />
      <ClipboardFeed
        items={clipboardItems}
        onSendText={handleSendClipboardText}
      />
      <QRScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </View>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090e',
  },
});
