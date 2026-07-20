const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: [true, 'Service name is required'], trim: true, maxlength: 100 },
  category: {
    type: String, required: true,
    enum: ['Productivity', 'Development', 'Design', 'Communication', 'Storage', 'Entertainment', 'Finance', 'Marketing', 'Security', 'Analytics', 'HR', 'Other'],
    default: 'Other'
  },
  cost: { type: Number, required: [true, 'Cost is required'], min: [0, 'Cost cannot be negative'] },
  currency: { type: String, default: 'INR', enum: ['INR', 'USD', 'EUR', 'GBP'] },
  billingCycle: { type: String, required: true, enum: ['Monthly', 'Annual', 'Quarterly', 'Weekly', 'One-time'], default: 'Monthly' },
  renewalDate: { type: Date, required: [true, 'Renewal date is required'] },
  startDate:   { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Paused', 'Cancelled', 'Expired'], default: 'Active' },
  paymentMethod: { type: String, default: 'Card' },
  website:  { type: String, default: '' },
  icon:     { type: String, default: '🔷' },
  color:    { type: String, default: '#4f8ef7' },
  notes:    { type: String, maxlength: 500, default: '' },
  tags:     [{ type: String }],
  usageStats: {
    lastUsed:      { type: Date },
    usageScore:    { type: Number, default: 0, min: 0, max: 100 }, // 0-100
    monthlyLogins: { type: Number, default: 0 }
  },
  aiAnalysis: {
    isUnused:       { type: Boolean, default: false },
    isDuplicate:    { type: Boolean, default: false },
    savingsSuggestion: { type: String, default: '' },
    riskScore:      { type: Number, default: 0, min: 0, max: 100 }, // cancellation risk
    lastAnalyzed:   { type: Date }
  },
  // Cost history for tracking price changes
  costHistory: [{
    cost:        { type: Number },
    changedAt:   { type: Date, default: Date.now },
    changedFrom: { type: Number }
  }],
  remindersSent: [{ type: Date }],
  isShared:    { type: Boolean, default: false }, // shared with team
  sharedWith:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ─── Virtuals ────────────────────────────────────────────────────────────────
subscriptionSchema.virtual('monthlyCost').get(function() {
  if (this.billingCycle === 'Monthly')   return this.cost;
  if (this.billingCycle === 'Annual')    return Math.round(this.cost / 12);
  if (this.billingCycle === 'Quarterly') return Math.round(this.cost / 3);
  if (this.billingCycle === 'Weekly')    return Math.round(this.cost * 4.33);
  return this.cost;
});

subscriptionSchema.virtual('annualCost').get(function() {
  if (this.billingCycle === 'Monthly')   return this.cost * 12;
  if (this.billingCycle === 'Annual')    return this.cost;
  if (this.billingCycle === 'Quarterly') return this.cost * 4;
  if (this.billingCycle === 'Weekly')    return Math.round(this.cost * 52);
  return this.cost;
});

subscriptionSchema.virtual('daysUntilRenewal').get(function() {
  const diff = new Date(this.renewalDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ user: 1, renewalDate: 1 });
subscriptionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
