const { Notification, Subscription } = require('../models');

// @GET /api/notifications
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const where = { userId: req.user.id, isArchived: false };
    if (unreadOnly === 'true') where.isRead = false;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows: notifications, count: total } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: skip,
      include: [{
        model: Subscription,
        as: 'sub',
        attributes: ['name', 'icon']
      }]
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false, isArchived: false }
    });

    res.json({ success: true, data: notifications, total, unreadCount, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    
    notif.isRead = true;
    notif.readAt = new Date();
    await notif.save();
    
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/notifications/:id
exports.remove = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    
    notif.isArchived = true;
    await notif.save();
    res.json({ success: true, message: 'Notification dismissed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/notifications/unread-count
exports.unreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false, isArchived: false }
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
