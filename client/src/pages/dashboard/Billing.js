import React, { useState, useEffect } from 'react';
import { billingAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PLANS = [
  { key:'starter',    name:'Starter',    price:'₹499',  period:'/month', color:'var(--blue)',
    features:['Up to 20 subscriptions','Renewal alerts','Basic AI insights','Email support','Mobile app'] },
  { key:'business',  name:'Business',   price:'₹1,499', period:'/month', color:'var(--purple)', popular:true,
    features:['Unlimited subscriptions','Advanced AI advisor','Team billing','PDF report export','API access','Priority support'] },
  { key:'enterprise', name:'Enterprise', price:'Custom', period:'', color:'var(--cyan)',
    features:['Multi-org management','Custom AI training','SAML SSO & SCIM','SLA guarantee','Dedicated success manager','Custom integrations'] },
];

export default function Billing() {
  const { user, updateUser } = useAuth();
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState('');

  useEffect(() => {
    billingAPI.getCurrentPlan()
      .then(r => setPlanData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upgrade = async (planKey) => {
    if (planKey === 'enterprise') {
      toast('Contact sales@subsync.ai for Enterprise pricing.', { icon:'📧' });
      return;
    }
    if (planKey === user?.plan) {
      toast('You are already on this plan.', { icon:'ℹ️' });
      return;
    }
    setUpgrading(planKey);
    try {
      const { data } = await billingAPI.upgrade(planKey);
      updateUser({ plan: planKey });
      toast.success(`Upgraded to ${data.data?.name || planKey} plan! 🎉`);
      setPlanData(prev => ({ ...prev, plan: planKey }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed.');
    } finally { setUpgrading(''); }
  };

  const currentPlan = user?.plan || 'starter';

  const usageItems = [
    { label:'Subscriptions tracked', value:24, max: currentPlan === 'starter' ? 20 : 999, unit:'' },
    { label:'Team members',          value:3,  max: currentPlan === 'starter' ? 1  : 10,  unit:'' },
    { label:'AI advisor queries',    value:142, max:500, unit:'' },
  ];

  return (
    <div style={{ animation:'fadeUp .4s ease' }}>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.4rem', fontWeight:800, marginBottom:4 }}>Billing & Plans</h2>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:24 }}>Manage your subscription plan and billing details.</p>

      {/* Current Plan */}
      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Current Plan</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.3rem', fontWeight:800, textTransform:'capitalize' }}>{currentPlan}</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>Renews on {planData?.nextRenewal || 'May 1, 2026'}</div>
            </div>
            <span className="badge badge-green">● Active</span>
          </div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:'2rem', fontWeight:800, marginBottom:16 }}>
            {PLANS.find(p => p.key === currentPlan)?.price}<span style={{ fontSize:'1rem', color:'var(--text2)', fontFamily:'DM Sans,sans-serif' }}>/mo</span>
          </div>
          {usageItems.map((item, i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)', marginBottom:4 }}>
                <span>{item.label}</span>
                <span>{item.value} / {item.max === 999 ? '∞' : item.max}</span>
              </div>
              <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(100, (item.value / (item.max === 999 ? item.value : item.max)) * 100)}%`, background:'var(--grad)', borderRadius:3, transition:'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Payment Card */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Payment Method</div>
          <div style={{ background:'var(--grad)', borderRadius:12, padding:20, color:'#fff', marginBottom:16 }}>
            <div style={{ fontSize:11, opacity:.7, marginBottom:16, letterSpacing:2 }}>VISA CREDIT</div>
            <div style={{ fontSize:16, letterSpacing:3, fontFamily:'Syne,sans-serif', marginBottom:20 }}>•••• •••• •••• 4242</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, opacity:.8 }}>
              <span>{user?.firstName} {user?.lastName}</span>
              <span>12/27</span>
            </div>
          </div>
          <button className="btn btn-outline" style={{ width:'100%', marginBottom:10 }}>Update Payment Method</button>
          <button className="btn btn-outline" style={{ width:'100%', fontSize:13 }}>Download Invoice</button>
        </div>
      </div>

      {/* Plan Cards */}
      <div style={{ marginBottom:24 }}>
        <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, marginBottom:16 }}>Available Plans</h3>
        <div className="grid-3" style={{ gap:16 }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{ padding:24, borderRadius:'var(--r)', border:`1px solid ${plan.popular ? 'var(--purple)' : 'var(--border)'}`, background: plan.popular ? 'linear-gradient(135deg,rgba(139,92,246,.08),rgba(79,142,247,.04))' : 'var(--card)', position:'relative', transition:'transform .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {plan.popular && <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'var(--grad)', color:'#fff', padding:'3px 16px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>Most Popular</div>}
              {currentPlan === plan.key && <div style={{ position:'absolute', top:10, right:10 }}><span className="badge badge-green">Current</span></div>}
              <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>{plan.name}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'2rem', fontWeight:800, color: plan.color, marginBottom:4 }}>{plan.price}</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>{plan.period}</div>
              <ul style={{ listStyle:'none', marginBottom:20 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text2)', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ color:'var(--green)', fontWeight:700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'}`} style={{ width:'100%' }}
                onClick={() => upgrade(plan.key)} disabled={upgrading === plan.key || currentPlan === plan.key}>
                {upgrading === plan.key ? '⏳ Upgrading…' : currentPlan === plan.key ? 'Current Plan' : plan.key === 'enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1rem', fontWeight:700, marginBottom:16 }}>Invoice History</div>
        {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:48, marginBottom:8, borderRadius:8 }} />) : (
          (planData?.invoices || []).map((inv, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom: i < (planData?.invoices?.length || 0) - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:500 }}>{inv.description}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{inv.date}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>₹{inv.amount?.toLocaleString()}</span>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(16,185,129,.15)', color:'var(--green)' }}>Paid</span>
                <button style={{ background:'transparent', border:'1px solid var(--border2)', borderRadius:6, padding:'4px 10px', fontSize:12, color:'var(--text2)', cursor:'pointer' }}>PDF</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
