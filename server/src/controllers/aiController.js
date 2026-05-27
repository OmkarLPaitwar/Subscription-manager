const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');

// Build context string from subscriptions
const buildContext = (subs) => {
  const active = subs.filter(s => s.status === 'Active');
  const totalMonthly = active.reduce((sum, s) => sum + s.monthlyCost, 0);
  const lines = active.map(s =>
    `- ${s.name} (${s.category}): ₹${s.monthlyCost}/mo, renewal ${new Date(s.renewalDate).toDateString()}, usage score: ${s.usageStats?.usageScore || 'unknown'}`
  ).join('\n');
  return `User has ${active.length} active subscriptions totalling ₹${Math.round(totalMonthly)}/month:\n${lines}`;
};

// Rule-based fallback AI (no OpenAI key required)
const ruleBasedResponse = (message, subs) => {
  const msg = message.toLowerCase();
  const active = subs.filter(s => s.status === 'Active');
  const totalMonthly = Math.round(active.reduce((sum, s) => sum + s.monthlyCost, 0));

  if (msg.includes('save') || msg.includes('saving') || msg.includes('reduce') || msg.includes('cut')) {
    const low = active.filter(s => (s.usageStats?.usageScore || 50) < 30);
    const annualCandidates = active.filter(s => s.billingCycle === 'Monthly' && s.cost > 500);
    const savings = low.reduce((sum, s) => sum + s.monthlyCost, 0);
    let msg = `Based on your ${active.length} subscriptions (₹${totalMonthly}/mo), here are my top savings tips:\n\n`;
    if (low.length) msg += `🗑️ **Cancel low-usage tools:** ${low.map(s => s.name).join(', ')} → saves ~₹${Math.round(savings)}/mo\n\n`;
    if (annualCandidates.length) msg += `📅 **Switch to annual billing:** ${annualCandidates.slice(0,3).map(s => s.name).join(', ')} → typically saves 15-20%\n\n`;
    msg += `💡 Total potential savings: **₹${Math.round(savings * 1.15)}/month**`;
    return msg;
  }
  if (msg.includes('cancel') || msg.includes('unused') || msg.includes('remove')) {
    const low = active.filter(s => (s.usageStats?.usageScore || 50) < 30);
    if (!low.length) return `Good news! All your subscriptions appear to be actively used. No obvious cancellation candidates right now.`;
    return `Here are subscriptions you could consider cancelling:\n\n${low.map(s =>
      `⚠️ **${s.name}** — Low usage (score: ${s.usageStats?.usageScore || '<30'}/100), costs ₹${s.monthlyCost}/mo`
    ).join('\n')}\n\nCancelling these saves **₹${Math.round(low.reduce((s,x)=>s+x.monthlyCost,0))}/month**.`;
  }
  if (msg.includes('duplicate') || msg.includes('overlap') || msg.includes('similar')) {
    const cats = {};
    active.forEach(s => { cats[s.category] = cats[s.category] || []; cats[s.category].push(s.name); });
    const dupes = Object.entries(cats).filter(([,v]) => v.length > 1);
    if (!dupes.length) return `No obvious duplicate tools detected in your stack. Each category has a single tool — great job!`;
    return `I found potential overlapping tools:\n\n${dupes.map(([cat, names]) =>
      `🔄 **${cat}:** ${names.join(', ')} — do you really need all ${names.length}?`
    ).join('\n')}\n\nConsolidating duplicates could save significant money!`;
  }
  if (msg.includes('predict') || msg.includes('next month') || msg.includes('forecast')) {
    const next = Math.round(totalMonthly * 1.03);
    const renewals = active.filter(s => {
      const days = Math.ceil((new Date(s.renewalDate) - new Date()) / 86400000);
      return days > 0 && days <= 30;
    });
    return `📊 **Predicted next month bill: ₹${next}**\n\nBreakdown:\n• Current monthly spend: ₹${totalMonthly}\n• Projected growth: +₹${next - totalMonthly} (based on usage trends)\n\n${renewals.length} renewals due in next 30 days:\n${renewals.map(s => `• ${s.name}: ₹${s.monthlyCost} (${new Date(s.renewalDate).toDateString()})`).join('\n')}`;
  }
  if (msg.includes('annual') || msg.includes('yearly') || msg.includes('switch')) {
    const monthly = active.filter(s => s.billingCycle === 'Monthly' && s.cost > 300);
    if (!monthly.length) return `Most of your subscriptions are already on annual billing — great for savings!`;
    return `Here are subscriptions worth switching to annual:\n\n${monthly.slice(0,4).map(s => {
      const save = Math.round(s.cost * 12 * 0.17);
      return `📅 **${s.name}** — ₹${s.cost}/mo → ~₹${Math.round(s.cost*12*0.83/12)}/mo on annual → Save ₹${save}/year`;
    }).join('\n')}\n\nTotal estimated annual savings: **₹${Math.round(monthly.slice(0,4).reduce((s,x)=>s+x.cost*12*0.17,0))}**`;
  }
  if (msg.includes('most expensive') || msg.includes('expensive') || msg.includes('costly')) {
    const sorted = [...active].sort((a, b) => b.monthlyCost - a.monthlyCost).slice(0, 5);
    return `Your top 5 most expensive subscriptions:\n\n${sorted.map((s, i) =>
      `${i+1}. **${s.name}** — ₹${s.monthlyCost}/mo (${s.category})`
    ).join('\n')}\n\nThese account for ${Math.round(sorted.reduce((s,x)=>s+x.monthlyCost,0)/totalMonthly*100)}% of your total spend.`;
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! I'm SubBot AI, your personal subscription advisor 🤖\n\nI've analyzed your ${active.length} active subscriptions worth ₹${totalMonthly}/month. I can help you:\n\n• 💰 Find savings opportunities\n• 🗑️ Identify subscriptions to cancel\n• 🔄 Detect duplicate tools\n• 📊 Predict next month's bill\n• 📅 Suggest annual plan switches\n\nWhat would you like to explore?`;
  }
  return `I'm analyzing your ${active.length} subscriptions (₹${totalMonthly}/mo total). I can help with:\n\n• Savings suggestions\n• Cancellation recommendations\n• Duplicate detection\n• Bill predictions\n• Annual plan switches\n\nTry asking: "How can I save money?" or "Which should I cancel?"`;
};

