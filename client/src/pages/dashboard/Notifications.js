import React, { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const TYPE_META = {
  renewal:            { icon:'🔔', bg:'rgba(79,142,247,.08)',  border:'rgba(79,142,247,.2)',  color:'var(--blue)' },
  price_increase:     { icon:'📈', bg:'rgba(245,158,11,.08)',  border:'rgba(245,158,11,.2)',  color:'var(--amber)' },
  ai_insight:         { icon:'🤖', bg:'rgba(139,92,246,.08)',  border:'rgba(139,92,246,.2)',  color:'var(--purple)' },
  payment_success:    { icon:'✅', bg:'rgba(16,185,129,.08)',  border:'rgba(16,185,129,.2)',  color:'var(--green)' },
  payment_failed:     { icon:'❌', bg:'rgba(244,63,94,.08)',   border:'rgba(244,63,94,.2)',   color:'var(--red)' },
  unused_warning:     { icon:'⚠️', bg:'rgba(244,63,94,.08)',   border:'rgba(244,63,94,.2)',   color:'var(--red)' },
  duplicate_detected: { icon:'🔄', bg:'rgba(245,158,11,.08)',  border:'rgba(245,158,11,.2)',  color:'var(--amber)' },
  savings_opportunity:{ icon:'💰', bg:'rgba(16,185,129,.08)',  border:'rgba(16,185,129,.2)',  color:'var(--green)' },
  system:             { icon:'ℹ️', bg:'rgba(79,142,247,.06)',  border:'rgba(79,142,247,.15)', color:'var(--blue)' },
};

const PRIORITY_COLORS = { urgent:'var(--red)', high:'var(--amber)', medium:'var(--blue)', low:'var(--text3)' };

// Seed notifications for demo
const DEMO_NOTIFS = [
  { type:'renewal', title:'Netflix renews in 3 days', message:'Your Netflix Standard plan will auto-renew on May 3 for ₹649. Ensure your payment method is up to date.', priority:'high', isRead:false, createdAt: new Date(Date.now() - 2*3600000) },
  { type:'price_increase', title:'AWS bill increased by 18%', message:'Your AWS spend jumped from ₹7,140 to ₹8,420 this month. Review your cloud usage to understand the spike.', priority:'high', isRead:false, createdAt: new Date(Date.now() - 5*3600000) },
  { type:'savings_opportunity', title:'Save ₹2,196/year on Zoom', message:'Switching Zoom Pro to annual billing saves you ₹2,196 per year. Act before your next monthly renewal on June 10.', priority:'medium', isRead:false, createdAt: new Date(Date.now() - 86400000) },
  { type:'ai_insight', title:'SubBot AI found 3 new insights', message:'Unused Canva Pro (47 days inactive), duplicate knowledge base tools detected, and annual plan opportunities found.', priority:'medium', isRead:false, createdAt: new Date(Date.now() - 2*86400000) },
  { type:'payment_success', title:'Spotify payment successful', message:'₹119 charged to Visa ••4242 for Spotify Premium. Next renewal: June 14, 2025.', priority:'low', isRead:true, createdAt: new Date(Date.now() - 3*86400000) },
  { type:'unused_warning', title:'Canva Pro: 47 days inactive', message:'You haven\'t opened Canva Pro in 47 days. Consider cancelling to save ₹999/month.', priority:'medium', isRead:true, createdAt: new Date(Date.now() - 4*86400000) },
  { type:'renewal', title:'Figma renews in 7 days', message:'Your Figma Professional plan will renew on May 15 for ₹1,699. No action needed if you\'d like to continue.', priority:'medium', isRead:true, createdAt: new Date(Date.now() - 5*86400000) },
];

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

export default function Notifications() {
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [unread, setUnread]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ limit:50 });
      const list = data.data?.length ? data.data : DEMO_NOTIFS;
      setNotifs(list);
      setUnread(list.filter(n => !n.isRead).length);
    } catch {
      setNotifs(DEMO_NOTIFS);
      setUnread(DEMO_NOTIFS.filter(n => !n.isRead).length);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      if (id) await notificationAPI.markRead(id);
      setNotifs(prev => prev.map(n => n._id === id || !id ? { ...n, isRead:true } : n));
      setUnread(0);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead:true })));
      setUnread(0);
      toast.success('All notifications marked as read.');
    } catch {
      setNotifs(prev => prev.map(n => ({ ...n, isRead:true })));
      setUnread(0);
    }
  };

  const dismiss = async (id) => {
    try {
      if (id) await notificationAPI.remove(id);
      setNotifs(prev => prev.filter(n => n._id !== id && n !== id));
      toast('Notification dismissed.', { icon:'🗑️' });
    } catch {
      setNotifs(prev => prev.filter((_, i) => i !== id));
    }
  };

  const filtered = filter === 'all' ? notifs : filter === 'unread' ? notifs.filter(n => !n.isRead) : notifs.filter(n => n.type === filter);

  return (
    <div style={{ animation:'fadeUp .4s ease' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.4rem', fontWeight:800 }}>Notifications</h2>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>{unread} unread · {notifs.length} total</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {unread > 0 && <button className="btn btn-outline btn-sm" onClick={markAllRead}>✓ Mark all read</button>}
          <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { key:'all',              label:`All (${notifs.length})` },
          { key:'unread',           label:`Unread (${unread})` },
          { key:'renewal',          label:'Renewals' },
          { key:'savings_opportunity', label:'Savings' },
          { key:'unused_warning',   label:'Warnings' },
          { key:'payment_success',  label:'Payments' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:`1px solid ${filter === f.key ? 'var(--blue)' : 'var(--border2)'}`, background: filter === f.key ? 'rgba(79,142,247,.1)' : 'transparent', color: filter === f.key ? 'var(--blue)' : 'var(--text2)', cursor:'pointer', transition:'all .2s', fontFamily:'DM Sans,sans-serif' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:100, borderRadius:'var(--r)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔕</div>
          <h3 style={{ marginBottom:8 }}>No notifications</h3>
          <p style={{ color:'var(--text2)', fontSize:14 }}>You're all caught up!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((notif, idx) => {
            const meta = TYPE_META[notif.type] || TYPE_META.system;
            return (
              <div key={notif._id || idx}
                style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'16px 20px',
                  background:'var(--card)', border:`1px solid var(--border)`,
                  borderLeft: !notif.isRead ? `3px solid var(--blue)` : '1px solid var(--border)',
                  borderRadius:'var(--r)', transition:'all .2s', cursor:'pointer' }}
                onClick={() => !notif.isRead && markRead(notif._id)}>
                <div style={{ width:42, height:42, borderRadius:10, background: meta.bg, border:`1px solid ${meta.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight: notif.isRead ? 500 : 700 }}>{notif.title}</span>
                    {!notif.isRead && <span style={{ width:7, height:7, background:'var(--blue)', borderRadius:'50%', display:'inline-block', flexShrink:0 }} />}
                    <span style={{ marginLeft:'auto', fontSize:11, color: PRIORITY_COLORS[notif.priority] || 'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>
                      {notif.priority}
                    </span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:8 }}>{notif.message}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>{timeAgo(notif.createdAt)}</span>
                    <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
                      {!notif.isRead && (
                        <button className="btn btn-outline btn-sm" style={{ fontSize:11 }} onClick={e => { e.stopPropagation(); markRead(notif._id); }}>Mark read</button>
                      )}
                      <button className="btn btn-outline btn-sm" style={{ fontSize:11 }} onClick={e => { e.stopPropagation(); dismiss(notif._id || idx); }}>Dismiss</button>
                    </div>
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
