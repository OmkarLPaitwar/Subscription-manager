const { prisma, addVirtualFields, addVirtualsToList } = require('../utils/db');

// get all subscriptions for the user
exports.getAll = async (req, res) => {
  try {
    const { status, category, search, sort = '-createdAt', page = 1, limit = 50 } = req.query;
    
    const query = { userId: req.user.id };
    if (status)   query.status = status;
    if (category) query.category = category;
    if (search)   query.name = { contains: search, mode: 'insensitive' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // sort parsing
    let orderBy = {};
    if (sort) {
      const field = sort.startsWith('-') ? sort.slice(1) : sort;
      const order = sort.startsWith('-') ? 'desc' : 'asc';
      orderBy[field] = order;
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({
        where: query,
        orderBy,
        skip,
        take: parseInt(limit),
        include: { costHistory: true }
      }),
      prisma.subscription.count({
        where: query
      })
    ]);

    const virtualSubs = addVirtualsToList(subs);
    res.json({ success: true, data: virtualSubs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// get a single subscription
exports.getOne = async (req, res) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { costHistory: true }
    });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    res.json({ success: true, data: addVirtualFields(sub) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// create a new subscription
exports.create = async (req, res) => {
  try {
    const { costHistory, sharedWith, ...subData } = req.body;
    
    if (subData.startDate) subData.startDate = new Date(subData.startDate);
    if (subData.renewalDate) subData.renewalDate = new Date(subData.renewalDate);
    if (subData.cost !== undefined) subData.cost = parseFloat(subData.cost);

    const sub = await prisma.subscription.create({
      data: {
        ...subData,
        userId: req.user.id
      },
      include: { costHistory: true }
    });

    // Create a notification for new subscription
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        subscriptionId: sub.id,
        type: 'system',
        title: `${sub.name} added successfully`,
        message: `Your ${sub.name} subscription has been added. Next renewal: ${new Date(sub.renewalDate).toLocaleDateString()}.`,
        priority: 'low'
      }
    });

    res.status(201).json({ success: true, data: addVirtualFields(sub), message: 'Subscription added successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// fully update a subscription
exports.update = async (req, res) => {
  try {
    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { costHistory: true }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    const { costHistory, sharedWith, ...updateData } = req.body;

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.renewalDate) updateData.renewalDate = new Date(updateData.renewalDate);
    if (updateData.cost !== undefined) updateData.cost = parseFloat(updateData.cost);

    // Track cost change
    if (updateData.cost !== undefined && updateData.cost !== existing.cost) {
      await prisma.costHistory.create({
        data: {
          subscriptionId: existing.id,
          cost: updateData.cost,
          changedFrom: existing.cost
        }
      });
      
      // Notify price increase
      if (updateData.cost > existing.cost) {
        const increase = Math.round(((updateData.cost - existing.cost) / existing.cost) * 100);
        await prisma.notification.create({
          data: {
            userId: req.user.id,
            subscriptionId: existing.id,
            type: 'price_increase',
            title: `${existing.name} price increased by ${increase}%`,
            message: `${existing.name} cost changed from ₹${existing.cost} to ₹${updateData.cost}.`,
            priority: 'high',
            metadata: { oldCost: existing.cost, newCost: updateData.cost }
          }
        });
      }
    }

    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: updateData,
      include: { costHistory: true }
    });

    res.json({ success: true, data: addVirtualFields(updated), message: 'Subscription updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// delete subscription
exports.remove = async (req, res) => {
  try {
    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    await prisma.subscription.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Subscription deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// update only the status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { status },
      include: { costHistory: true }
    });

    res.json({ success: true, data: addVirtualFields(updated), message: `Subscription ${status.toLowerCase()}.` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// get dashboard summary metrics
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const active = await prisma.subscription.findMany({
      where: { userId, status: 'Active' },
      include: { costHistory: true }
    });

    const virtualActive = addVirtualsToList(active);

    const totalMonthly = virtualActive.reduce((sum, s) => sum + s.monthlyCost, 0);
    const totalAnnual = virtualActive.reduce((sum, s) => sum + s.annualCost, 0);

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const upcoming = virtualActive
      .filter(s => s.renewalDate >= now && s.renewalDate <= in7Days)
      .sort((a, b) => a.renewalDate - b.renewalDate);

    // Category breakdown
    const categoryMap = {};
    virtualActive.forEach(s => {
      categoryMap[s.category] = (categoryMap[s.category] || 0) + s.monthlyCost;
    });

    const mostExpensive = virtualActive.sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

    // AI savings estimate (unused + duplicates)
    const unused = virtualActive.filter(s => s.aiAnalysis?.isUnused);
    const potentialSavings = unused.reduce((sum, s) => sum + s.monthlyCost, 0);

    res.json({
      success: true,
      data: {
        totalActive: virtualActive.length,
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

// get upcoming renewals
exports.getUpcoming = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const future = new Date(Date.now() + days * 86400000);
    const subs = await prisma.subscription.findMany({
      where: {
        userId: req.user.id,
        status: 'Active',
        renewalDate: { gte: new Date(), lte: future }
      },
      orderBy: { renewalDate: 'asc' },
      include: { costHistory: true }
    });
    res.json({ success: true, data: addVirtualsToList(subs) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// import multiple subscriptions
exports.bulkImport = async (req, res) => {
  try {
    const { subscriptions } = req.body;
    if (!Array.isArray(subscriptions) || subscriptions.length === 0)
      return res.status(400).json({ success: false, message: 'No subscriptions provided.' });
    
    const toInsert = subscriptions.map(s => {
      const { costHistory, sharedWith, ...subData } = s;
      if (subData.startDate) subData.startDate = new Date(subData.startDate);
      if (subData.renewalDate) subData.renewalDate = new Date(subData.renewalDate);
      if (subData.cost !== undefined) subData.cost = parseFloat(subData.cost);
      return { ...subData, userId: req.user.id };
    });

    const createdSubs = await prisma.$transaction(
      toInsert.map(data => prisma.subscription.create({ data }))
    );

    res.status(201).json({ success: true, data: addVirtualsToList(createdSubs), message: `${createdSubs.length} subscriptions imported.` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
