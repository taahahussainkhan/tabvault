import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { LocalIdentity } from '../../services/crypto.service.js';
import { Modal, Icon, Button } from '../common/index.js';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: LocalIdentity | null;
  onJoinVault: (newVaultId: string) => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  identity,
  onJoinVault,
}) => {
  const [syncCode, setSyncCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !identity) return;

    // Generate local 6-digit sync code
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSyncCode(randomCode);

    // Render QR Code onto canvas
    const pairingUrl = `${window.location.origin}/?vaultId=${identity.vaultId}&code=${randomCode}`;
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, pairingUrl, {
        width: 180,
        margin: 2,
        color: {
          dark: '#0f1420',
          light: '#ffffff',
        },
      });
    }
  }, [isOpen, identity]);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length >= 4) {
      onJoinVault(`vault_${inputCode.trim()}`);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pair New Device">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        {/* QR Code Canvas */}
        <div
          style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <canvas ref={qrCanvasRef} style={{ display: 'block' }} />
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Scan this QR code with your iPhone or Android camera to pair instantly.
        </p>

        {/* 6-Digit Sync Code */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            padding: '14px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Or use 6-Digit Sync Code:</span>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '4px',
              color: 'var(--accent-cyan)',
            }}
          >
            {syncCode}
          </span>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)' }} />

        {/* Manual Join Input */}
        <form onSubmit={handleJoinByCode} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Enter Sync Code / Vault ID from another device:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. 849201"
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <Button type="submit" size="md" variant="primary">
              Join
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
