import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { subscriptionAPI, analyticsAPI, aiAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#4f8ef7','#8b5cf6','#10b981','#22d3ee','#f59e0b','#f43f5e'];

const MetricCard = ({ icon, label, value, change, changeType, color, loading }) => (
  <div className="card" style={{ padding:20 }}>
    <div style={{ width:40, height:40, borderRadius:10, background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:14 }}>{icon}</div>
    <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, letterSpacing:.5, textTransform:'uppercase', marginBottom:6 }}>{label}</div>
    {loading
      ? <div className="skeleton" style={{ height:32, width:100, marginBottom:8 }} />
      : <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.7rem', fontWeight:800 }}>{value}</div>
    }
    {change && <div style={{ fontSize:12, color: changeType === 'up' ? 'var(--green)' : changeType === 'down' ? 'var(--red)' : 'var(--text3)', marginTop:6, display:'flex', alignItems:'center', gap:4 }}>{change}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px' }}>
      <p style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:14, fontWeight:700 }}>₹{payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

export default function Overview() {
  const navigate = useNavigate();
  const [summary, setSummary]   = useState(null);
  const [monthly, setMonthly]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, monRes, catRes, insRes] = await Promise.allSettled([
        subscriptionAPI.getSummary(),
        analyticsAPI.monthlySpend(6),
        analyticsAPI.categoryBreakdown(),
        aiAPI.getInsights(),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data);
      if (monRes.status === 'fulfilled') setMonthly(monRes.value.data.data);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data.data);
      if (insRes.status === 'fulfilled') setInsights(insRes.value.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = n => n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n}`;

  return (
    <div style={{ animation:'fadeUp .4s ease' }}>
      {/* Metrics */}
      <div style={S.metricsGrid}>
        <MetricCard icon="💳" label="Active Subscriptions" value={summary?.totalActive ?? '—'} change={`${summary?.totalActive ?? 0} tracked tools`} changeType="neutral" color="var(--blue)" loading={loading} />
        <MetricCard icon="💰" label="Monthly Spend"        value={loading ? '—' : fmt(summary?.totalMonthly ?? 0)} change={`₹${Math.round((summary?.totalMonthly ?? 0) * 12).toLocaleString()}/year`} changeType="neutral" color="var(--purple)" loading={loading} />
        <MetricCard icon="⏰" label="Renewals This Week"  value={summary?.upcomingRenewals?.length ?? '—'} change={summary?.upcomingRenewals?.map(s => s.name).slice(0,2).join(', ') || 'None upcoming'} changeType="neutral" color="var(--amber)" loading={loading} />
        <MetricCard icon="🎯" label="AI Savings Found"    value={loading ? '—' : fmt(summary?.potentialSavings ?? 0)} change={`${summary?.unusedCount ?? 0} unused subscriptions`} changeType="up" color="var(--green)" loading={loading} />
      </div>

      {/* Charts Row */}
      <div style={S.chartsGrid}>
        {/* Spend Bar Chart */}
        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}>
            <span style={S.chartTitle}>Monthly Spending Trend</span>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Last 6 months</span>
          </div>
          {loading
            ? <div className="skeleton" style={{ height:220 }} />
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(79,142,247,.06)' }} />
                  <Bar dataKey="total" fill="url(#barGrad)" radius={[6,6,0,0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f8ef7" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Upcoming Renewals */}
        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}>
            <span style={S.chartTitle}>Upcoming Renewals</span>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/dashboard/subscriptions')}>View All</button>
          </div>
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:52, marginBottom:8, borderRadius:8 }} />)
            : (summary?.upcomingRenewals?.length ? summary.upcomingRenewals.map((s, i) => {
                const days = Math.ceil((new Date(s.renewalDate) - new Date()) / 86400000);
                const urgency = days <= 2 ? 'var(--red)' : days <= 5 ? 'var(--amber)' : 'var(--green)';
                return (
                  <div key={i} style={S.renewalItem}>
                    <div style={{ width:36, height:36, borderRadius:8, background:`${urgency}20`, border:`1px solid ${urgency}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{s.icon || '📦'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{new Date(s.renewalDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>₹{s.monthlyCost?.toLocaleString()}</div>
                      <div style={{ fontSize:11, color: urgency, textAlign:'right' }}>{days}d</div>
                    </div>
                  </div>
                );
              }) : <p style={{ color:'var(--text3)', fontSize:14, textAlign:'center', padding:'20px 0' }}>No renewals in the next 7 days 🎉</p>)
          }
        </div>
      </div>

      {/* Category + Insights */}
      <div style={S.bottomGrid}>
        {/* Pie Chart */}
        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}><span style={S.chartTitle}>Category Breakdown</span></div>
          {loading
            ? <div className="skeleton" style={{ height:200 }} />
            : categories.length > 0
              ? <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categories} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                      {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Spend']} contentStyle={{ background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:13 }} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize:12, color:'var(--text2)' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              : <p style={{ color:'var(--text3)', fontSize:14, textAlign:'center', padding:'60px 0' }}>No data yet. Add subscriptions to see breakdown.</p>
          }
        </div>

        {/* AI Insights */}
        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}>
            <span style={S.chartTitle}>AI Insights</span>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/dashboard/advisor')}>Ask SubBot</button>
          </div>
          {loading
            ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:60, marginBottom:8, borderRadius:8 }} />)
            : insights.length > 0
              ? insights.map((ins, i) => (
                  <div key={i} style={{ padding:'12px 14px', background: ins.priority === 'high' ? 'rgba(244,63,94,.06)' : ins.priority === 'medium' ? 'rgba(245,158,11,.06)' : 'rgba(16,185,129,.06)', border:`1px solid ${ins.priority === 'high' ? 'rgba(244,63,94,.2)' : ins.priority === 'medium' ? 'rgba(245,158,11,.2)' : 'rgba(16,185,129,.2)'}`, borderRadius:8, marginBottom:10 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{ins.icon} {ins.title}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{ins.description}</div>
                    {ins.saving > 0 && <div style={{ fontSize:12, color:'var(--green)', marginTop:6, fontWeight:600 }}>💰 Save ₹{ins.saving.toLocaleString()}/mo</div>}
                  </div>
                ))
              : (
                  <div style={{ textAlign:'center', padding:'20px 0' }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>🤖</div>
                    <p style={{ color:'var(--text2)', fontSize:14, marginBottom:16 }}>Add subscriptions and run AI analysis to get personalized insights.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => aiAPI.analyze().then(() => { toast.success('Analysis complete!'); load(); })}>Run AI Analysis</button>
                  </div>
                )
          }
        </div>
      </div>

      {/* Most Expensive */}
      {summary?.mostExpensive && (
        <div className="card" style={{ padding:20, marginTop:16, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:32 }}>🏆</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>MOST EXPENSIVE SUBSCRIPTION</div>
            <div style={{ fontSize:16, fontWeight:700 }}>{summary.mostExpensive.name} <span style={{ fontSize:13, color:'var(--text2)', fontWeight:400 }}>({summary.mostExpensive.category})</span></div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'var(--red)' }}>₹{summary.mostExpensive.monthlyCost?.toLocaleString()}</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>per month</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/subscriptions')}>Manage →</button>
        </div>
      )}
    </div>
  );
}

const S = {
  metricsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 },
  chartsGrid:  { display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 },
  bottomGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  chartHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  chartTitle:  { fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 },
  renewalItem: { display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--bg3)', borderRadius:8, marginBottom:8, transition:'background .2s', cursor:'pointer' },
};
