const express = require('express');
<<<<<<< HEAD
const { prisma } = require('./utils/db');
=======
const mongoose = require('mongoose');
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const billingRoutes = require('./routes/billing');
const userRoutes = require('./routes/users');
const { checkRenewals } = require('./utils/cronJobs');

const app = express();

<<<<<<< HEAD
// apply security and logging middlewares
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// rate limiting setup
=======
// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' }
});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

<<<<<<< HEAD
// cors config
=======
// ─── CORS ──────────────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

<<<<<<< HEAD
// body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// mount api routes
=======
// ─── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ────────────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', userRoutes);

<<<<<<< HEAD
// simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SubSync API is running',
=======
// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SubSync AI API is running 🚀',
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

<<<<<<< HEAD
// handle unmapped routes
=======
// ─── 404 Handler ──────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

<<<<<<< HEAD
// global error catcher
=======
// ─── Global Error Handler ─────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

<<<<<<< HEAD
// initialize db and express server
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL Connected successfully via Prisma ORM.');
  } catch (error) {
    console.error('Database connection failed:', error.message);
=======
// ─── Database + Server Start ──────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subsync-ai');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
<<<<<<< HEAD
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
  });

  // background jobs for renewals
  // check renewals every day at 8 AM IST
  cron.schedule('0 8 * * *', checkRenewals, { timezone: 'Asia/Kolkata' });
  console.log('Cron jobs scheduled for daily check');
};

// Only start the server when run directly (not when imported by tests)
if (require.main === module) {
  startServer();
}
=======
    console.log(`🚀 SubSync AI Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API Base: http://localhost:${PORT}/api`);
  });

  // ─── Cron Jobs ─────────────────────────────────────────────────────────────
  // Check renewals every day at 8 AM IST
  cron.schedule('0 8 * * *', checkRenewals, { timezone: 'Asia/Kolkata' });
  console.log('⏰ Cron jobs scheduled');
};

startServer();
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8

module.exports = app;
