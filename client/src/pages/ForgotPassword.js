import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email.');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 20px', position:'relative', overflow:'hidden' }}>
      <div className="orb" style={{ width:300, height:300, background:'var(--blue)', top:-80, left:-80 }} />
      <div className="glass animate-fadeUp" style={{ width:'100%', maxWidth:400, padding:40, position:'relative', zIndex:1 }}>
        <Link to="/" style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'block', marginBottom:24 }}>SubSync AI</Link>
        {sent ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:10 }}>Check your inbox</h2>
            <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.6, marginBottom:24 }}>We sent a password reset link to <strong>{email}</strong>.</p>
            <Link to="/login" className="btn btn-outline" style={{ width:'100%', justifyContent:'center' }}>← Back to Login</Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:6 }}>Reset password</h2>
            <p style={{ color:'var(--text2)', fontSize:14, marginBottom:28 }}>Enter your email to receive a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom:20 }}>
                <label className="label">Email address</label>
                <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{ width:'100%', marginBottom:12 }} type="submit" disabled={loading}>
                {loading ? '⏳ Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <p style={{ textAlign:'center', fontSize:13, color:'var(--text2)' }}><Link to="/login" style={{ color:'var(--blue)' }}>← Back to login</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
