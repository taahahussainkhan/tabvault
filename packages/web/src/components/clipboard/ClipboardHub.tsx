import React, { useState } from 'react';
import { ClipboardEntry } from '../../hooks/useUniversalClipboard.js';
import { Icon, Button } from '../common/index.js';
import { ClipboardCard } from './ClipboardCard.js';

interface ClipboardHubProps {
  history: ClipboardEntry[];
  onBroadcast: (text: string) => void;
  onCopy: (entry: ClipboardEntry) => void;
}

export const ClipboardHub: React.FC<ClipboardHubProps> = ({ history, onBroadcast, onCopy }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onBroadcast(inputText);
    setInputText('');
  };

  return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Quick Input Bar */}
      <form onSubmit={handleSend} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Broadcast Text, Snippets, or Links to Paired Devices
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            💡 Tip: Press Ctrl+V / Cmd+V anywhere to auto-beam
          </span>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste text, code, or link here to instantly sync across your Mac, PC, and Phone..."
          rows={3}
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            resize: 'vertical',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" size="sm" variant="primary" icon={<Icon name="zap" size={14} />}>
            Beam to All Devices
          </Button>
        </div>
      </form>

      {/* Clipboard History Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Universal Clipboard Feed ({history.length})</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>End-to-End Encrypted</span>
        </div>

        {history.length === 0 ? (
          <div
            className="glass-panel"
            style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <Icon name="clipboard" size={28} className="text-gray-500 mb-2" />
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              No clipboard items yet. Copy on one device, paste here!
            </p>
          </div>
        ) : (
          history.map((entry) => <ClipboardCard key={entry.id} entry={entry} onCopy={onCopy} />)
        )}
      </div>
    </div>
  );
};
