import React from 'react';
import { Icon, IconName } from '../common/index.js';

export type TabKey = 'radar' | 'drop' | 'clipboard' | 'history';

interface NavigationTabsProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  deviceCount: number;
  clipboardCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  deviceCount,
  clipboardCount,
}) => {
  const tabs: { key: TabKey; label: string; icon: IconName; count?: number }[] = [
    { key: 'radar', label: 'Device Radar', icon: 'radar', count: deviceCount },
    { key: 'drop', label: 'File Dropzone', icon: 'upload' },
    { key: 'clipboard', label: 'Universal Clipboard', icon: 'clipboard', count: clipboardCount },
    { key: 'history', label: 'Transfers', icon: 'history' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        margin: '20px auto 32px auto',
        maxWidth: '680px',
        padding: '6px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelectTab(tab.key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: isActive ? 'var(--primary-600)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
            }}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
