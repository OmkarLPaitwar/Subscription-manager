import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('All fields are required.');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setForm({ email: 'demo@subsync.ai', password: 'demo1234' });
    toast('Demo credentials filled in!', { icon: '✨' });
  };

  return (
    <div style={styles.page}>
      <div className="orb" style={{ width:400, height:400, background:'var(--blue)', top:-100, left:-100 }} />
      <div className="orb" style={{ width:300, height:300, background:'var(--purple)', bottom:-80, right:-80 }} />

      <div className="glass animate-fadeUp" style={styles.card}>
        <Link to="/" style={styles.logo}>SubSync AI</Link>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.sub}>Sign in to your subscription dashboard</p>

        <button style={styles.googleBtn} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        {/* Fixed divider with lines via CSS class */}
        <div className="divider"><span>or sign in with email</span></div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="label" style={{ display:'flex', justifyContent:'space-between' }}>
              Password
              <Link to="/forgot-password" style={{ color:'var(--blue)', fontSize:12 }}>Forgot password?</Link>
            </label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <button className="btn btn-primary" style={{ width:'100%', marginBottom:10 }} type="submit" disabled={loading}>
            {loading ? <span className="animate-spin">⏳</span> : 'Sign In →'}
          </button>
          <button className="btn btn-outline" style={{ width:'100%', fontSize:13 }} type="button" onClick={demoLogin}>
            ✨ Use Demo Account
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account? <Link to="/signup" style={{ color:'var(--blue)' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page:     { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 20px', position:'relative', overflow:'hidden' },
  card:     { width:'100%', maxWidth:420, padding:'40px 32px', position:'relative', zIndex:1 },
  logo:     { fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'block', marginBottom:24 },
  title:    { fontSize:'1.8rem', fontWeight:800, marginBottom:6 },
  sub:      { color:'var(--text2)', fontSize:14, marginBottom:28 },
  googleBtn:{ width:'100%', padding:12, background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', borderRadius:'var(--r2)', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20, cursor:'pointer', fontFamily:'DM Sans,sans-serif', transition:'all .2s' },
  footer:   { textAlign:'center', fontSize:13, color:'var(--text2)', marginTop:20 }
};
