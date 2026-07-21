const { Subscription, Notification } = require('../models');
const { Op } = require('sequelize');

// @GET /api/subscriptions
exports.getAll = async (req, res) => {
  try {
    const { status, category, search, sort = '-createdAt', page = 1, limit = 50 } = req.query;
    const where = { userId: req.user.id };
    if (status)   where.status = status;
    if (category) where.category = category;
    if (search) {
      // Use iLike for Postgres and standard like for SQLite
      const likeOp = process.env.DATABASE_URL ? Op.iLike : Op.like;
      where.name = { [likeOp]: `%${search}%` };
    }

    // Handle sort translation
    let order = [['createdAt', 'DESC']];
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.substring(1) : sort;
      // Map _id requests to id
      const orderField = field === '_id' ? 'id' : field;
      order = [[orderField, desc ? 'DESC' : 'ASC']];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const { rows: subs, count: total } = await Subscription.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: skip
    });

    res.json({ success: true, data: subs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/subscriptions/:id
exports.getOne = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    res.json({ success: true, data: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/subscriptions
exports.create = async (req, res) => {
  try {
    const sub = await Subscription.create({ ...req.body, userId: req.user.id });
    
    // Create a notification for new subscription
    await Notification.create({
      userId: req.user.id, subscriptionId: sub.id, type: 'system',
      title: `${sub.name} added successfully`,
      message: `Your ${sub.name} subscription has been added. Next renewal: ${new Date(sub.renewalDate).toLocaleDateString('en-IN')}.`,
      priority: 'low'
    });
    
    res.status(201).json({ success: true, data: sub, message: 'Subscription added successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/subscriptions/:id
exports.update = async (req, res) => {
  try {
    const existing = await Subscription.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    // Track cost change
    if (req.body.cost && Number(req.body.cost) !== existing.cost) {
      const costHistory = [...(existing.costHistory || [])];
      costHistory.push({
        cost: Number(req.body.cost),
        changedFrom: existing.cost,
        changedAt: new Date()
      });
      existing.costHistory = costHistory;

      // Notify price increase
      if (Number(req.body.cost) > existing.cost) {
        const increase = Math.round(((Number(req.body.cost) - existing.cost) / existing.cost) * 100);
        await Notification.create({
          userId: req.user.id, subscriptionId: existing.id, type: 'price_increase',
          title: `${existing.name} price increased by ${increase}%`,
          message: `${existing.name} cost changed from ₹${existing.cost} to ₹${req.body.cost}.`,
          priority: 'high', metadata: { oldCost: existing.cost, newCost: req.body.cost }
        });
      }
    }

    // Support nested setting via standard object assign (triggers virtual setters)
    Object.assign(existing, req.body);
    await existing.save();
    res.json({ success: true, data: existing, message: 'Subscription updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @DELETE /api/subscriptions/:id
exports.remove = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    
    await sub.destroy();
    res.json({ success: true, message: 'Subscription deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/subscriptions/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const sub = await Subscription.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    
    sub.status = status;
    await sub.save();
    res.json({ success: true, data: sub, message: `Subscription ${status.toLowerCase()}.` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @GET /api/subscriptions/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const active = await Subscription.findAll({ where: { userId, status: 'Active' } });

    const totalMonthly = active.reduce((sum, s) => sum + s.monthlyCost, 0);
    const totalAnnual = active.reduce((sum, s) => sum + s.annualCost, 0);

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const upcoming = active
      .filter(s => new Date(s.renewalDate) >= now && new Date(s.renewalDate) <= in7Days)
      .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    // Category breakdown
    const categoryMap = {};
    active.forEach(s => {
      categoryMap[s.category] = (categoryMap[s.category] || 0) + s.monthlyCost;
    });

    const mostExpensive = [...active].sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

    // AI savings estimate (unused + duplicates)
    const unused = active.filter(s => s.aiAnalysis?.isUnused);
    const potentialSavings = unused.reduce((sum, s) => sum + s.monthlyCost, 0);

    res.json({
      success: true,
      data: {
        totalActive: active.length,
        totalMonthly: Math.round(totalMonthly),
        totalAnnual: Math.round(totalAnnual),
        upcomingRenewals: upcoming,
        categoryBreakdown: categoryMap,
        mostExpensive: mostExpensive || null,
        potentialSavings: Math.round(potentialSavings),
        unusedCount: unused.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/subscriptions/upcoming
exports.getUpcoming = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const future = new Date(Date.now() + days * 86400000);
    const subs = await Subscription.findAll({
      where: {
        userId: req.user.id,
        status: 'Active',
        renewalDate: {
          [Op.gte]: new Date(),
          [Op.lte]: future
        }
      },
      order: [['renewalDate', 'ASC']]
    });
    res.json({ success: true, data: subs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/subscriptions/bulk-import
exports.bulkImport = async (req, res) => {
  try {
    const { subscriptions } = req.body;
    if (!Array.isArray(subscriptions) || subscriptions.length === 0)
      return res.status(400).json({ success: false, message: 'No subscriptions provided.' });
    
    const toInsert = subscriptions.map(s => ({ ...s, userId: req.user.id }));
    const inserted = await Subscription.bulkCreate(toInsert);
    res.status(201).json({ success: true, data: inserted, message: `${inserted.length} subscriptions imported.` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
