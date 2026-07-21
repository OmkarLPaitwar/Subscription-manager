const { prisma, addVirtualFields, addVirtualsToList } = require('../utils/db');

// Build context string from subscriptions
const buildContext = (subs) => {
  const active = subs.filter(s => s.status === 'Active');
  const totalMonthly = active.reduce((sum, s) => sum + s.monthlyCost, 0);
  const lines = active.map(s =>
    `- ${s.name} (${s.category}): ₹${s.monthlyCost}/mo, renewal ${new Date(s.renewalDate).toDateString()}, usage score: ${s.usageStats?.usageScore || 'unknown'}`
  ).join('\n');
  return `User has ${active.length} active subscriptions totalling ₹${Math.round(totalMonthly)}/month:\n${lines}`;
};

// basic intent matcher for fallback responses when openai is unavailable
const getFallbackResponse = (message, subscriptions) => {
  const query = message.toLowerCase();
  const activeSubs = subscriptions.filter(sub => sub.status === 'Active');
  const totalSpend = Math.round(activeSubs.reduce((acc, curr) => acc + curr.monthlyCost, 0));

  if (/(save|saving|reduce|cut)/.test(query)) {
    const lowUsage = activeSubs.filter(s => (s.usageStats?.usageScore || 50) < 30);
    const annualOptions = activeSubs.filter(s => s.billingCycle === 'Monthly' && s.cost > 500);
    const potentialSavings = lowUsage.reduce((acc, s) => acc + s.monthlyCost, 0);
    
    let reply = `Based on your ${activeSubs.length} subscriptions (Rs. ${totalSpend}/mo), here are some tips:\n\n`;
    if (lowUsage.length) {
      reply += `- Cancel low-usage tools: ${lowUsage.map(s => s.name).join(', ')} (saves ~Rs. ${Math.round(potentialSavings)}/mo)\n`;
    }
    if (annualOptions.length) {
      reply += `- Switch to annual billing for: ${annualOptions.slice(0,3).map(s => s.name).join(', ')} (typically saves 15-20%)\n`;
    }
    return (lowUsage.length || annualOptions.length) ? reply : `You're currently optimized! No obvious savings found.`;
  }
  
  if (/(cancel|unused|remove)/.test(query)) {
    const lowUsage = activeSubs.filter(s => (s.usageStats?.usageScore || 50) < 30);
    if (!lowUsage.length) return `All your subscriptions seem to be actively used right now.`;
    
    return `You might want to consider cancelling these:\n` + lowUsage.map(s => 
      `- ${s.name} (Low usage, costs Rs. ${s.monthlyCost}/mo)`
    ).join('\n');
  }

  if (/(duplicate|overlap|similar)/.test(query)) {
    const categories = {};
    activeSubs.forEach(s => { categories[s.category] = categories[s.category] || []; categories[s.category].push(s.name); });
    const duplicates = Object.entries(categories).filter(([, items]) => items.length > 1);
    
    if (!duplicates.length) return `No obvious duplicate tools detected.`;
    return `Found potential overlapping tools:\n` + duplicates.map(([cat, names]) => 
      `- ${cat}: ${names.join(', ')}`
    ).join('\n');
  }
  
  // default greeting/help
  return `I'm analyzing your ${activeSubs.length} subscriptions (Rs. ${totalSpend}/mo total). I can help with savings suggestions, cancellation recommendations, or detecting duplicate tools.`;
};

