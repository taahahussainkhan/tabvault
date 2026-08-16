import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    border: 'none',
    outline: 'none',
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '10px 18px', fontSize: '14px' },
    lg: { padding: '14px 24px', fontSize: '16px' },
  }[size];

  const variantStyles = {
    primary: {
      background: 'var(--gradient-primary)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-glow)',
    },
    secondary: {
      background: 'var(--bg-surface-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.08)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-medium)',
      backdropFilter: 'blur(8px)',
    },
    danger: {
      background: 'rgba(244, 63, 94, 0.2)',
      color: '#f43f5e',
      border: '1px solid rgba(244, 63, 94, 0.4)',
    },
  }[variant];

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles,
        ...variantStyles,
        ...style,
      }}
      className={className}
      {...props}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};
