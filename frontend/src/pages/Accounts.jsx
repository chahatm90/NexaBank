import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CreditCard, TrendingUp } from 'lucide-react';
import { accountApi } from '../services/api.js';
import { Card, Badge, LoadingState, Button, PageHeader, EmptyState } from '../components/common/UI.jsx';
import toast from 'react-hot-toast';

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0);

const typeColor = (type) => {
  const m = { CHECKING: 'var(--accent-blue)', SAVINGS: 'var(--accent-green)', INVESTMENT: 'var(--accent-purple)', LOAN: 'var(--accent-yellow)' };
  return m[type] || 'var(--accent-blue)';
};

const typeVariant = (type) => {
  const m = { CHECKING: 'default', SAVINGS: 'success', INVESTMENT: 'purple', LOAN: 'warning' };
  return m[type] || 'default';
};

export default function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountApi.getAll()
      .then(r => setAccounts(r.data?.data || []))
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="animate-fade">
      <PageHeader
        title="Accounts"
        subtitle={`${accounts.length} accounts · Total ${fmtCurrency(totalBalance)}`}
        action={<Button onClick={() => navigate('/accounts/new')}><PlusCircle size={15} /> New Account</Button>}
      />

      {accounts.length === 0 ? (
        <Card>
          <EmptyState icon={CreditCard} title="No accounts yet" description="Create the first bank account to get started" />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {accounts.map(acc => {
            const color = typeColor(acc.accountType);
            return (
              <div key={acc.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.4)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Card top bar */}
                <div style={{ height: 4, background: color }} />
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CreditCard size={19} color={color} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge variant={typeVariant(acc.accountType)}>{acc.accountType}</Badge>
                      <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'danger'}>{acc.status}</Badge>
                    </div>
                  </div>

                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
                    {fmtCurrency(acc.balance)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                    Available Balance · {acc.currency}
                  </div>

                  <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Account Number</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                      {acc.accountNumber}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    Opened {new Date(acc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