// handle chat messages
exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required.' });

    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id }
    });

    const virtualSubs = addVirtualsToList(subs);

    // Try OpenAI if key exists
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here') {
      try {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const systemPrompt = `You are SubBot AI, an expert subscription management advisor for Indian businesses. Be concise, practical, and use ₹ for currency.
Current user subscription data:
${buildContext(virtualSubs)}`;
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

    // fallback if no openai integration
    const reply = getFallbackResponse(message, virtualSubs);
    res.json({ success: true, reply, source: 'rule-based' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// run automated analysis
exports.analyze = async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id, status: 'Active' }
    });
    
    const virtualSubs = addVirtualsToList(subs);
    const now = new Date();
    const notifications = [];

    for (const sub of virtualSubs) {
      // Mark unused (no usage score or very low)
      const score = sub.usageStats?.usageScore || 50;
      const wasUnused = sub.aiAnalysis.isUnused;
      const isUnused = score < 20;

      const updatedAiAnalysis = {
        ...sub.aiAnalysis,
        isUnused,
        lastAnalyzed: now
      };

      if (isUnused && !wasUnused) {
        notifications.push({
          userId: req.user.id,
          subscriptionId: sub.id,
          type: 'unused_warning',
          title: `${sub.name} appears unused`,
          message: `${sub.name} has a usage score of ${score}/100. Consider cancelling to save ₹${sub.monthlyCost}/month.`,
          priority: 'medium'
        });
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          aiAnalysis: updatedAiAnalysis
        }
      });
    }

    // Detect duplicates by category
    const updatedSubs = await prisma.subscription.findMany({
      where: { userId: req.user.id, status: 'Active' }
    });
    const virtualUpdated = addVirtualsToList(updatedSubs);

    const catMap = {};
    virtualUpdated.forEach(s => { catMap[s.category] = catMap[s.category] || []; catMap[s.category].push(s); });
    for (const [cat, catSubs] of Object.entries(catMap)) {
      if (catSubs.length > 1) {
        for (const s of catSubs) {
          const updatedAiAnalysis = {
            ...s.aiAnalysis,
            isDuplicate: true
          };
          await prisma.subscription.update({
            where: { id: s.id },
            data: { aiAnalysis: updatedAiAnalysis }
          });
        }
        notifications.push({
          userId: req.user.id,
          type: 'duplicate_detected',
          title: `Duplicate ${cat} tools detected`,
          message: `You have ${catSubs.length} ${cat} tools: ${catSubs.map(s=>s.name).join(', ')}. Consider consolidating.`,
          priority: 'medium'
        });
      }
    }

    if (notifications.length) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    const finalSubs = await prisma.subscription.findMany({
      where: { userId: req.user.id, status: 'Active' }
    });
    const virtualFinal = addVirtualsToList(finalSubs);

    const totalSavings = virtualFinal.filter(s => s.aiAnalysis.isUnused).reduce((sum, s) => sum + s.monthlyCost, 0);
    
    res.json({
      success: true,
      message: 'Analysis complete.',
      data: {
        analysedCount: virtualFinal.length,
        unusedCount: virtualFinal.filter(s=>s.aiAnalysis.isUnused).length,
        duplicateCategories: Object.values(catMap).filter(v=>v.length>1).length,
        potentialMonthlySavings: Math.round(totalSavings),
        notificationsCreated: notifications.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// get dashboard insights
exports.getInsights = async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id, status: 'Active' }
    });

    const virtualSubs = addVirtualsToList(subs);
    const insights = [];

    // Unused
    const unused = virtualSubs.filter(s => s.aiAnalysis?.isUnused);
    if (unused.length) insights.push({
      type: 'unused', priority: 'high',
      title: 'Unused Subscriptions',
      description: `${unused.map(s=>s.name).join(', ')} appear unused.`,
      saving: unused.reduce((s,x)=>s+x.monthlyCost,0),
      action: 'Cancel these to save Rs. ' + Math.round(unused.reduce((s,x)=>s+x.monthlyCost,0)) + '/mo'
    });

    // Duplicates
    const catMap = {};
    virtualSubs.forEach(s => { catMap[s.category] = catMap[s.category] || []; catMap[s.category].push(s); });
    const dupes = Object.entries(catMap).filter(([,v])=>v.length>1);
    if (dupes.length) insights.push({
      type: 'duplicate', priority: 'medium',
      title: 'Duplicate Tools',
      description: dupes.map(([cat, v])=>`${v.length}x ${cat} tools`).join(', '),
      saving: 0,
      action: 'Consolidate to save on overlapping tools'
    });

    // Annual switch candidates
    const annualCandidates = virtualSubs.filter(s => s.billingCycle === 'Monthly' && s.cost > 500);
    if (annualCandidates.length) {
      const save = Math.round(annualCandidates.reduce((s,x)=>s+x.cost*12*0.17,0));
      insights.push({
        type: 'annual', priority: 'medium',
        title: 'Switch to Annual Plans',
        description: `${annualCandidates.map(s=>s.name).slice(0,3).join(', ')} can be billed annually.`,
        saving: Math.round(save / 12),
        action: `Save Rs. ${save}/year by switching to annual billing`
      });
    }

    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
