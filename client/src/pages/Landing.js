import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const FEATURES = [
  { icon:'📡', label:'feature-icon-blue',  title:'Subscription Tracking',       desc:'Auto-detect and monitor all SaaS subscriptions from email, bank SMS, and connected accounts in one dashboard.' },
  { icon:'🔔', label:'feature-icon-amber', title:'Renewal Alerts',              desc:'Get notified 7, 3, and 1 day before any subscription renews. Never be surprised by unexpected charges again.' },
  { icon:'🤖', label:'feature-icon-green', title:'AI Cost Optimization',        desc:'SubBot AI analyzes usage patterns to identify savings and suggest optimal plan configurations automatically.' },
  { icon:'📊', label:'feature-icon-cyan',  title:'Usage Analytics',             desc:'Deep analytics on category-wise spending, growth forecasts, and historical trends with exportable PDF reports.' },
  { icon:'✨', label:'feature-icon-purple',title:'Smart Recommendations',       desc:'AI-powered suggestions to switch to annual plans, cancel duplicates, and consolidate overlapping tools.' },
  { icon:'👥', label:'feature-icon-red',   title:'Team Billing Management',     desc:'Manage company-wide subscriptions, set spend limits per team, and generate finance reports for your org.' },
];

const TESTIMONIALS = [
  { stars:5, text:'"SubSync AI found ₹38,000 in annual savings in our first week. We had 3 overlapping design tools we never knew about. Absolute game changer."', name:'Arjun Rawal', role:'CTO, StackLabs · Mumbai', color:'linear-gradient(135deg,#4f8ef7,#8b5cf6)' },
  { stars:5, text:'"The AI advisor is like having a CFO on demand. It told us to switch Zoom to annual and cancel Canva Pro — saved us ₹2.4L in Q1 alone."', name:'Priya Sharma', role:'Founder, NovaTech · Bangalore', color:'linear-gradient(135deg,#10b981,#22d3ee)' },
  { stars:5, text:'"Finally a tool that speaks finance. The renewal calendar cut our SaaS budget by 31% without losing any critical tools."', name:'Rohan Kapoor', role:'VP Finance, BuildFast · Pune', color:'linear-gradient(135deg,#f59e0b,#f43f5e)' },
];

const STEPS = [
  { num:1, title:'Add Subscriptions',      desc:'Connect your email or bank, or manually add subscriptions. Our OCR scanner reads bills automatically.' },
  { num:2, title:'AI Analyzes Spending',   desc:'SubBot AI reviews usage, detects duplicates, and identifies waste across all your active plans.' },
  { num:3, title:'Save Automatically',     desc:'Follow AI recommendations, set up auto-cancel rules, and watch your subscription spend drop month over month.' },
];

