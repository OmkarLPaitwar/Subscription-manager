const express = require('express');
const { prisma } = require('./utils/db');
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

// Security and logging middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100,
message: {
success: false,
message: 'Too many requests, please try again later.'
}
});

const authLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 10,
message: {
success: false,
message: 'Too many auth attempts, please try again later.'
}
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://subscription-manager-sand.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
res.json({
success: true,
message: 'SubSync API is running',
version: '1.0.0',
environment: process.env.NODE_ENV,
timestamp: new Date().toISOString()
});
});

// 404 handler
app.use('*', (req, res) => {
res.status(404).json({
success: false,
message: `Route ${req.originalUrl} not found`
});
});

// Global error handler
app.use((err, req, res, next) => {
console.error('Global Error:', err.stack);

res.status(err.status || 500).json({
success: false,
message: err.message || 'Internal Server Error',
...(process.env.NODE_ENV === 'development' && { stack: err.stack })
});
});

// Database connection
const connectDB = async () => {
try {
await prisma.$connect();
console.log('PostgreSQL Connected successfully via Prisma ORM.');
} catch (error) {
console.error('Database connection failed:', error.message);
process.exit(1);
}
};

// Start server
const startServer = async () => {
await connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`API Base URL: http://localhost:${PORT}/api`);
});

// Check renewals every day at 8 AM IST
cron.schedule('0 8 * * *', checkRenewals, {
timezone: 'Asia/Kolkata'
});

console.log('Cron jobs scheduled for daily check');
};

// Only start the server when run directly
if (require.main === module) {
startServer();
}

module.exports = app;
