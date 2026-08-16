import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HeaderProps {
  vaultId: string;
  isConnected: boolean;
  onOpenScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({ vaultId, isConnected, onOpenScan }) => {
  return (
    <View style={styles.container}>
      <View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>TabVault ⚡</Text>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#f59e0b' }]} />
        </View>
        <Text style={styles.vaultText}>Vault: {vaultId ? vaultId.substring(0, 10) : 'Not Paired'}</Text>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={onOpenScan}>
        <Text style={styles.scanButtonText}>📷 Scan QR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f1420',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vaultText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  scanButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