const PRICING = [
  { tier:'Starter',    price:'₹499',  period:'per month', desc:'For freelancers managing personal subscriptions.',
    features:['Up to 20 subscriptions','Renewal alerts','Basic AI insights','Email support','Mobile app'],
    cta:'Get Started', featured:false },
  { tier:'Business',   price:'₹1,499',period:'per month', desc:'For teams needing full SaaS spend control.',
    features:['Unlimited subscriptions','Advanced AI advisor','Team billing','PDF reports','API & integrations','Priority support'],
    cta:'Start 14-Day Trial', featured:true },
  { tier:'Enterprise', price:'Custom', period:'tailored to your team', desc:'For large organizations with custom needs.',
    features:['Multi-org management','Custom AI training','SAML SSO & SCIM','SLA guarantee','Dedicated success manager','Custom integrations'],
    cta:'Contact Sales', featured:false },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });

  return (
    <div>
      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'0 5%', height:66, display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .3s', background: (scrolled || mobileMenuOpen) ? 'var(--bg2)' : 'transparent', borderBottom: (scrolled || mobileMenuOpen) ? '1px solid var(--border)' : 'none', backdropFilter: (scrolled || mobileMenuOpen) ? 'blur(12px)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => { window.scrollTo(0,0); setMobileMenuOpen(false); }}>
          <img src="/logo192.png" alt="Logo" style={{ height: '32px', width: '32px', borderRadius: '6px' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>SubSync AI</span>
        </div>
        
        {/* Desktop nav links */}
        <div className="landing-nav-links" style={{ display:'flex', gap:28, alignItems:'center' }}>
          {['features','how-it-works','pricing','testimonials'].map(s => (
            <span key={s} onClick={() => scrollTo(s)} style={{ color:'var(--text2)', fontSize:14, fontWeight:500, cursor:'pointer', textTransform:'capitalize', transition:'color .2s' }}
              onMouseEnter={e => e.target.style.color='var(--text)'}
              onMouseLeave={e => e.target.style.color='var(--text2)'}>
              {s.replace('-',' ')}
            </span>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="landing-nav-buttons" style={{ display:'flex', gap:10 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Log In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>Get Started</button>
        </div>

        {/* Hamburger Menu Toggle (Mobile) */}
        <button className="landing-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background:'transparent', border:'none', color:'var(--text)', fontSize:24, cursor:'pointer' }}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu" style={{ position:'absolute', top:66, left:0, right:0, background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'20px 5% 30px', display:'flex', flexDirection:'column', gap:20, zIndex:99 }}>
            {['features','how-it-works','pricing','testimonials'].map(s => (
              <span key={s} onClick={() => { scrollTo(s); setMobileMenuOpen(false); }} 
                style={{ color:'var(--text2)', fontSize:16, fontWeight:600, cursor:'pointer', textTransform:'capitalize', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                {s.replace('-',' ')}
              </span>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:10 }}>
              <button className="btn btn-outline" style={{ justifyContent:'center' }} onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Log In</button>
              <button className="btn btn-primary" style={{ justifyContent:'center' }} onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'80px 5% 60px', position:'relative', overflow:'hidden' }}>
        <div className="orb" style={{ width:500, height:500, background:'var(--blue)', top:-120, left:-120 }} />
        <div className="orb" style={{ width:400, height:400, background:'var(--purple)', bottom:-100, right:-100 }} />
        <div className="orb" style={{ width:300, height:300, background:'var(--cyan)', top:'40%', left:'50%', transform:'translate(-50%,-50%)' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:900, animation:'fadeUp .8s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(79,142,247,.1)', border:'1px solid rgba(79,142,247,.3)', borderRadius:20, padding:'6px 16px', fontSize:13, color:'var(--blue)', marginBottom:28 }}>
            <span style={{ width:6, height:6, background:'var(--blue)', borderRadius:'50%', animation:'pulse 2s infinite' }}></span>
            Powered by AI · Trusted by 10,000+ teams
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(2.4rem,6vw,4.2rem)', fontWeight:800, lineHeight:1.1, marginBottom:24 }}>
            <span className="grad-text">Manage All Your</span><br/>Subscriptions with AI
          </h1>
          <p style={{ fontSize:'1.1rem', color:'var(--text2)', maxWidth:580, margin:'0 auto 40px', lineHeight:1.7 }}>
            Track renewals, reduce costs, avoid unused plans, and optimize spending automatically. Your intelligent subscription command center.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>Get Started Free →</button>
            <button className="btn btn-outline btn-lg" onClick={() => scrollTo('features')}>Explore Features ↓</button>
          </div>
          <div style={{ display:'flex', gap:40, justifyContent:'center', marginTop:60, flexWrap:'wrap' }}>
            {[['₹2.4L','Avg. Yearly Savings'],['10K+','Teams Onboarded'],['98%','Customer Satisfaction'],['140+','Integrations']].map(([v,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:'2rem', fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{v}</div>
                <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'80px 5%', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={S.sectionTag}>Features</div>
          <h2 style={S.sectionTitle}>Everything you need to <span className="grad-text">master subscriptions</span></h2>
          <p style={S.sectionSub}>One intelligent platform to track, optimize, and control every recurring expense.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{ padding:28, position:'relative', overflow:'hidden', transition:'transform .3s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              <div style={{ width:52, height:52, borderRadius:14, background:`rgba(79,142,247,.1)`, border:'1px solid rgba(79,142,247,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:18 }}>{f.icon}</div>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.05rem', marginBottom:10 }}>{f.title}</h3>
              <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:'80px 5%', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={S.sectionTag}>Process</div>
          <h2 style={S.sectionTitle}>How <span className="grad-text">SubSync AI</span> works</h2>
        </div>
        <div className="process-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, position:'relative' }}>
          <div className="process-line" style={{ position:'absolute', top:44, left:'calc(16.67% + 20px)', right:'calc(16.67% + 20px)', height:2, background:'linear-gradient(to right,var(--blue),var(--purple))', zIndex:0 }} />
          {STEPS.map((step, i) => (
            <div key={i} className="glass" style={{ padding:'28px 20px', textAlign:'center', position:'relative', zIndex:1, transition:'transform .3s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-6px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'#fff', margin:'0 auto 20px' }}>{step.num}</div>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.05rem', marginBottom:10 }}>{step.title}</h3>
              <p style={{ color:'var(--text2)', fontSize:13, lineHeight:1.65 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:'80px 5%', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={S.sectionTag}>Pricing</div>
          <h2 style={S.sectionTitle}>Simple, <span className="grad-text">transparent</span> pricing</h2>
          <p style={S.sectionSub}>Start free, scale as you grow. Every plan includes AI-powered insights.</p>
        </div>
        <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {PRICING.map((plan, i) => (
            <div key={i} style={{ padding:28, borderRadius:'var(--r)', border:`1px solid ${plan.featured ? 'var(--purple)' : 'var(--border)'}`, background: plan.featured ? 'linear-gradient(135deg,rgba(139,92,246,.08),rgba(79,142,247,.04))' : 'var(--card)', position:'relative', transition:'transform .3s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-6px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              {plan.featured && <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'var(--grad)', color:'#fff', padding:'4px 18px', borderRadius:20, fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>Most Popular</div>}
              <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>{plan.tier}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'2.4rem', fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:4 }}>{plan.price}</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:12 }}>{plan.period}</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20, lineHeight:1.6 }}>{plan.desc}</div>
              <ul style={{ listStyle:'none', marginBottom:24 }}>
                {plan.features.map((f, fi) => (
                  <li key={fi} style={{ display:'flex', gap:8, fontSize:13, color:'var(--text2)', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ color:'var(--green)', fontWeight:700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={`btn ${plan.featured ? 'btn-primary' : 'btn-outline'}`} style={{ width:'100%' }} onClick={() => navigate('/signup')}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ padding:'80px 5%', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={S.sectionTag}>Testimonials</div>
          <h2 style={S.sectionTitle}>Loved by <span className="grad-text">founders & teams</span></h2>
        </div>
        <div className="testimonials-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="card" style={{ padding:24 }}>
              <div style={{ color:'var(--amber)', fontSize:14, marginBottom:14 }}>{'★'.repeat(t.stars)}</div>
              <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.7, marginBottom:20, fontStyle:'italic' }}>{t.text}</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff' }}>{t.name.split(' ').map(n=>n[0]).join('')}</div>
                <div><div style={{ fontWeight:600, fontSize:14 }}>{t.name}</div><div style={{ fontSize:12, color:'var(--text3)' }}>{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding:'60px 5%', margin:'0 5% 60px', background:'var(--grad)', borderRadius:20, textAlign:'center' }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(1.6rem,4vw,2.4rem)', fontWeight:800, color:'#fff', marginBottom:12 }}>Ready to take control of your subscriptions?</h2>
        <p style={{ color:'rgba(255,255,255,.8)', fontSize:16, marginBottom:28 }}>Join 10,000+ teams saving money with SubSync AI.</p>
        <button className="btn btn-lg" style={{ background:'#fff', color:'#4f8ef7', fontWeight:700, borderRadius:'var(--r2)' }} onClick={() => navigate('/signup')}>Start Free — No Credit Card →</button>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'50px 5% 30px', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div className="landing-footer-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 12 }}>
                <img src="/logo192.png" alt="Logo" style={{ height: '24px', width: '24px', borderRadius: '5px' }} />
                <span style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>SubSync AI</span>
              </div>
              <p style={{ color:'var(--text2)', fontSize:13, lineHeight:1.7, maxWidth:240 }}>The intelligent subscription management platform for modern businesses and individuals.</p>
            </div>
            {[
              { title:'Product', links:['Features','Pricing','Changelog','Roadmap','API Docs'] },
              { title:'Company', links:['About Us','Blog','Careers','Press Kit','Contact'] },
              { title:'Legal',   links:['Privacy Policy','Terms of Service','Cookie Policy','GDPR','Security'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>{col.title}</div>
                {col.links.map(l => <div key={l} style={{ fontSize:13, color:'var(--text2)', marginBottom:8, cursor:'pointer' }}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:'var(--text3)', flexWrap:'wrap', gap:10 }}>
            <span>© 2025 SubSync AI. All rights reserved.</span>
            <span>Made with ❤️ in India 🇮🇳</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const S = {
  sectionTag:  { display:'inline-block', background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.3)', color:'var(--purple)', padding:'5px 16px', borderRadius:20, fontSize:12, fontWeight:600, marginBottom:14, letterSpacing:1, textTransform:'uppercase' },
  sectionTitle:{ fontFamily:'Syne,sans-serif', fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:800, lineHeight:1.2, marginBottom:14 },
  sectionSub:  { color:'var(--text2)', fontSize:'1rem', maxWidth:480, margin:'0 auto' },
};
