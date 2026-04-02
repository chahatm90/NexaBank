import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { customerApi } from '../services/api.js';
import { Card, Button, Input, PageHeader } from '../components/common/UI.jsx';
import toast from 'react-hot-toast';

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', nationalId: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await customerApi.create(form);
      toast.success('Customer created successfully!');
      navigate('/customers');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })); };

  return (
    <div className="animate-fade" style={{ maxWidth: 600 }}>
      <PageHeader
        title="New Customer"
        subtitle="Register a new banking customer"
        action={<Button variant="ghost" onClick={() => navigate('/customers')}><ArrowLeft size={15} /> Back</Button>}
      />

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Input label="First Name *" placeholder="John" value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
            <Input label="Last Name *" placeholder="Doe" value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Input label="Email Address *" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} error={errors.email} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Input label="Phone Number" placeholder="+1-555-0100" value={form.phone} onChange={set('phone')} />
            <Input label="National ID" placeholder="Optional" value={form.nationalId} onChange={set('nationalId')} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <Input label="Address" placeholder="123 Main Street, City, State" value={form.address} onChange={set('address')} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button type="submit" disabled={saving} style={{ flex: 1 }}>
              <UserPlus size={15} /> {saving ? 'Creating…' : 'Create Customer'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/customers')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
