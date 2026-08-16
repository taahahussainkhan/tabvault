import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Header, QRScannerModal, ClipboardFeed, MobileClipboardItem } from './components';

export function App() {
  const [vaultId, setVaultId] = useState<string>('vault_demo');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [clipboardItems, setClipboardItems] = useState<MobileClipboardItem[]>([
    {
      id: 'clip_1',
      text: 'https://tabvault.io - Welcome to TabVault Universal Clipboard!',
      senderName: 'MacBook Pro',
      timestamp: Date.now(),
    },
  ]);

  const handleScanSuccess = (data: string) => {
    try {
      if (data.includes('vaultId=')) {
        const url = new URL(data);
        const scannedVaultId = url.searchParams.get('vaultId');
        if (scannedVaultId) {
          setVaultId(scannedVaultId);
        }
      } else {
        setVaultId(data);
      }
    } catch {
      setVaultId(data);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1420" />
      <Header
        vaultId={vaultId}
        isConnected={true}
        onOpenScan={() => setIsScannerOpen(true)}
      />
      <ClipboardFeed
        items={clipboardItems}
        onSendText={(text: string) => {
          setClipboardItems((prev) => [
            {
              id: `clip_${Date.now()}`,
              text,
              senderName: 'This Android Device',
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }}
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
