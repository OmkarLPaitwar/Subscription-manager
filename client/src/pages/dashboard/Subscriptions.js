import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Productivity','Development','Design','Communication','Storage','Entertainment','Finance','Marketing','Security','Analytics','HR','Other'];
const CYCLES     = ['Monthly','Annual','Quarterly','Weekly','One-time'];
const ICONS      = { Netflix:'🎬', AWS:'☁️', Figma:'🎨', GitHub:'💻', Notion:'📝', Slack:'💬', ChatGPT:'🤖', Adobe:'🅰️', Zoom:'📹', Canva:'🖼️', Spotify:'🎵', Google:'📧', Microsoft:'🖥️', Loom:'📽️', Jira:'📋', Linear:'📐', Vercel:'▲', Stripe:'💳' };

const SEED_SUBS = [
  { name:'Netflix',        category:'Entertainment', cost:649,  billingCycle:'Monthly',  renewalDate:'2025-05-03', icon:'🎬', color:'#e50914', paymentMethod:'Visa ••4242' },
  { name:'AWS',            category:'Development',   cost:8420, billingCycle:'Monthly',  renewalDate:'2025-05-08', icon:'☁️', color:'#ff9900', paymentMethod:'Visa ••4242' },
  { name:'Figma',          category:'Design',        cost:1699, billingCycle:'Monthly',  renewalDate:'2025-05-15', icon:'🎨', color:'#f24e1e', paymentMethod:'Mastercard ••1234' },
  { name:'GitHub Pro',     category:'Development',   cost:349,  billingCycle:'Monthly',  renewalDate:'2025-05-20', icon:'💻', color:'#333',    paymentMethod:'Visa ••4242' },
  { name:'Notion',         category:'Productivity',  cost:799,  billingCycle:'Monthly',  renewalDate:'2025-05-22', icon:'📝', color:'#000',    paymentMethod:'UPI' },
  { name:'Slack',          category:'Communication', cost:1299, billingCycle:'Monthly',  renewalDate:'2025-05-25', icon:'💬', color:'#4a154b', paymentMethod:'Visa ••4242' },
  { name:'ChatGPT Plus',   category:'Productivity',  cost:1699, billingCycle:'Monthly',  renewalDate:'2025-06-01', icon:'🤖', color:'#10a37f', paymentMethod:'Mastercard ••1234' },
  { name:'Adobe CC',       category:'Design',        cost:3499, billingCycle:'Monthly',  renewalDate:'2025-06-05', icon:'🅰️', color:'#e8192c', paymentMethod:'Visa ••4242' },
  { name:'Zoom Pro',       category:'Communication', cost:1099, billingCycle:'Monthly',  renewalDate:'2025-06-10', icon:'📹', color:'#2d8cff', paymentMethod:'UPI' },
  { name:'Canva Pro',      category:'Design',        cost:999,  billingCycle:'Monthly',  renewalDate:'2025-06-12', icon:'🖼️', color:'#7d2ae8', paymentMethod:'Visa ••4242', status:'Paused' },
  { name:'Spotify',        category:'Entertainment', cost:119,  billingCycle:'Monthly',  renewalDate:'2025-06-14', icon:'🎵', color:'#1db954', paymentMethod:'UPI' },
  { name:'Google Workspace', category:'Productivity', cost:1150, billingCycle:'Monthly', renewalDate:'2025-06-18', icon:'📧', color:'#4285f4', paymentMethod:'Visa ••4242' },
  { name:'Microsoft 365',  category:'Productivity',  cost:649,  billingCycle:'Annual',   renewalDate:'2026-01-15', icon:'🖥️', color:'#f25022', paymentMethod:'Mastercard ••1234' },
  { name:'Loom',           category:'Communication', cost:699,  billingCycle:'Monthly',  renewalDate:'2025-06-20', icon:'📽️', color:'#625df5', paymentMethod:'Visa ••4242', status:'Paused' },
];

const emptyForm = { name:'', category:'Productivity', cost:'', billingCycle:'Monthly', renewalDate:'', paymentMethod:'Visa ••4242', icon:'🔷', color:'#4f8ef7', notes:'' };

