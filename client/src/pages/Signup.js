import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) return toast.error('All fields required.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 20px', position:'relative', overflow:'hidden' }}>
      <div className="orb" style={{ width:400, height:400, background:'var(--blue)', top:-100, left:-100 }} />
      <div className="orb" style={{ width:300, height:300, background:'var(--purple)', bottom:-80, right:-80 }} />
      <div className="glass animate-fadeUp" style={{ width:'100%', maxWidth:440, padding:40, position:'relative', zIndex:1 }}>
        <Link to="/" style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'flex', alignItems:'center', gap:'8px', marginBottom:24 }}>
          <img src="/logo192.png" alt="Logo" style={{ height: '32px', width: '32px', borderRadius: '6px' }} />
          SubSync AI
        </Link>
        <h2 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:6 }}>Start saving today</h2>
        <p style={{ color:'var(--text2)', fontSize:14, marginBottom:28 }}>Create your free account — no credit card required</p>

        <button style={{ width:'100%', padding:12, background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', borderRadius:'var(--r2)', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign up with Google
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, color:'var(--text3)', fontSize:12, marginBottom:20 }}><span style={{flex:1,height:1,background:'var(--border)'}}></span>or use email<span style={{flex:1,height:1,background:'var(--border)'}}></span></div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div><label className="label">First Name</label><input className="input" placeholder="Arjun" value={form.firstName} onChange={set('firstName')} /></div>
            <div><label className="label">Last Name</label><input className="input" placeholder="Sharma" value={form.lastName} onChange={set('lastName')} /></div>
          </div>
          <div className="form-group"><label className="label">Work Email</label><input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} /></div>
          <div className="form-group"><label className="label">Password</label><input className="input" type="password" placeholder="At least 6 characters" value={form.password} onChange={set('password')} /></div>
          <button className="btn btn-primary" style={{ width:'100%' }} type="submit" disabled={loading}>
            {loading ? '⏳ Creating account…' : 'Create Free Account →'}
          </button>
        </form>
        <p style={{ textAlign:'center', fontSize:13, color:'var(--text2)', marginTop:20 }}>Already have an account? <Link to="/login" style={{ color:'var(--blue)' }}>Sign in</Link></p>
      </div>
    </div>
  );
}
