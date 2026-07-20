<<<<<<< HEAD
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
=======
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');

// @GET /api/subscriptions
exports.getAll = async (req, res) => {
  try {
    const { status, category, search, sort = '-createdAt', page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id };
    if (status)   query.status = status;
    if (category) query.category = category;
    if (search)   query.name = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [subs, total] = await Promise.all([
      Subscription.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      Subscription.countDocuments(query)
    ]);
    res.json({ success: true, data: subs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// get a single subscription
exports.getOne = async (req, res) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { costHistory: true }
    });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    res.json({ success: true, data: addVirtualFields(sub) });
=======
// @GET /api/subscriptions/:id
exports.getOne = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    res.json({ success: true, data: sub });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
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
=======
// @POST /api/subscriptions
exports.create = async (req, res) => {
  try {
    const sub = await Subscription.create({ ...req.body, user: req.user._id });
    // Create a notification for new subscription
    await Notification.create({
      user: req.user._id, subscription: sub._id, type: 'system',
      title: `${sub.name} added successfully`,
      message: `Your ${sub.name} subscription has been added. Next renewal: ${new Date(sub.renewalDate).toLocaleDateString()}.`,
      priority: 'low'
    });
    res.status(201).json({ success: true, data: sub, message: 'Subscription added successfully.' });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
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
=======
// @PUT /api/subscriptions/:id
exports.update = async (req, res) => {
  try {
    const existing = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
    if (!existing) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    // Track cost change
    if (req.body.cost && req.body.cost !== existing.cost) {
      existing.costHistory.push({ cost: req.body.cost, changedFrom: existing.cost });
      // Notify price increase
      if (req.body.cost > existing.cost) {
        const increase = Math.round(((req.body.cost - existing.cost) / existing.cost) * 100);
        await Notification.create({
          user: req.user._id, subscription: existing._id, type: 'price_increase',
          title: `${existing.name} price increased by ${increase}%`,
          message: `${existing.name} cost changed from ₹${existing.cost} to ₹${req.body.cost}.`,
          priority: 'high', metadata: { oldCost: existing.cost, newCost: req.body.cost }
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
        });
      }
    }

<<<<<<< HEAD
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: updateData,
      include: { costHistory: true }
    });

    res.json({ success: true, data: addVirtualFields(updated), message: 'Subscription updated.' });
=======
    Object.assign(existing, req.body);
    await existing.save();
    res.json({ success: true, data: existing, message: 'Subscription updated.' });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
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
=======
// @DELETE /api/subscriptions/:id
exports.remove = async (req, res) => {
  try {
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, message: 'Subscription deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
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
=======
// @PATCH /api/subscriptions/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status }, { new: true }
    );
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    res.json({ success: true, data: sub, message: `Subscription ${status.toLowerCase()}.` });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
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
=======
// @GET /api/subscriptions/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const active = await Subscription.find({ user: userId, status: 'Active' });

    const totalMonthly = active.reduce((sum, s) => sum + s.monthlyCost, 0);
    const totalAnnual = active.reduce((sum, s) => sum + s.annualCost, 0);

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const upcoming = active
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
      .filter(s => s.renewalDate >= now && s.renewalDate <= in7Days)
      .sort((a, b) => a.renewalDate - b.renewalDate);

    // Category breakdown
    const categoryMap = {};
<<<<<<< HEAD
    virtualActive.forEach(s => {
      categoryMap[s.category] = (categoryMap[s.category] || 0) + s.monthlyCost;
    });

    const mostExpensive = virtualActive.sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

    // AI savings estimate (unused + duplicates)
    const unused = virtualActive.filter(s => s.aiAnalysis?.isUnused);
=======
    active.forEach(s => {
      categoryMap[s.category] = (categoryMap[s.category] || 0) + s.monthlyCost;
    });

    const mostExpensive = active.sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

    // AI savings estimate (unused + duplicates)
    const unused = active.filter(s => s.aiAnalysis?.isUnused);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    const potentialSavings = unused.reduce((sum, s) => sum + s.monthlyCost, 0);

    res.json({
      success: true,
      data: {
<<<<<<< HEAD
        totalActive: virtualActive.length,
=======
        totalActive: active.length,
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
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

<<<<<<< HEAD
// get upcoming renewals
=======
// @GET /api/subscriptions/upcoming
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.getUpcoming = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const future = new Date(Date.now() + days * 86400000);
<<<<<<< HEAD
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
=======
    const subs = await Subscription.find({
      user: req.user._id, status: 'Active',
      renewalDate: { $gte: new Date(), $lte: future }
    }).sort('renewalDate');
    res.json({ success: true, data: subs });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// import multiple subscriptions
=======
// @POST /api/subscriptions/bulk-import
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.bulkImport = async (req, res) => {
  try {
    const { subscriptions } = req.body;
    if (!Array.isArray(subscriptions) || subscriptions.length === 0)
      return res.status(400).json({ success: false, message: 'No subscriptions provided.' });
<<<<<<< HEAD
    
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
=======
    const toInsert = subscriptions.map(s => ({ ...s, user: req.user._id }));
    const inserted = await Subscription.insertMany(toInsert, { ordered: false });
    res.status(201).json({ success: true, data: inserted, message: `${inserted.length} subscriptions imported.` });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
