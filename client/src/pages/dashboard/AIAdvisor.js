import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  { label: '💰 How can I save money?',        msg: 'How can I save money on my subscriptions?' },
  { label: '🗑️ What should I cancel?',        msg: 'Which subscriptions should I cancel?' },
  { label: '🔄 Any duplicate tools?',          msg: 'Are there any duplicate tools in my stack?' },
  { label: '📊 Predict next month bill',       msg: 'Predict my next month bill' },
  { label: '📅 Switch to annual plans?',       msg: 'Which plans should I switch to annual billing?' },
  { label: '🏆 Most expensive subscriptions', msg: 'What are my most expensive subscriptions?' },
];

const INIT_MSG = {
  role: 'bot',
  content: `Hey! I'm **SubBot AI** 🤖 — your personal subscription advisor.\n\nI've connected to your subscription data and I'm ready to help you:\n\n• 💰 Find savings opportunities\n• 🗑️ Identify what to cancel\n• 🔄 Detect duplicate tools\n• 📊 Predict upcoming bills\n• 📅 Recommend plan switches\n\nWhat would you like to explore?`,
  timestamp: new Date(),
};

const formatMsg = (text) =>
  text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

export default function AIAdvisor() {
  const [messages, setMessages] = useState([INIT_MSG]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [insights, setInsights] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior:'smooth' });

  useEffect(() => { scrollBottom(); }, [messages]);

  useEffect(() => {
    aiAPI.getInsights()
      .then(r => setInsights(r.data.data))
      .catch(() => {});
  }, []);

  const send = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));
      const { data } = await aiAPI.chat(msg, history);
      setMessages(prev => [...prev, { role:'bot', content: data.reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role:'bot', content: "Sorry, I'm having trouble right now. Please try again in a moment.", timestamp: new Date() }]);
    } finally { setLoading(false); }
  }, [input, loading, messages]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data } = await aiAPI.analyze();
      toast.success(`Analysis complete! Found ${data.data.unusedCount} unused subs & ${data.data.duplicateCategories} duplicate categories.`);
      const { data: ins } = await aiAPI.getInsights();
      setInsights(ins.data);
      setMessages(prev => [...prev, {
        role:'bot',
        content: `✅ **Analysis complete!**\n\nI scanned your subscriptions:\n• ${data.data.unusedCount} unused subscriptions found\n• ${data.data.duplicateCategories} duplicate tool categories\n• Potential savings: **₹${data.data.potentialMonthlySavings.toLocaleString()}/month**\n\nCheck the Insights panel on the right for detailed recommendations!`,
        timestamp: new Date()
      }]);
    } catch { toast.error('Analysis failed. Please try again.'); }
    finally { setAnalyzing(false); }
  };

  const clearChat = () => {
    setMessages([INIT_MSG]);
    toast('Chat cleared', { icon: '🗑️' });
  };

  return (
    <div className="grid-2-1" style={{ animation:'fadeUp .4s ease' }}>
      {/* CHAT WINDOW */}
      <div style={S.chatWrap}>
        {/* Chat Header */}
        <div style={S.chatHeader}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🤖</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>SubBot AI</div>
              <div style={{ fontSize:12, color:'var(--green)', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, background:'var(--green)', borderRadius:'50%', display:'inline-block' }}></span>
                Online · Ready to optimize
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? '⏳ Analyzing…' : '🔍 Run Analysis'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={clearChat}>🗑️</button>
          </div>
        </div>

        {/* Messages */}
        <div style={S.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display:'flex', gap:10, maxWidth:'86%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation:'fadeUp .3s ease' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13,
                background: msg.role === 'user' ? 'rgba(139,92,246,.2)' : 'var(--grad)',
                border: msg.role === 'user' ? '1px solid rgba(139,92,246,.4)' : 'none',
                color: msg.role === 'user' ? 'var(--purple)' : '#fff' }}>
                {msg.role === 'user' ? 'U' : '🤖'}
              </div>
              <div>
                <div style={{ padding:'12px 16px', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: msg.role === 'user' ? 'var(--grad)' : 'var(--bg3)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize:14, lineHeight:1.6 }}
                  dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }} />
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.timestamp?.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display:'flex', gap:10, alignSelf:'flex-start' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
              <div style={{ padding:'12px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'4px 12px 12px 12px', display:'flex', gap:5, alignItems:'center' }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width:7, height:7, background:'var(--text3)', borderRadius:'50%', display:'inline-block', animation:`pulse .8s ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={S.inputArea}>
          <textarea
            ref={inputRef}
            style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', borderRadius:'var(--r2)', padding:'12px 16px', fontSize:14, resize:'none', height:48, fontFamily:'DM Sans,sans-serif', outline:'none', lineHeight:1.5 }}
            placeholder="Ask SubBot AI anything about your subscriptions…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button style={{ width:48, height:48, background:'var(--grad)', border:'none', borderRadius:'var(--r2)', color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? .5 : 1, flexShrink:0 }}
            onClick={() => send()} disabled={loading || !input.trim()}>
            ➤
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Quick Prompts */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Quick Prompts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p.msg)} disabled={loading}
                style={{ padding:'9px 12px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', fontSize:13, color:'var(--text2)', cursor:'pointer', textAlign:'left', fontFamily:'DM Sans,sans-serif', transition:'all .2s' }}
                onMouseEnter={e => { e.target.style.borderColor='var(--purple)'; e.target.style.color='var(--purple)'; }}
                onMouseLeave={e => { e.target.style.borderColor='var(--border2)'; e.target.style.color='var(--text2)'; }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>AI Insights</div>
            <button className="btn btn-outline" style={{ padding:'4px 10px', fontSize:11 }} onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? '⏳' : '↻ Refresh'}
            </button>
          </div>
          {insights.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 10px' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
              <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>Run AI analysis to get personalized insights based on your subscriptions.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop:12, width:'100%' }} onClick={runAnalysis} disabled={analyzing}>
                {analyzing ? '⏳ Analyzing…' : 'Run Analysis'}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ padding:'12px', background:'var(--bg3)', borderRadius:'var(--r2)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:18, marginBottom:6 }}>{ins.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, marginBottom:4 }}>{ins.title}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.5, marginBottom:6 }}>{ins.description}</div>
                  {ins.saving > 0 && (
                    <div style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>Save ₹{ins.saving.toLocaleString()}/mo</div>
                  )}
                  <button onClick={() => send(ins.action)} style={{ marginTop:8, fontSize:11, color:'var(--blue)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'DM Sans,sans-serif' }}>
                    → Ask SubBot
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div style={{ padding:16, background:'rgba(79,142,247,.06)', border:'1px solid rgba(79,142,247,.2)', borderRadius:'var(--r)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--blue)', marginBottom:8 }}>💡 Pro Tips</div>
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
            {['Ask about specific subscriptions by name', 'Request a comparison between tools', 'Ask for a monthly savings plan', 'Get reminders for upcoming renewals'].map((t, i) => (
              <li key={i} style={{ fontSize:11, color:'var(--text2)', display:'flex', gap:6 }}>
                <span style={{ color:'var(--blue)' }}>•</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const S = {
  chatWrap:   { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', display:'flex', flexDirection:'column', height:'calc(100vh - 120px)', minHeight:400, maxHeight:700 },
  chatHeader: { padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  messages:   { flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 },
  inputArea:  { padding:'14px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:10 },
};
