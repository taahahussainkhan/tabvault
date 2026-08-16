import React from 'react';
import { DeviceInfo } from '@tabvault/core';
import { LocalIdentity } from '../../services/crypto.service.js';
import { Icon } from '../common/index.js';
import { DeviceCard } from './DeviceCard.js';

interface DeviceRadarProps {
  identity: LocalIdentity | null;
  activeDevices: DeviceInfo[];
  onSelectDeviceForDrop: (device: DeviceInfo) => void;
  onOpenPairing: () => void;
}

export const DeviceRadar: React.FC<DeviceRadarProps> = ({
  identity,
  activeDevices,
  onSelectDeviceForDrop,
  onOpenPairing,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
      {/* Radar Sonar Visualizer */}
      <div
        style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px auto',
        }}
      >
        {/* Concentric Radar Rings */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            background: 'var(--gradient-radar)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '35px',
            borderRadius: '50%',
            border: '1px dashed rgba(99, 102, 241, 0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '75px',
            borderRadius: '50%',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        />

        {/* Sonar Pulse Waves */}
        <div
          className="animate-sonar-1"
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '1.5px solid rgba(99, 102, 241, 0.6)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="animate-sonar-2"
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '1.5px solid rgba(6, 182, 212, 0.5)',
            pointerEvents: 'none',
          }}
        />

        {/* Central Local Device Node */}
        <div
          style={{
            zIndex: 10,
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <Icon name="laptop" size={24} />
          <span style={{ fontSize: '9px', fontWeight: 700, marginTop: '2px' }}>YOU</span>
        </div>

        {/* Orbiting Discovered Peers */}
        {activeDevices.map((device, index) => {
          const angle = (index * (360 / Math.max(activeDevices.length, 1)) * Math.PI) / 180;
          const radius = 110;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={device.deviceId}
              onClick={() => onSelectDeviceForDrop(device)}
              className="animate-float"
              style={{
                position: 'absolute',
                transform: `translate(${x}px, ${y}px)`,
                zIndex: 20,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface-elevated)',
                  border: '2px solid var(--accent-cyan)',
                  boxShadow: 'var(--shadow-glow-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Icon name={device.platform === 'ios' || device.platform === 'android' ? 'smartphone' : 'laptop'} size={20} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: 'rgba(7, 9, 14, 0.85)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                }}
              >
                {device.deviceName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Discovered Device Grid & Empty State */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
            Discovered Devices ({activeDevices.length})
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Auto-discovering on local Wi-Fi & Vault
          </span>
        </div>

        {activeDevices.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-500)',
              }}
            >
              <Icon name="radar" size={24} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Scanning for Nearby Devices...</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px' }}>
              Open TabVault in another browser, scan the QR code from your phone, or share the Vault ID to connect.
            </p>
            <button
              onClick={onOpenPairing}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Show Pairing QR Code
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {activeDevices.map((device) => (
              <DeviceCard key={device.deviceId} device={device} onSendFile={onSelectDeviceForDrop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
