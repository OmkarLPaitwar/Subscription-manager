const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['renewal', 'price_increase', 'ai_insight', 'payment_success', 'payment_failed',
             'unused_warning', 'duplicate_detected', 'savings_opportunity', 'system']]
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'urgent']]
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  actionUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  smsSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id;
    }
  },

}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isRead', 'createdAt'] }
  ]
});

// Custom JSON serialization to include virtuals automatically
Notification.prototype.toJSON = function() {
  const values = { ...this.get() };
  values._id = this.id;
  values.user = this.userId;
  values.subscription = this.subscriptionId;
  return values;
};

module.exports = Notification;
