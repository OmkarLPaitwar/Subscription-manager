const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  type: {
    type: String, required: true,
    enum: ['renewal', 'price_increase', 'ai_insight', 'payment_success', 'payment_failed',
           'unused_warning', 'duplicate_detected', 'savings_opportunity', 'system']
  },
  title:   { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 1000 },
  priority:  { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  isRead:    { type: Boolean, default: false },
  isArchived:{ type: Boolean, default: false },
  actionUrl: { type: String, default: '' },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  emailSent: { type: Boolean, default: false },
  smsSent:   { type: Boolean, default: false },
  readAt:    { type: Date }
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
