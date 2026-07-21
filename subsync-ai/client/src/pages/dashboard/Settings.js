import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const Toggle = ({ on, onChange }) => (
  <div className={`toggle-track ${on ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={on}>
    <div className="toggle-thumb" />
  </div>
);

const INTEGRATIONS = [
  { name:'Gmail',       desc:'Auto-detect subscriptions from email receipts',    icon:'📧', connected:true },
  { name:'HDFC Bank',   desc:'Detect recurring charges from bank statements',    icon:'🏦', connected:true },
  { name:'Razorpay',    desc:'Track recurring payment mandates automatically',   icon:'💸', connected:false },
  { name:'QuickBooks',  desc:'Sync subscription data with your accounting app',  icon:'📊', connected:false },
  { name:'Slack',       desc:'Get renewal alerts and AI tips in Slack channels', icon:'💬', connected:false },
  { name:'Jira',        desc:'Create tickets for subscription reviews',          icon:'📋', connected:false },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  // Profile form
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
    company:   { name: user?.company?.name || '', gst: user?.company?.gst || '', address: user?.company?.address || '' }
  });

  // Preferences
  const [prefs, setPrefs] = useState({
    currency:           user?.preferences?.currency          || 'INR',
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    smsAlerts:          user?.preferences?.smsAlerts          ?? false,
    weeklyReport:       user?.preferences?.weeklyReport       ?? true,
    twoFactor:          user?.preferences?.twoFactor          ?? false,
    theme:              user?.preferences?.theme              || 'dark',
  });

  // Password
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updatePreferences(prefs);
      updateUser(data.user);
      if (prefs.theme) document.documentElement.setAttribute('data-theme', prefs.theme);
      toast.success('Preferences saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) return toast.error('Fill in all password fields.');
    if (pwd.newPassword !== pwd.confirmPassword) return toast.error('Passwords do not match.');
    if (pwd.newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    setSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password changed successfully!');
      setPwd({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed.'); }
    finally { setSaving(false); }
  };

  const toggleIntegration = (i) => {
    setIntegrations(prev => prev.map((item, idx) =>
      idx === i ? { ...item, connected: !item.connected } : item
    ));
    toast.success(integrations[i].connected ? `${integrations[i].name} disconnected.` : `${integrations[i].name} connected!`);
  };

  const TABS = [
    { key:'profile',      label:'👤 Profile' },
    { key:'company',      label:'🏢 Company' },
    { key:'preferences',  label:'🎨 Preferences' },
    { key:'integrations', label:'🔌 Integrations' },
    { key:'security',     label:'🔐 Security' },
  ];

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20, animation:'fadeUp .4s ease' }}>
      {/* Sidebar Nav */}
      <div className="card" style={{ padding:10, height:'fit-content' }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:'var(--r2)', fontSize:13, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? 'var(--blue)' : 'var(--text2)', background: tab === t.key ? 'rgba(79,142,247,.1)' : 'transparent', cursor:'pointer', transition:'all .15s', marginBottom:2 }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="card" style={{ padding:28 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>Profile Information</h3>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:24 }}>Update your personal details.</p>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:16, background:'var(--bg3)', borderRadius:'var(--r)', border:'1px solid var(--border)' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#fff' }}>{initials}</div>
              <div>
                <div style={{ fontWeight:700 }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>{user?.email}</div>
                <div style={{ marginTop:6 }}><span className="badge badge-purple" style={{ textTransform:'capitalize' }}>{user?.plan || 'starter'} Plan</span></div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div><label className="label">First Name</label><input className="input" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} /></div>
              <div><label className="label">Last Name</label><input className="input" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} /></div>
              <div style={{ gridColumn:'1/-1' }}><label className="label">Email (read-only)</label><input className="input" value={user?.email || ''} disabled style={{ opacity:.6 }} /></div>
              <div style={{ gridColumn:'1/-1' }}><label className="label">Phone</label><input className="input" placeholder="+91 98765 43210" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} /></div>
            </div>
            <div style={{ marginTop:20, display:'flex', gap:10 }}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? '⏳ Saving…' : 'Save Profile'}</button>
            </div>
          </div>
        )}

        {/* COMPANY TAB */}
        {tab === 'company' && (
          <div className="card" style={{ padding:28 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>Company Details</h3>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:24 }}>Used for invoices, reports, and team billing.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label className="label">Company Name</label><input className="input" placeholder="Acme Technologies Pvt Ltd" value={profile.company.name} onChange={e => setProfile({...profile, company:{...profile.company, name:e.target.value}})} /></div>
              <div><label className="label">GST Number</label><input className="input" placeholder="27AABCS1429B1ZB" value={profile.company.gst} onChange={e => setProfile({...profile, company:{...profile.company, gst:e.target.value}})} /></div>
              <div><label className="label">Billing Address</label><textarea className="textarea" rows={3} placeholder="Office address…" value={profile.company.address} onChange={e => setProfile({...profile, company:{...profile.company, address:e.target.value}})} style={{ resize:'vertical' }} /></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop:20 }} onClick={saveProfile} disabled={saving}>{saving ? '⏳ Saving…' : 'Save Company Info'}</button>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {tab === 'preferences' && (
          <div className="card" style={{ padding:28 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>Preferences</h3>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:24 }}>Customize your SubSync AI experience.</p>
            {[
              { label:'Theme', sub:'Switch between dark and light mode', key:'theme', type:'select', options:['dark','light'] },
              { label:'Currency', sub:'Display currency for all amounts', key:'currency', type:'select', options:['INR','USD','EUR','GBP'] },
              { label:'Email Notifications', sub:'Get renewal alerts and AI tips via email', key:'emailNotifications', type:'toggle' },
              { label:'SMS Alerts', sub:'Receive critical renewal alerts via SMS', key:'smsAlerts', type:'toggle' },
              { label:'Weekly AI Report', sub:'Auto-generate a PDF spending report every Monday', key:'weeklyReport', type:'toggle' },
            ].map(item => (
              <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:500 }}>{item.label}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{item.sub}</div>
                </div>
                {item.type === 'toggle'
                  ? <Toggle on={prefs[item.key]} onChange={() => setPrefs({...prefs, [item.key]: !prefs[item.key]})} />
                  : <select className="select" style={{ width:'auto' }} value={prefs[item.key]} onChange={e => setPrefs({...prefs, [item.key]: e.target.value})}>
                      {item.options.map(o => <option key={o} value={o} style={{ textTransform:'capitalize' }}>{o.toUpperCase()}</option>)}
                    </select>
                }
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop:20 }} onClick={savePrefs} disabled={saving}>{saving ? '⏳ Saving…' : 'Save Preferences'}</button>
          </div>
        )}

        {/* INTEGRATIONS TAB */}
        {tab === 'integrations' && (
          <div className="card" style={{ padding:28 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>Integrations</h3>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:24 }}>Connect apps to auto-detect and sync subscriptions.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {integrations.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:16, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)' }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:'var(--bg2)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{item.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>{item.name}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{item.desc}</div>
                  </div>
                  <button onClick={() => toggleIntegration(i)} style={{ padding:'6px 16px', borderRadius:'var(--r2)', fontSize:12, fontWeight:600, border:`1px solid ${item.connected ? 'var(--green)' : 'var(--border2)'}`, background: item.connected ? 'rgba(16,185,129,.1)' : 'transparent', color: item.connected ? 'var(--green)' : 'var(--text2)', cursor:'pointer', fontFamily:'DM Sans,sans-serif', transition:'all .2s', whiteSpace:'nowrap' }}>
                    {item.connected ? '✓ Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {tab === 'security' && (
          <>
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>Change Password</h3>
              <p style={{ fontSize:13, color:'var(--text2)', marginBottom:24 }}>Keep your account secure with a strong password.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label className="label">Current Password</label><input className="input" type="password" placeholder="••••••••" value={pwd.currentPassword} onChange={e => setPwd({...pwd, currentPassword:e.target.value})} /></div>
                <div><label className="label">New Password</label><input className="input" type="password" placeholder="At least 6 characters" value={pwd.newPassword} onChange={e => setPwd({...pwd, newPassword:e.target.value})} /></div>
                <div><label className="label">Confirm New Password</label><input className="input" type="password" placeholder="Repeat new password" value={pwd.confirmPassword} onChange={e => setPwd({...pwd, confirmPassword:e.target.value})} /></div>
              </div>
              <button className="btn btn-primary" style={{ marginTop:20 }} onClick={changePassword} disabled={saving}>{saving ? '⏳ Saving…' : 'Change Password'}</button>
            </div>
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>Security Settings</h3>
              <div>
                {[
                  { label:'Two-Factor Authentication', sub:'Add an extra layer of security with 2FA via authenticator app', key:'twoFactor' },
                ].map(item => (
                  <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                    <div><div style={{ fontSize:14, fontWeight:500 }}>{item.label}</div><div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{item.sub}</div></div>
                    <Toggle on={prefs[item.key]} onChange={() => setPrefs({...prefs, [item.key]: !prefs[item.key]})} />
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0' }}>
                  <div><div style={{ fontSize:14, fontWeight:500 }}>Active Sessions</div><div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>2 devices currently signed in</div></div>
                  <button className="btn btn-outline btn-sm">Manage Sessions</button>
                </div>
              </div>
            </div>
            <div style={{ padding:20, background:'rgba(244,63,94,.06)', border:'1px solid rgba(244,63,94,.2)', borderRadius:'var(--r)' }}>
              <h4 style={{ color:'var(--red)', fontFamily:'Syne,sans-serif', marginBottom:8 }}>Danger Zone</h4>
              <p style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>Permanently deactivate your account. This action cannot be undone and will delete all your subscription data.</p>
              <button className="btn btn-danger" onClick={() => { if(window.confirm('Are you sure? This will deactivate your account permanently.')) { logout(); }}}>Delete Account</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
