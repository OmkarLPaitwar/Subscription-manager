import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsAPI, subscriptionAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#4f8ef7','#8b5cf6','#10b981','#22d3ee','#f59e0b','#f43f5e','#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px' }}>
      <p style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize:13, fontWeight:600, color: p.color }}>
          {p.name}: ₹{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [monthly, setMonthly]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [forecast, setForecast]   = useState([]);
  const [calendar, setCalendar]   = useState({});
  const [topSubs, setTopSubs]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [calYear]  = useState(new Date().getFullYear());
  const [calMonth] = useState(new Date().getMonth() + 1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [monRes, catRes, foreRes, calRes, topRes] = await Promise.allSettled([
        analyticsAPI.monthlySpend(6),
        analyticsAPI.categoryBreakdown(),
        analyticsAPI.forecast(),
        analyticsAPI.renewalCalendar(calYear, calMonth),
        analyticsAPI.topSubscriptions(6),
      ]);
      if (monRes.status === 'fulfilled')  setMonthly(monRes.value.data.data);
      if (catRes.status === 'fulfilled')  setCategories(catRes.value.data.data);
      if (foreRes.status === 'fulfilled') setForecast(foreRes.value.data.data);
      if (calRes.status === 'fulfilled')  setCalendar(calRes.value.data.data);
      if (topRes.status === 'fulfilled')  setTopSubs(topRes.value.data.data);
    } catch { toast.error('Failed to load analytics.'); }
    finally { setLoading(false); }
  }, [calYear, calMonth]);

  useEffect(() => { load(); }, [load]);

  const totalSpend = categories.reduce((s, c) => s + c.total, 0);
  const currentMonthly = monthly[monthly.length - 1]?.total || 0;
  const prevMonthly    = monthly[monthly.length - 2]?.total || 0;
  const monthGrowth    = prevMonthly ? (((currentMonthly - prevMonthly) / prevMonthly) * 100).toFixed(1) : 0;

  // Build calendar days array
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDay    = new Date(calYear, calMonth - 1, 1).getDay();
  const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const Skeleton = ({ h = 200 }) => <div className="skeleton" style={{ height: h, borderRadius: 8 }} />;

  return (
    <div style={{ animation:'fadeUp .4s ease' }}>
      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        {[
          { label:'Current Monthly', value: loading ? '—' : `₹${currentMonthly.toLocaleString()}`, sub: `${monthGrowth > 0 ? '+' : ''}${monthGrowth}% vs last month`, color:'var(--blue)' },
          { label:'Highest Category', value: loading || !categories[0] ? '—' : categories[0]?.name, sub: categories[0] ? `₹${categories[0].total.toLocaleString()}/mo` : '', color:'var(--purple)' },
          { label:'Annual Projection', value: loading ? '—' : `₹${(currentMonthly * 12).toLocaleString()}`, sub: 'at current rate', color:'var(--amber)' },
          { label:'Categories', value: loading ? '—' : categories.length, sub: 'spending categories', color:'var(--green)' },
        ].map((m, i) => (
          <div key={i} className="card" style={{ padding:20 }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>{m.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.6rem', fontWeight:800, color: m.color, marginBottom:4 }}>{m.value}</div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Spend Trend + Category Pie */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}>
            <span style={S.chartTitle}>6-Month Expense Trend</span>
            <div style={{ display:'flex', gap:12, fontSize:12 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#4f8ef7', display:'inline-block' }}></span> Spend</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#10b981', display:'inline-block', opacity:.6 }}></span> Trend</span>
            </div>
          </div>
          {loading ? <Skeleton h={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4f8ef7" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="total" stroke="url(#lineGrad)" strokeWidth={3} dot={{ fill:'#4f8ef7', r:4 }} activeDot={{ r:6 }} name="Spend" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}><span style={S.chartTitle}>Category Breakdown</span></div>
          {loading ? <Skeleton h={240} /> : categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Spend']} contentStyle={{ background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize:11, color:'var(--text2)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign:'center', padding:'80px 0', color:'var(--text3)', fontSize:14 }}>No data yet</p>}
        </div>
      </div>

      {/* Category List + Forecast */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Category Table */}
        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}><span style={S.chartTitle}>Spend by Category</span></div>
          {loading ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:36, marginBottom:8 }} />) : (
            <div>
              {categories.map((cat, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: COLORS[i % COLORS.length], flexShrink:0 }} />
                  <span style={{ fontSize:13, flex:1 }}>{cat.name}</span>
                  <div style={{ flex:2, height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${cat.percentage}%`, background: COLORS[i % COLORS.length], borderRadius:3, transition:'width 1s ease' }} />
                  </div>
                  <span style={{ fontSize:12, color:'var(--text2)', width:35, textAlign:'right' }}>{cat.percentage}%</span>
                  <span style={{ fontSize:13, fontWeight:600, width:80, textAlign:'right' }}>₹{cat.total.toLocaleString()}</span>
                </div>
              ))}
              {categories.length === 0 && <p style={{ color:'var(--text3)', fontSize:14, textAlign:'center', padding:'20px 0' }}>Add subscriptions to see breakdown</p>}
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="card" style={{ padding:20 }}>
          <div style={S.chartHeader}><span style={S.chartTitle}>3-Month Forecast</span></div>
          {loading ? <Skeleton h={180} /> : forecast.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={forecast} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(139,92,246,.08)' }} />
                  <Bar dataKey="predicted" fill="url(#foreGrad)" radius={[6,6,0,0]} name="Predicted" />
                  <defs>
                    <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:12, display:'flex', gap:10 }}>
                {forecast.map((f, i) => (
                  <div key={i} style={{ flex:1, textAlign:'center', padding:'10px 8px', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>{f.month}</div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1rem', fontWeight:700 }}>₹{(f.predicted/1000).toFixed(1)}k</div>
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)', fontSize:14 }}>No forecast data</p>}
        </div>
      </div>

      {/* Top Subscriptions */}
      <div className="card" style={{ padding:20, marginBottom:16 }}>
        <div style={S.chartHeader}><span style={S.chartTitle}>Top Subscriptions by Cost</span></div>
        {loading ? <Skeleton h={100} /> : topSubs.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
            {topSubs.map((s, i) => (
              <div key={i} style={{ padding:14, background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{s.icon || '📦'}</span>
                  <span style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:800 }}>₹{(s.monthlyCost || s.cost).toLocaleString()}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{s.category}</div>
                <div style={{ height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100, ((s.monthlyCost || s.cost) / (topSubs[0]?.monthlyCost || 1)) * 100)}%`, background:'var(--grad)', borderRadius:2 }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:14 }}>No subscriptions yet</p>}
      </div>

      {/* Renewal Calendar */}
      <div className="card" style={{ padding:20 }}>
        <div style={S.chartHeader}>
          <span style={S.chartTitle}>Renewal Calendar — {new Date(calYear, calMonth - 1).toLocaleString('default', { month:'long', year:'numeric' })}</span>
          <div style={{ display:'flex', gap:12, fontSize:12 }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'var(--blue)', display:'inline-block' }}></span>Has renewal</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'var(--text3)', padding:'4px 0', letterSpacing:.5 }}>{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const events = calendar[day];
            return (
              <div key={day} title={events ? events.map(e => e.name).join(', ') : ''} style={{ textAlign:'center', padding:'8px 4px', borderRadius:6, fontSize:11, background: events ? 'rgba(79,142,247,.15)' : 'var(--bg3)', border:`1px solid ${events ? 'rgba(79,142,247,.4)' : 'var(--border)'}`, cursor: events ? 'pointer' : 'default', transition:'all .2s', minHeight:42 }}>
                <div style={{ fontWeight:600, color: events ? 'var(--blue)' : 'var(--text2)' }}>{day}</div>
                {events && <div style={{ fontSize:9, color:'var(--blue)', marginTop:2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{events[0]?.name}</div>}
                {events?.length > 1 && <div style={{ fontSize:9, color:'var(--text3)' }}>+{events.length - 1}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S = {
  chartHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  chartTitle:  { fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 },
};
