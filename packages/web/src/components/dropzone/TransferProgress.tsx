import React from 'react';
import { TransferProgress as ITransferProgress } from '@tabvault/core';
import { Icon, Badge } from '../common/index.js';

interface TransferProgressProps {
  transfer: ITransferProgress;
}

export const TransferProgress: React.FC<TransferProgressProps> = ({ transfer }) => {
  const percentage = Math.min(
    100,
    Math.round((transfer.bytesTransferred / (transfer.fileSize || 1)) * 100)
  );

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return `${formatBytes(bytesPerSec)}/s`;
  };

  return (
    <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-500)',
            }}
          >
            <Icon name="upload" size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {transfer.fileName}
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatBytes(transfer.bytesTransferred)} of {formatBytes(transfer.fileSize)} • Chunk {transfer.chunksCompleted}/{transfer.totalChunks}
            </p>
          </div>
        </div>

        <Badge variant={transfer.route === 'webrtc_lan' ? 'success' : 'info'}>
          <Icon name={transfer.route === 'webrtc_lan' ? 'wifi' : 'cloud'} size={12} />
          <span>{transfer.route === 'webrtc_lan' ? 'P2P Wi-Fi' : 'Cloud Relay'}</span>
        </Badge>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.15s ease',
          }}
        />
      </div>

      {/* Velocity & ETA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="zap" size={14} className="text-indigo-400" />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {formatSpeed(transfer.speedBytesPerSec)}
          </span>
        </div>
        <span>
          {transfer.estimatedSecondsRemaining > 0
            ? `${Math.ceil(transfer.estimatedSecondsRemaining)}s remaining`
            : `${percentage}% completed`}
        </span>
      </div>
    </div>
  );
};
