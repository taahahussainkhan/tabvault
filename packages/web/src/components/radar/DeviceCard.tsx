import React from 'react';
import { DeviceInfo } from '@tabvault/core';
import { Icon, Badge, Button } from '../common/index.js';

interface DeviceCardProps {
  device: DeviceInfo;
  onSendFile: (device: DeviceInfo) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onSendFile }) => {
  const getPlatformIcon = () => {
    switch (device.platform) {
      case 'macos':
      case 'windows':
      case 'linux':
        return 'laptop';
      case 'ios':
      case 'android':
        return 'smartphone';
      default:
        return 'laptop';
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-500)',
            }}
          >
            <Icon name={getPlatformIcon()} size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {device.deviceName}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {device.platform} • {device.deviceId.substring(0, 8)}
            </p>
          </div>
        </div>

        <Badge variant="success">
          <Icon name="wifi" size={12} />
          <span>Local P2P</span>
        </Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Active on local Wi-Fi
        </span>
        <Button size="sm" variant="glass" icon={<Icon name="upload" size={14} />} onClick={() => onSendFile(device)}>
          Send File
        </Button>
      </div>
    </div>
  );
};
