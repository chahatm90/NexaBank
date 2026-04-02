import React, { useEffect, useState } from 'react';
import { History, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { accountApi, transactionApi } from '../services/api.js';
import { Card, Badge, LoadingState, PageHeader, EmptyState, Select } from '../components/common/UI.jsx';
import toast from 'react-hot-toast';

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const TX_META = {
  DEPOSIT:    { icon: ArrowDownRight, variant: 'success', color: 'var(--accent-green)',  sign: '+' },
  WITHDRAWAL: { icon: ArrowUpRight,   variant: 'danger',  color: 'var(--accent-red)',    sign: '-' },
  TRANSFER:   { icon: ArrowLeftRight, variant: 'default', color: 'var(--accent-blue)',   sign: '~' },
  PAYMENT:    { icon: ArrowUpRight,   variant: 'warning', color: 'var(--accent-yellow)', sign: '-' },
};

export default function Transactions() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    accountApi.getAll()
      .then(r => {
        const list = r.data?.data || [];
        setAccounts(list);
        if (list.length) setSelectedAccount(list[0].id);
      })
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setLoading(true);
    transactionApi.getByAccount(selectedAccount)
      .then(r => setTransactions(r.data?.data || []))
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [selectedAccount]);

  const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.transactionType === filter);
  const account = accounts.find(a => a.id === selectedAccount);

  if (loading && accounts.length === 0) return <LoadingState />;

  return (
    <div className="animate-fade">
      <PageHeader
        title="Transactions"
        subtitle={account ? `${account.accountNumber} · Balance: ${fmtCurrency(account.balance)}` : 'Select an account'}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} style={{ minWidth: 260 }}>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountType}</option>
          ))}
        </Select>
        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 600,
              border: '1px solid var(--border)',
              background: filter === t ? 'var(--accent-blue)' : 'var(--bg-card)',
              color: filter === t ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      {transactions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total In',  val: transactions.filter(t => t.transactionType === 'DEPOSIT').reduce((s, t) => s + t.amount, 0),   color: 'var(--accent-green)' },
            { label: 'Total Out', val: transactions.filter(t => t.transactionType === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0), color: 'var(--accent-red)' },
            { label: 'Transfers', val: transactions.filter(t => t.transactionType === 'TRANSFER').reduce((s, t) => s + t.amount, 0),   color: 'var(--accent-blue)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '14px 18px',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{fmtCurrency(s.val)}</div>
            </div>
          ))}
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={History} title="No transactions" description="Make a deposit or transfer to see transactions here" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Type', 'Reference', 'Description', 'Amount', 'Balance After', 'Date', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => {
                const meta = TX_META[tx.transactionType] || TX_META.TRANSFER;
                const Icon = meta.icon;
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={14} color={meta.color} />
                        </div>
                        <Badge variant={meta.variant}>{tx.transactionType}</Badge>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{tx.transactionRef}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: meta.color }}>
                      {meta.sign}{fmtCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmtCurrency(tx.balanceAfter)}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(tx.createdAt)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}>{tx.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
