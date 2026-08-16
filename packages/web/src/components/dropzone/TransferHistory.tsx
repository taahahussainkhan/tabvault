import React from 'react';
import { TransferProgress as ITransferProgress } from '@tabvault/core';
import { Icon, Badge } from '../common/index.js';

interface TransferHistoryProps {
  transfers: ITransferProgress[];
}

export const TransferHistory: React.FC<TransferHistoryProps> = ({ transfers }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (transfers.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <Icon name="history" size={32} className="text-gray-500 mb-2" />
        <p style={{ fontSize: '14px', marginTop: '8px' }}>No transfers recorded in this session yet.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Transfer Activity</h3>
      {transfers.map((item) => (
        <div
          key={item.transferId}
          className="glass-card"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
              }}
            >
              <Icon name="check" size={16} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.fileName}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatBytes(item.fileSize)} • {item.chunksCompleted} chunks verified
              </p>
            </div>
          </div>

          <Badge variant="success">Completed</Badge>
        </div>
      ))}
    </div>
  );
};
