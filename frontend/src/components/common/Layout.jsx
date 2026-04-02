import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  History, Menu, X, Building2, Bell, Settings, ChevronRight
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers',   icon: Users,           label: 'Customers' },
  { to: '/accounts',    icon: CreditCard,      label: 'Accounts' },
  { to: '/transactions',icon: History,         label: 'Transactions' },
  { to: '/transfer',    icon: ArrowLeftRight,  label: 'Transfer' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const pageTitle = NAV.find(n => location.pathname.startsWith(n.to))?.label || 'Banking';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 72,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border)',
          minHeight: 72,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--gradient-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Building2 size={20} color="white" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>NexaBank</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Digital Banking</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                }}>
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {sidebarOpen && <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{label}</span>}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom toggle */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'transparent', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.15s ease',
            }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            {sidebarOpen && <span style={{ fontSize: 13 }}>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: 72, background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Banking</span>
            <ChevronRight size={14} color="var(--text-muted)" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{pageTitle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}>
              <Bell size={16} />
            </button>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--gradient-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: 'white',
              cursor: 'pointer',
            }}>
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
