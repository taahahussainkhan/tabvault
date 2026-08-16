import React from 'react';
import { ClipboardEntry } from '../../hooks/useUniversalClipboard.js';
import { Icon, Button } from '../common/index.js';

interface ClipboardCardProps {
  entry: ClipboardEntry;
  onCopy: (entry: ClipboardEntry) => void;
}

export const ClipboardCard: React.FC<ClipboardCardProps> = ({ entry, onCopy }) => {
  const isUrl = entry.text.startsWith('http://') || entry.text.startsWith('https://');

  const formatTime = (timestamp: number): string => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--primary-500)',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {entry.senderDeviceName}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formatTime(entry.timestamp)}
          </span>
        </div>

        <Button
          size="sm"
          variant={entry.isCopied ? 'primary' : 'glass'}
          icon={<Icon name={entry.isCopied ? 'check' : 'copy'} size={14} />}
          onClick={() => onCopy(entry)}
        >
          {entry.isCopied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      <div
        style={{
          background: 'rgba(7, 9, 14, 0.5)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          fontFamily: isUrl ? 'var(--font-mono)' : 'inherit',
          color: isUrl ? 'var(--accent-cyan)' : 'var(--text-primary)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          maxHeight: '160px',
          overflowY: 'auto',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {entry.text}
      </div>
    </div>
  );
};
