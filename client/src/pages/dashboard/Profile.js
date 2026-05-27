import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName || '',
    phone:     user?.phone || '',
    company: {
      name:    user?.company?.name || '',
      gst:     user?.company?.gst || '',
      address: user?.company?.address || ''
    }
  });

  useEffect(() => {
    setProfile({
      firstName: user?.firstName || '',
      lastName:  user?.lastName || '',
      phone:     user?.phone || '',
      company: {
        name:    user?.company?.name || '',
        gst:     user?.company?.gst || '',
        address: user?.company?.address || ''
      }
    });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(profile);
      updateUser(data.user);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>Your Profile</h3>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Update your personal and company details for a better experience.</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:12, color:'var(--text3)' }}>Signed in as</div>
          <div style={{ fontWeight:700 }}>{user?.email}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <label className="label">First Name</label>
          <input className="input" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input className="input" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label className="label">Phone</label>
          <input className="input" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label className="label">Company Name</label>
          <input className="input" value={profile.company.name} onChange={e => setProfile({ ...profile, company: { ...profile.company, name: e.target.value } })} placeholder="Company name" />
        </div>
        <div>
          <label className="label">GST Number</label>
          <input className="input" value={profile.company.gst} onChange={e => setProfile({ ...profile, company: { ...profile.company, gst: e.target.value } })} placeholder="GST number" />
        </div>
        <div>
          <label className="label">Billing Address</label>
          <textarea className="textarea" rows={3} value={profile.company.address} onChange={e => setProfile({ ...profile, company: { ...profile.company, address: e.target.value } })} placeholder="Billing address" style={{ resize:'vertical' }} />
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop:22 }} onClick={saveProfile} disabled={saving}>
        {saving ? '⏳ Saving…' : 'Save Profile'}
      </button>
    </div>
  );
}
