import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Phone, User } from 'lucide-react';
import { customerApi } from '../services/api.js';
import { Card, Badge, LoadingState, Button, PageHeader, EmptyState, Input } from '../components/common/UI.jsx';
import toast from 'react-hot-toast';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    customerApi.getAll()
      .then(r => setCustomers(r.data?.data || []))
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await customerApi.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Customer deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = customers.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState />;

  return (
    <div className="animate-fade">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} total customers`}
        action={<Button onClick={() => navigate('/customers/new')}><UserPlus size={15} /> Add Customer</Button>}
      />

      <div style={{ marginBottom: 20 }}>
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={User} title="No customers found" description="Add your first customer to get started" />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <Card key={c.id} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--gradient-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, color: 'white', flexShrink: 0,
                }}>
                  {c.firstName?.[0]}{c.lastName?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.firstName} {c.lastName}</div>
                  <Badge variant={c.status === 'ACTIVE' ? 'success' : 'warning'}>{c.status}</Badge>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Mail size={13} color="var(--text-muted)" />{c.email}
                </div>
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Phone size={13} color="var(--text-muted)" />{c.phone}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Joined {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    padding: '5px 12px', borderRadius: '8px', fontSize: 12, fontWeight: 600,
                    background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)',
                    border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer'
                  }}>
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}