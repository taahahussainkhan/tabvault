import React from 'react';
import { LocalIdentity } from '../../services/crypto.service.js';
import { Icon, Badge, Button } from '../common/index.js';

interface HeaderProps {
  identity: LocalIdentity | null;
  isConnected: boolean;
  onOpenPairing: () => void;
}

export const Header: React.FC<HeaderProps> = ({ identity, isConnected, onOpenPairing }) => {
  return (
    <header
      className="glass-panel"
      style={{
        margin: '16px auto',
        maxWidth: '1200px',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '16px',
        zIndex: 100,
      }}
    >
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Icon name="zap" size={22} className="text-white" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              TabVault
            </h1>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                fontWeight: 700,
              }}
            >
              E2EE P2P
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Cross-Device Hybrid Hub
          </p>
        </div>
      </div>

      {/* Status & Vault Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Presence Indicator */}
        <Badge variant={isConnected ? 'success' : 'warning'}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#f59e0b',
              display: 'inline-block',
            }}
          />
          {isConnected ? 'Signaling Live' : 'Connecting...'}
        </Badge>

        {/* Vault ID Pill */}
        {identity && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            <Icon name="shield" size={14} />
            <span>{identity.vaultId}</span>
          </div>
        )}

        {/* Pair Device Button */}
        <Button variant="primary" size="sm" icon={<Icon name="qrcode" size={16} />} onClick={onOpenPairing}>
          Pair Device
        </Button>
      </div>
    </header>
  );
};
