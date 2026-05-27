const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
  lastName:  { type: String, required: [true, 'Last name is required'],  trim: true, maxlength: 50 },
  email:     { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
               match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'] },
  password:  { type: String, minlength: 6, select: false },
  googleId:  { type: String, sparse: true },
  avatar:    { type: String, default: '' },
  phone:     { type: String, default: '' },
  company: {
    name:    { type: String, default: '' },
    gst:     { type: String, default: '' },
    address: { type: String, default: '' }
  },
  preferences: {
    currency:          { type: String, default: 'INR', enum: ['INR', 'USD', 'EUR', 'GBP'] },
    theme:             { type: String, default: 'dark', enum: ['dark', 'light'] },
    emailNotifications:{ type: Boolean, default: true },
    smsAlerts:         { type: Boolean, default: false },
    weeklyReport:      { type: Boolean, default: true },
    twoFactor:         { type: Boolean, default: false }
  },
  plan: { type: String, default: 'starter', enum: ['starter', 'business', 'enterprise'] },
  planExpiry: { type: Date },
  isVerified:    { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  lastLogin:     { type: Date },
  resetPasswordToken:   { type: String },
  resetPasswordExpire:  { type: Date },
  emailVerifyToken:     { type: String },
}, { timestamps: true });

// ─── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign({ id: this._id, email: this.email, plan: this.plan },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign({ id: this._id },
    process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerifyToken;
  delete obj.__v;
  return obj;
};

// ─── Virtual: full name ───────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes are provided via field-level options (e.g. `unique: true`).
// Removed explicit duplicate `schema.index()` calls to avoid Mongoose warnings.

module.exports = mongoose.model('User', userSchema);
