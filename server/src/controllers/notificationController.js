<<<<<<< HEAD
const { prisma } = require('../utils/db');

// route handler
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    
    const query = { userId: req.user.id, isArchived: false };
    if (unreadOnly === 'true') query.isRead = false;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: query,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          subscription: {
            select: {
              name: true,
              icon: true
            }
          }
        }
      }),
      prisma.notification.count({ where: query }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false, isArchived: false }
      })
    ]);
    
=======
const Notification = require('../models/Notification');

// @GET /api/notifications
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { user: req.user._id, isArchived: false };
    if (unreadOnly === 'true') query.isRead = false;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)).populate('subscription', 'name icon'),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, isRead: false, isArchived: false })
    ]);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, data: notifications, total, unreadCount, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.markRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true, readAt: new Date() }
    });
=======
// @PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true, readAt: new Date() }
    );
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
=======
// @PATCH /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.remove = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isArchived: true }
    });
=======
// @DELETE /api/notifications/:id
exports.remove = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isArchived: true });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, message: 'Notification dismissed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.unreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false, isArchived: false }
    });
=======
// @GET /api/notifications/unread-count
exports.unreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false, isArchived: false });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
