import React, { useState, useEffect } from 'react';
import { DeviceInfo } from '@tabvault/core';
import {
  useVaultIdentity,
  useSignaling,
  useUniversalClipboard,
  useFileTransfer,
} from './hooks/index.js';
import { Header, NavigationTabs, TabKey } from './components/layout/index.js';
import { DeviceRadar } from './components/radar/index.js';
import { FloatingDropzone, TransferProgress, TransferHistory } from './components/dropzone/index.js';
import { ClipboardHub } from './components/clipboard/index.js';
import { PairingModal } from './components/pairing/index.js';

export const App: React.FC = () => {
  const { identity, loading, changeVault } = useVaultIdentity();
  const { isConnected, activeDevices, signalingClient } = useSignaling(identity);
  const { history: clipboardHistory, broadcastClipboard, copyToClipboard } = useUniversalClipboard(
    identity,
    signalingClient
  );
  const { activeTransfers, transferHistory, startTransfer } = useFileTransfer(identity);

  const [activeTab, setActiveTab] = useState<TabKey>('radar');
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [isPairingOpen, setIsPairingOpen] = useState(false);

  // Check URL search parameters for ?vaultId= or ?code=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlVaultId = params.get('vaultId');
    if (urlVaultId && identity && identity.vaultId !== urlVaultId) {
      changeVault(urlVaultId);
    }
  }, [identity, changeVault]);

  const handleSelectDeviceForDrop = (device: DeviceInfo) => {
    setSelectedDevice(device);
    setActiveTab('drop');
  };

  const handleSendFile = (file: File, targetDeviceId: string) => {
    startTransfer(file, targetDeviceId, 'webrtc_lan');
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-app)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}
      >
        Initializing TabVault Secure Enclave...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Top Navbar */}
      <Header
        identity={identity}
        isConnected={isConnected}
        onOpenPairing={() => setIsPairingOpen(true)}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        {/* Navigation Tabs */}
        <NavigationTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          deviceCount={activeDevices.length}
          clipboardCount={clipboardHistory.length}
        />

        {/* Active Transfer Velocity Cards */}
        {activeTransfers.length > 0 && (
          <div style={{ maxWidth: '700px', margin: '0 auto 24px auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTransfers.map((t) => (
              <TransferProgress key={t.transferId} transfer={t} />
            ))}
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'radar' && (
          <DeviceRadar
            identity={identity}
            activeDevices={activeDevices}
            onSelectDeviceForDrop={handleSelectDeviceForDrop}
            onOpenPairing={() => setIsPairingOpen(true)}
          />
        )}

        {activeTab === 'drop' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
            <FloatingDropzone
              activeDevices={activeDevices}
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
              onSendFile={handleSendFile}
            />
            {transferHistory.length > 0 && <TransferHistory transfers={transferHistory} />}
          </div>
        )}

        {activeTab === 'clipboard' && (
          <ClipboardHub
            history={clipboardHistory}
            onBroadcast={broadcastClipboard}
            onCopy={copyToClipboard}
          />
        )}

        {activeTab === 'history' && <TransferHistory transfers={transferHistory} />}
      </main>

      {/* Pairing Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        identity={identity}
        onJoinVault={changeVault}
      />
    </div>
  );
};
