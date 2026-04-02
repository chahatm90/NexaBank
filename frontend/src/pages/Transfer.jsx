import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight, CheckCircle } from 'lucide-react';
import { accountApi, transactionApi } from '../services/api.js';
import { Card, Button, Input, Select, PageHeader, LoadingState } from '../components/common/UI.jsx';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'transfer',  label: 'Transfer',   icon: ArrowLeftRight },
  { id: 'deposit',   label: 'Deposit',    icon: ArrowDownRight },
  { id: 'withdraw',  label: 'Withdraw',   icon: ArrowUpRight },
];

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0);

export default function Transfer() {
  const [tab, setTab] = useState('transfer');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({ sourceAccountId: '', destinationAccountId: '', accountId: '', amount: '', description: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    accountApi.getAll()
      .then(r => {
        const list = r.data?.data || [];
        setAccounts(list);
        if (list.length) {
          setForm(f => ({ ...f, sourceAccountId: list[0].id, accountId: list[0].id, destinationAccountId: list[1]?.id || '' }));
        }
      })
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const e = {};
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt)) e.amount = 'Enter a valid amount';
    else if (amt <= 0) e.amount = 'Amount must be greater than 0';

    if (tab === 'transfer') {
      if (!form.sourceAccountId) e.sourceAccountId = 'Select source account';
      if (!form.destinationAccountId) e.destinationAccountId = 'Select destination account';
      if (form.sourceAccountId && form.destinationAccountId && form.sourceAccountId === form.destinationAccountId)
        e.destinationAccountId = 'Must be different from source';
    } else {
      if (!form.accountId) e.accountId = 'Select an account';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setSuccess(null);
    try {
      let result;
      const amt = parseFloat(form.amount);
      if (tab === 'deposit') {
        result = await transactionApi.deposit({ accountId: form.accountId, amount: amt, description: form.description });
      } else if (tab === 'withdraw') {
        result = await transactionApi.withdraw({ accountId: form.accountId, amount: amt, description: form.description });
      } else {
        result = await transactionApi.transfer({ sourceAccountId: form.sourceAccountId, destinationAccountId: form.destinationAccountId, amount: amt, description: form.description });
      }
      setSuccess(result.data?.data);
      setForm(f => ({ ...f, amount: '', description: '' }));
      toast.success('Transaction completed!');
      // Refresh accounts
      accountApi.getAll().then(r => setAccounts(r.data?.data || []));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })); };

  const srcAccount = accounts.find(a => a.id === form.sourceAccountId);
  const dstAccount = accounts.find(a => a.id === form.destinationAccountId);
  const selAccount = accounts.find(a => a.id === form.accountId);

  if (loading) return <LoadingState />;

  return (
    <div className="animate-fade" style={{ maxWidth: 600 }}>
      <PageHeader title="Money Operations" subtitle="Transfer, deposit, or withdraw funds" />

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 4, padding: 4, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        marginBottom: 24,
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); setSuccess(null); setErrors({}); }} style={{
            flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
            background: tab === id ? 'var(--accent-blue)' : 'transparent',
            color: tab === id ? 'white' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s ease',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Success state */}
      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <CheckCircle size={22} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--accent-green-light)' }}>Transaction Successful</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span>Ref: <code style={{ fontFamily: 'monospace' }}>{success.transactionRef}</code></span>
              <span>Amount: <strong>{fmtCurrency(success.amount)}</strong></span>
              {success.balanceAfter !== undefined && <span>New Balance: <strong>{fmtCurrency(success.balanceAfter)}</strong></span>}
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tab === 'transfer' ? (
              <>
                <Select label="From Account *" value={form.sourceAccountId} onChange={set('sourceAccountId')} error={errors.sourceAccountId}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountType} ({fmtCurrency(a.balance)})</option>)}
                </Select>

                {/* Arrow indicator */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowDownRight size={16} color="var(--accent-blue)" />
                  </div>
                </div>

                <Select label="To Account *" value={form.destinationAccountId} onChange={set('destinationAccountId')} error={errors.destinationAccountId}>
                  <option value="">— Select destination —</option>
                  {accounts.filter(a => a.id !== form.sourceAccountId).map(a =>
                    <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountType} ({fmtCurrency(a.balance)})</option>
                  )}
                </Select>
              </>
            ) : (
              <Select label="Account *" value={form.accountId} onChange={set('accountId')} error={errors.accountId}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountType} ({fmtCurrency(a.balance)})</option>)}
              </Select>
            )}

            <Input label="Amount (USD) *" type="number" min="0.01" step="0.01"
              placeholder="0.00" value={form.amount} onChange={set('amount')} error={errors.amount} />

            <Input label="Description" placeholder="Optional note…" value={form.description} onChange={set('description')} />
          </div>

          {/* Preview */}
          {form.amount && !isNaN(parseFloat(form.amount)) && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>TRANSACTION PREVIEW</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tab === 'transfer' && srcAccount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>From balance</span>
                    <span style={{ color: 'var(--accent-red)' }}>{fmtCurrency(srcAccount.balance)} → {fmtCurrency(srcAccount.balance - parseFloat(form.amount || 0))}</span>
                  </div>
                )}
                {tab === 'transfer' && dstAccount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>To balance</span>
                    <span style={{ color: 'var(--accent-green)' }}>{fmtCurrency(dstAccount.balance)} → {fmtCurrency(dstAccount.balance + parseFloat(form.amount || 0))}</span>
                  </div>
                )}
                {tab !== 'transfer' && selAccount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>New balance</span>
                    <span style={{ color: tab === 'deposit' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {fmtCurrency(tab === 'deposit'
                        ? selAccount.balance + parseFloat(form.amount || 0)
                        : selAccount.balance - parseFloat(form.amount || 0))}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span>Amount</span>
                  <span>{fmtCurrency(parseFloat(form.amount))}</span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={saving || accounts.length === 0} style={{ width: '100%', marginTop: 20, justifyContent: 'center' }} size="lg">
            {saving ? 'Processing…' : tab === 'transfer' ? '→ Execute Transfer' : tab === 'deposit' ? '↓ Deposit Funds' : '↑ Withdraw Funds'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
