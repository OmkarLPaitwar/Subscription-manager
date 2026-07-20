const { prisma, addVirtualsToList } = require('../utils/db');

// route handler
exports.monthlySpend = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const userId = req.user.id;
    const subs = await prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ['Active', 'Cancelled'] }
      },
      include: { costHistory: true }
    });

    const virtualSubs = addVirtualsToList(subs);

    // Build last N months
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      // Subscriptions active during that month
      const active = virtualSubs.filter(s =>
        new Date(s.startDate) <= monthEnd &&
        (s.status === 'Active' || new Date(s.updatedAt) >= monthStart)
      );
      const total = active.reduce((sum, s) => sum + s.monthlyCost, 0);
      result.push({ month: label, total: Math.round(total), count: active.length });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// route handler
exports.categoryBreakdown = async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id, status: 'Active' },
      include: { costHistory: true }
    });
    
    const virtualSubs = addVirtualsToList(subs);
    const map = {};
    virtualSubs.forEach(s => {
      if (!map[s.category]) map[s.category] = { name: s.category, total: 0, count: 0, subs: [] };
      map[s.category].total += s.monthlyCost;
      map[s.category].count += 1;
      map[s.category].subs.push(s.name);
    });
    
    const totalSpend = Object.values(map).reduce((s, c) => s + c.total, 0);
    const data = Object.values(map).map(c => ({
      ...c,
      total: Math.round(c.total),
      percentage: totalSpend ? Math.round((c.total / totalSpend) * 100) : 0
    })).sort((a, b) => b.total - a.total);
    
    res.json({ success: true, data, totalSpend: Math.round(totalSpend) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// route handler
exports.forecast = async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id, status: 'Active' },
      include: { costHistory: true }
    });
    
    const virtualSubs = addVirtualsToList(subs);
    const currentMonthly = virtualSubs.reduce((sum, s) => sum + s.monthlyCost, 0);
    
    // Simple linear forecast: +3% monthly growth
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      forecast.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        predicted: Math.round(currentMonthly * Math.pow(1.03, i))
      });
    }
    res.json({ success: true, data: forecast, currentMonthly: Math.round(currentMonthly) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// route handler
exports.renewalCalendar = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m, 0);
    
    const subs = await prisma.subscription.findMany({
      where: {
        userId: req.user.id,
        status: 'Active',
        renewalDate: { gte: start, lte: end }
      },
      select: {
        name: true,
        renewalDate: true,
        cost: true,
        billingCycle: true,
        icon: true,
        color: true
      }
    });

    const virtualSubs = addVirtualsToList(subs);
    
    // Group by day
    const calendar = {};
    virtualSubs.forEach(s => {
      const day = new Date(s.renewalDate).getDate();
      if (!calendar[day]) calendar[day] = [];
      calendar[day].push({ name: s.name, cost: s.monthlyCost, icon: s.icon, color: s.color });
    });
    res.json({ success: true, data: calendar, month: m, year: y });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// route handler
exports.topSubscriptions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id, status: 'Active' },
      orderBy: { cost: 'desc' },
      take: limit,
      include: { costHistory: true }
    });
    
    res.json({ success: true, data: addVirtualsToList(subs) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