// @POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required.' });

    const subs = await Subscription.find({ user: req.user._id });

    // Try OpenAI if key exists
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here') {
      try {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const systemPrompt = `You are SubBot AI, an expert subscription management advisor for Indian businesses. Be concise, practical, and use ₹ for currency.
Current user subscription data:
${buildContext(subs)}`;
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ];
        const response = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages, max_tokens: 500 });
        const reply = response.choices[0].message.content;
        return res.json({ success: true, reply, source: 'openai' });
      } catch (aiErr) {
        console.warn('OpenAI error, using rule-based fallback:', aiErr.message);
      }
    }

    // Rule-based fallback
    const reply = ruleBasedResponse(message, subs);
    res.json({ success: true, reply, source: 'rule-based' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/ai/analyze
exports.analyze = async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user._id, status: 'Active' });
    const now = new Date();
    const notifications = [];

    for (const sub of subs) {
      // Mark unused (no usage score or very low)
      const score = sub.usageStats?.usageScore || 50;
      const wasUnused = sub.aiAnalysis.isUnused;
      sub.aiAnalysis.isUnused = score < 20;
      sub.aiAnalysis.lastAnalyzed = now;

      if (sub.aiAnalysis.isUnused && !wasUnused) {
        notifications.push({
          user: req.user._id, subscription: sub._id, type: 'unused_warning',
          title: `${sub.name} appears unused`,
          message: `${sub.name} has a usage score of ${score}/100. Consider cancelling to save ₹${sub.monthlyCost}/month.`,
          priority: 'medium'
        });
      }
      await sub.save();
    }

    // Detect duplicates by category
    const catMap = {};
    subs.forEach(s => { catMap[s.category] = catMap[s.category] || []; catMap[s.category].push(s); });
    for (const [cat, catSubs] of Object.entries(catMap)) {
      if (catSubs.length > 1) {
        for (const s of catSubs) { s.aiAnalysis.isDuplicate = true; await s.save(); }
        notifications.push({
          user: req.user._id, type: 'duplicate_detected',
          title: `Duplicate ${cat} tools detected`,
          message: `You have ${catSubs.length} ${cat} tools: ${catSubs.map(s=>s.name).join(', ')}. Consider consolidating.`,
          priority: 'medium'
        });
      }
    }

    if (notifications.length) {
      await Notification.insertMany(notifications, { ordered: false });
    }

    const totalSavings = subs.filter(s => s.aiAnalysis.isUnused).reduce((sum, s) => sum + s.monthlyCost, 0);
    res.json({
      success: true, message: 'Analysis complete.',
      data: { analysedCount: subs.length, unusedCount: subs.filter(s=>s.aiAnalysis.isUnused).length,
              duplicateCategories: Object.values(catMap).filter(v=>v.length>1).length,
              potentialMonthlySavings: Math.round(totalSavings), notificationsCreated: notifications.length }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/ai/insights
exports.getInsights = async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user._id, status: 'Active' });
    const insights = [];

    // Unused
    const unused = subs.filter(s => s.aiAnalysis?.isUnused);
    if (unused.length) insights.push({
      type: 'unused', icon: '⚠️', priority: 'high',
      title: 'Unused Subscriptions',
      description: `${unused.map(s=>s.name).join(', ')} appear unused.`,
      saving: unused.reduce((s,x)=>s+x.monthlyCost,0),
      action: 'Cancel these to save ₹' + Math.round(unused.reduce((s,x)=>s+x.monthlyCost,0)) + '/mo'
    });

    // Duplicates
    const catMap = {};
    subs.forEach(s => { catMap[s.category] = catMap[s.category] || []; catMap[s.category].push(s); });
    const dupes = Object.entries(catMap).filter(([,v])=>v.length>1);
    if (dupes.length) insights.push({
      type: 'duplicate', icon: '🔄', priority: 'medium',
      title: 'Duplicate Tools',
      description: dupes.map(([cat, v])=>`${v.length}x ${cat} tools`).join(', '),
      saving: 0,
      action: 'Consolidate to save on overlapping tools'
    });

    // Annual switch candidates
    const annualCandidates = subs.filter(s => s.billingCycle === 'Monthly' && s.cost > 500);
    if (annualCandidates.length) {
      const save = Math.round(annualCandidates.reduce((s,x)=>s+x.cost*12*0.17,0));
      insights.push({
        type: 'annual', icon: '📅', priority: 'medium',
        title: 'Switch to Annual Plans',
        description: `${annualCandidates.map(s=>s.name).slice(0,3).join(', ')} can be billed annually.`,
        saving: Math.round(save / 12),
        action: `Save ₹${save}/year by switching to annual billing`
      });
    }

    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