export default function Subscriptions() {
  const [subs, setSubs]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await subscriptionAPI.getAll();
      setSubs(data.data);
      setFiltered(data.data);
    } catch { toast.error('Failed to load subscriptions.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter
  useEffect(() => {
    let f = [...subs];
    if (search)       f = f.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    if (catFilter)    f = f.filter(s => s.category === catFilter);
    if (statusFilter) f = f.filter(s => s.status === statusFilter);
    setFiltered(f);
  }, [search, catFilter, statusFilter, subs]);

  const openAdd  = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = (sub) => {
    setEditId(sub.id);
    setForm({ name: sub.name, category: sub.category, cost: sub.cost, billingCycle: sub.billingCycle,
              renewalDate: sub.renewalDate?.slice(0,10) || '', paymentMethod: sub.paymentMethod || '',
              icon: sub.icon || '🔷', color: sub.color || '#4f8ef7', notes: sub.notes || '' });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.cost || !form.renewalDate) return toast.error('Name, cost, and renewal date are required.');
    setSaving(true);
    try {
      if (editId) {
        await subscriptionAPI.update(editId, { ...form, cost: parseFloat(form.cost) });
        toast.success('Subscription updated!');
      } else {
        await subscriptionAPI.create({ ...form, cost: parseFloat(form.cost) });
        toast.success(`${form.name} added!`);
      }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Cancel "${name}"? This cannot be undone.`)) return;
    try {
      await subscriptionAPI.remove(id);
      toast.success(`${name} removed.`);
      load();
    } catch { toast.error('Failed to delete.'); }
  };

  const handleStatusToggle = async (sub) => {
    const newStatus = sub.status === 'Active' ? 'Paused' : 'Active';
    try {
      await subscriptionAPI.updateStatus(sub.id, newStatus);
      toast.success(`${sub.name} ${newStatus.toLowerCase()}.`);
      load();
    } catch { toast.error('Failed to update status.'); }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      await subscriptionAPI.bulkImport({ subscriptions: SEED_SUBS });
      toast.success('14 sample subscriptions added!');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Seed failed.'); }
    finally { setSeeding(false); }
  };

  const totalMonthly = filtered.filter(s => s.status === 'Active').reduce((sum, s) => sum + (s.monthlyCost || s.cost), 0);

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ animation:'fadeUp .4s ease' }}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.pageTitle}>My Subscriptions</h2>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>{filtered.length} subscriptions · ₹{Math.round(totalMonthly).toLocaleString()}/mo active</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {subs.length === 0 && <button className="btn btn-outline" onClick={seedData} disabled={seeding}>{seeding ? '⏳ Adding…' : '✨ Add Sample Data'}</button>}
          <button className="btn btn-primary" onClick={openAdd}>+ Add Subscription</button>
        </div>
      </div>

      {/* Filters */}
      <div style={S.filters}>
        <input className="input" style={{ width:220 }} placeholder="🔍  Search subscriptions…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select" style={{ width:'auto' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="select" style={{ width:'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option><option>Paused</option><option>Cancelled</option>
        </select>
        {(search || catFilter || statusFilter) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter(''); }}>Clear ×</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center' }}>
            <div className="animate-spin" style={{ fontSize:24, marginBottom:12 }}>⏳</div>
            <p style={{ color:'var(--text2)' }}>Loading subscriptions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
            <h3 style={{ marginBottom:8 }}>No subscriptions found</h3>
            <p style={{ color:'var(--text2)', fontSize:14, marginBottom:20 }}>{subs.length === 0 ? 'Start by adding your first subscription or load sample data.' : 'Try adjusting your filters.'}</p>
            {subs.length === 0 && <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-outline" onClick={seedData} disabled={seeding}>{seeding ? '⏳' : '✨ Load Sample Data'}</button>
              <button className="btn btn-primary" onClick={openAdd}>+ Add Subscription</button>
            </div>}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Service</th><th>Category</th><th>Monthly Cost</th>
                  <th>Billing</th><th>Renewal Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => {
                  const days = Math.ceil((new Date(sub.renewalDate) - new Date()) / 86400000);
                  const urgency = days <= 3 ? 'var(--red)' : days <= 7 ? 'var(--amber)' : 'var(--text2)';
                  return (
                    <tr key={sub.id}>
                      <td data-label="Service">
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{sub.icon || '📦'}</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14 }}>{sub.name}</div>
                            <div style={{ fontSize:11, color:'var(--text3)' }}>{sub.paymentMethod}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Category"><span className="badge badge-blue">{sub.category}</span></td>
                      <td data-label="Monthly Cost" style={{ fontWeight:700 }}>₹{(sub.monthlyCost || sub.cost).toLocaleString()}</td>
                      <td data-label="Billing" style={{ color:'var(--text2)', fontSize:13 }}>{sub.billingCycle}</td>
                      <td data-label="Renewal Date">
                        <div style={{ fontSize:13, color: urgency, fontWeight: days <= 7 ? 600 : 400 }}>
                          {new Date(sub.renewalDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          {days <= 7 && days > 0 && <div style={{ fontSize:10 }}>({days}d left)</div>}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`badge ${sub.status === 'Active' ? 'badge-green' : sub.status === 'Paused' ? 'badge-amber' : 'badge-red'}`}>
                          {sub.status === 'Active' ? '● ' : '○ '}{sub.status}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <button className="btn btn-outline btn-sm" style={{ marginRight:6 }} onClick={() => openEdit(sub)}>Edit</button>
                        <button className="btn btn-outline btn-sm" style={{ marginRight:6 }} onClick={() => handleStatusToggle(sub)}>
                          {sub.status === 'Active' ? 'Pause' : 'Resume'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sub.id, sub.name)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.2rem' }}>{editId ? 'Edit Subscription' : 'Add Subscription'}</h3>
              <button onClick={() => setModal(false)} style={{ width:30, height:30, borderRadius:'50%', background:'var(--bg3)', border:'1px solid var(--border2)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">Service Name *</label>
                  <input className="input" placeholder="e.g. Notion" value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Billing Cycle</label>
                  <select className="select" value={form.billingCycle} onChange={set('billingCycle')}>
                    {CYCLES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cost (₹) *</label>
                  <input className="input" type="number" placeholder="999" min="0" value={form.cost} onChange={set('cost')} required />
                </div>
                <div>
                  <label className="label">Renewal Date *</label>
                  <input className="input" type="date" value={form.renewalDate} onChange={set('renewalDate')} required />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select className="select" value={form.paymentMethod} onChange={set('paymentMethod')}>
                    <option>Visa ••4242</option><option>Mastercard ••1234</option><option>UPI</option><option>Net Banking</option>
                  </select>
                </div>
                <div>
                  <label className="label">Icon Emoji</label>
                  <input className="input" placeholder="🔷" value={form.icon} onChange={set('icon')} maxLength={4} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">Notes (optional)</label>
                  <textarea className="textarea" rows={2} placeholder="Any notes about this subscription…" value={form.notes} onChange={set('notes')} style={{ resize:'vertical' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button className="btn btn-outline" style={{ flex:1 }} type="button" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:2 }} type="submit" disabled={saving}>
                  {saving ? '⏳ Saving…' : editId ? 'Update Subscription' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 },
  pageTitle: { fontFamily:'Syne,sans-serif', fontSize:'1.4rem', fontWeight:800 },
  filters:   { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' },
};
