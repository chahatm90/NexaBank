import React from 'react';

export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent-blue)', trend }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '4px 8px',
            borderRadius: 6,
            background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: trend >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: { bg: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue-light)' },
    success: { bg: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' },
    danger:  { bg: 'rgba(239,68,68,0.1)',  color: 'var(--accent-red)' },
    warning: { bg: 'rgba(245,158,11,0.1)', color: 'var(--accent-yellow)' },
    purple:  { bg: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)' },
  };
  const s = variants[variant] || variants.default;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px',
      borderRadius: 20, background: s.bg, color: s.color,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  );
}

export function Spinner({ size = 24, color = 'var(--accent-blue)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}30`,
      borderTopColor: color,
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

export function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 64 }}>
      <Spinner size={40} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 64, gap: 12, color: 'var(--text-muted)',
    }}>
      {Icon && <Icon size={40} strokeWidth={1} />}
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
      {description && <div style={{ fontSize: 14 }}>{description}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, style = {}, type = 'button' }) {
  const sizes = { sm: { padding: '7px 14px', fontSize: 13 }, md: { padding: '10px 20px', fontSize: 14 }, lg: { padding: '13px 28px', fontSize: 15 } };
  const variants = {
    primary: { background: 'var(--gradient-blue)', color: 'white', border: 'none' },
    secondary: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger: { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizes[size],
        ...variants[variant],
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <input
        {...props}
        style={{
          background: 'var(--bg-input)',
          border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: 14,
          transition: 'border-color 0.15s ease',
          ...style,
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = 'var(--accent-blue)'; }}
        onBlur={e => { if (!error) e.target.style.borderColor = 'var(--border)'; }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        {...props}
        style={{
          background: 'var(--bg-input)',
          border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: 14,
          ...style,
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>{error}</span>}
    </div>
  );
}
