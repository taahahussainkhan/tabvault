import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'glass';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'glass', className = '' }) => {
  const variantStyles = {
    glass: {
      background: 'rgba(255, 255, 255, 0.08)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
    },
    primary: {
      background: 'rgba(99, 102, 241, 0.15)',
      color: '#818cf8',
      border: '1px solid rgba(99, 102, 241, 0.3)',
    },
    success: {
      background: 'rgba(16, 185, 129, 0.15)',
      color: '#34d399',
      border: '1px solid rgba(16, 185, 129, 0.3)',
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.15)',
      color: '#fbbf24',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
    info: {
      background: 'rgba(6, 182, 212, 0.15)',
      color: '#22d3ee',
      border: '1px solid rgba(6, 182, 212, 0.3)',
    },
  }[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        ...variantStyles,
      }}
      className={className}
    >
      {children}
    </span>
  );
};
