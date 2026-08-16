import React, { useState, useRef } from 'react';
import { DeviceInfo } from '@tabvault/core';
import { Icon, Button } from '../common/index.js';

interface FloatingDropzoneProps {
  activeDevices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  onSendFile: (file: File, targetDeviceId: string) => void;
}

export const FloatingDropzone: React.FC<FloatingDropzoneProps> = ({
  activeDevices,
  selectedDevice,
  onSelectDevice,
  onSendFile,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const targetId = selectedDevice?.deviceId || activeDevices[0]?.deviceId || 'broadcast';
      onSendFile(file, targetId);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const targetId = selectedDevice?.deviceId || activeDevices[0]?.deviceId || 'broadcast';
      onSendFile(file, targetId);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Target Device Selector Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Target Recipient:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeDevices.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No peer devices connected (File will stage in S3)
            </span>
          ) : (
            activeDevices.map((device) => {
              const isSelected = selectedDevice?.deviceId === device.deviceId;
              return (
                <button
                  key={device.deviceId}
                  onClick={() => onSelectDevice(device)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {device.deviceName}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="glass-panel"
        style={{
          border: isDragOver ? '2px dashed var(--accent-cyan)' : '2px dashed var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '60px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragOver ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-surface-glass)',
          boxShadow: isDragOver ? 'var(--shadow-glow-cyan)' : 'var(--shadow-md)',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isDragOver ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragOver ? 'var(--accent-cyan)' : 'var(--primary-500)',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon name="upload" size={28} />
        </div>

        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Drop any file here or click to browse
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Direct P2P over Wi-Fi • Encrypted AES-256-GCM • Zero file size limits
          </p>
        </div>

        <Button variant="secondary" size="md" icon={<Icon name="folder" size={16} />}>
          Select File from Device
        </Button>
      </div>
    </div>
  );
};
