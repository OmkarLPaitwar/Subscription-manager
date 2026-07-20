const jwt = require('jsonwebtoken');
<<<<<<< HEAD
const { prisma } = require('../utils/db');
=======
const User = require('../models/User');
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
=======
    const user = await User.findById(decoded.id).select('-password');
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD
      req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
=======
      req.user = await User.findById(decoded.id).select('-password');
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    }
  } catch (_) {}
  next();
};

const requirePlan = (...plans) => (req, res, next) => {
  if (!plans.includes(req.user.plan)) {
    return res.status(403).json({
      success: false,
      message: `This feature requires a ${plans.join(' or ')} plan.`,
      upgrade: true
    });
  }
  next();
};

module.exports = { protect, optionalAuth, requirePlan };
