import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { accountApi, customerApi } from '../services/api.js';
import { Card, Button, Input, Select, PageHeader } from '../components/common/UI.jsx';
import toast from 'react-hot-toast';

export default function CreateAccount() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customerId: '', accountType: 'CHECKING', initialDeposit: '', currency: 'INR' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    customerApi.getAll()
      .then(r => {
        const list = r.data?.data || [];
        setCustomers(list);
        if (list.length) setForm(f => ({ ...f, customerId: list[0].id }));
      })
      .catch(() => toast.error('Failed to load customers'));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Select a customer';
    if (!form.accountType) e.accountType = 'Select account type';
    if (form.initialDeposit && isNaN(parseFloat(form.initialDeposit))) e.initialDeposit = 'Must be a number';
    if (form.initialDeposit && parseFloat(form.initialDeposit) < 0) e.initialDeposit = 'Cannot be negative';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await accountApi.create({
        ...form,
        initialDeposit: form.initialDeposit ? parseFloat(form.initialDeposit) : 0,
      });
      toast.success('Account created successfully!');
      navigate('/accounts');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })); };

  return (
    <div className="animate-fade" style={{ maxWidth: 560 }}>
      <PageHeader
        title="New Account"
        subtitle="Open a new bank account for a customer"
        action={<Button variant="ghost" onClick={() => navigate('/accounts')}><ArrowLeft size={15} /> Back</Button>}
      />

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select label="Customer *" value={form.customerId} onChange={set('customerId')} error={errors.customerId}>
              <option value="">— Select customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
              ))}
            </Select>

            <Select label="Account Type *" value={form.accountType} onChange={set('accountType')} error={errors.accountType}>
              <option value="CHECKING">Checking</option>
              <option value="SAVINGS">Savings</option>
              <option value="INVESTMENT">Investment</option>
              <option value="LOAN">Loan</option>
            </Select>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Initial Deposit" type="number" min="0" step="0.01"
                placeholder="0.00" value={form.initialDeposit} onChange={set('initialDeposit')} error={errors.initialDeposit} />
              <Select label="Currency" value={form.currency} onChange={set('currency')}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </Select>
            </div>
          </div>

          {/* Preview card */}
          {form.accountType && (
            <div style={{
              marginTop: 24, padding: 16, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)', border: '1px solid var(--border-light)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>ACCOUNT PREVIEW</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Type</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{form.accountType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Opening Balance</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: form.currency || 'INR' })
                    .format(parseFloat(form.initialDeposit) || 0)}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button type="submit" disabled={saving || !customers.length} style={{ flex: 1 }}>
              <CreditCard size={15} /> {saving ? 'Opening…' : 'Open Account'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/accounts')}>Cancel</Button>
          </div>

          {customers.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--accent-yellow)', marginTop: 12, textAlign: 'center' }}>
              No customers found. <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/customers/new')}>Create a customer first.</span>
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
