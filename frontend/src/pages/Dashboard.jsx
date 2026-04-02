import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Users, CreditCard, ArrowLeftRight, TrendingUp, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'; // eslint-disable-line
import { customerApi, accountApi, transactionApi } from '../services/api.js';
import { StatCard, Card, Badge, LoadingState, Button, PageHeader } from '../components/common/UI.jsx';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

const fmtCurrency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ customers: [], accounts: [], transactions: [] });

  useEffect(() => {
    (async () => {
      try {
        const [c, a, t] = await Promise.all([
          customerApi.getAll(), accountApi.getAll(), transactionApi.getRecent()
        ]);
        setData({
          customers: c.data?.data || [],
          accounts: a.data?.data || [],
          transactions: t.data?.data || [],
        });
      } catch (e) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;

  const { customers, accounts, transactions } = data;
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE').length;

  // Build balance chart from transactions
  const chartData = transactions.slice().reverse().map((t, i) => ({
    name: fmtDate(t.createdAt),
    amount: parseFloat(t.balanceAfter || 0),
    txn: parseFloat(t.amount || 0),
  }));

  // Account type distribution
  const typeMap = {};
  accounts.forEach(a => { typeMap[a.accountType] = (typeMap[a.accountType] || 0) + 1; });
  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  const txnType = (type) => {
    const map = {
      DEPOSIT: { color: 'var(--accent-green)', icon: ArrowDownRight, variant: 'success' },
      WITHDRAWAL: { color: 'var(--accent-red)', icon: ArrowUpRight, variant: 'danger' },
      TRANSFER: { color: 'var(--accent-blue)', icon: ArrowLeftRight, variant: 'default' },
    };
    return map[type] || map.TRANSFER;
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Dashboard"
        subtitle={`Good morning — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        action={
          <Button onClick={() => navigate('/transfer')} size="sm">
            <Plus size={15} /> New Transfer
          </Button>
        }
      />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={TrendingUp}   label="Total Balance"    value={fmtCurrency(totalBalance)}  color="var(--accent-blue)"   trend={12} />
        <StatCard icon={CreditCard}   label="Active Accounts"  value={activeAccounts}              color="var(--accent-green)"  sub={`of ${accounts.length} total`} />
        <StatCard icon={Users}        label="Customers"        value={customers.length}            color="var(--accent-purple)" trend={8} />
        <StatCard icon={ArrowLeftRight} label="Recent Transactions" value={transactions.length}   color="var(--accent-yellow)" sub="Last 10 recorded" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        <Card>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Balance Trend</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Recent transaction activity</p>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }}
                  formatter={v => [fmtCurrency(v), 'Balance']}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No transaction data yet
            </div>
          )}
        </Card>

        <Card>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Account Types</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Distribution</p>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No account data
            </div>
          )}
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Transactions</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Latest 10 across all accounts</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>View All</Button>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No transactions yet. Make a deposit to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {transactions.map((tx) => {
              const meta = txnType(tx.transactionType);
              const TxIcon = meta.icon;
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${meta.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TxIcon size={16} color={meta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, truncate: true }}>{tx.description || tx.transactionType}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.transactionRef}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: tx.transactionType === 'DEPOSIT' ? 'var(--accent-green)' :
                             tx.transactionType === 'WITHDRAWAL' ? 'var(--accent-red)' : 'var(--text-primary)'
                    }}>
                      {tx.transactionType === 'WITHDRAWAL' ? '-' : '+'}{fmtCurrency(tx.amount)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(tx.createdAt)}</div>
                  </div>
                  <Badge variant={meta.variant}>{tx.transactionType}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
