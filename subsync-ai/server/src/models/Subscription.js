const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Service name is required' },
      len: [0, 100]
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Other',
    validate: {
      isIn: [['Productivity', 'Development', 'Design', 'Communication', 'Storage', 'Entertainment', 'Finance', 'Marketing', 'Security', 'Analytics', 'HR', 'Other']]
    }
  },
  cost: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Cost cannot be negative' }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR',
    validate: {
      isIn: [['INR', 'USD', 'EUR', 'GBP']]
    }
  },
  billingCycle: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Monthly',
    validate: {
      isIn: [['Monthly', 'Annual', 'Quarterly', 'Weekly', 'One-time']]
    }
  },
  renewalDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: { msg: 'Renewal date is required' }
    }
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
    validate: {
      isIn: [['Active', 'Paused', 'Cancelled', 'Expired']]
    }
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'Card'
  },
  website: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '🔷'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#4f8ef7'
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  // Arrays/Objects stored as JSON
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  costHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  remindersSent: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isShared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sharedWith: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Flattened usageStats fields
  usageLastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  usageScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  usageMonthlyLogins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Flattened aiAnalysis fields
  aiIsUnused: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiIsDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiSavingsSuggestion: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  aiRiskScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  aiLastAnalyzed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Virtual properties for compatibility
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id;
    }
  },
  monthlyCost: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.billingCycle === 'Monthly')   return this.cost;
      if (this.billingCycle === 'Annual')    return Math.round(this.cost / 12);
      if (this.billingCycle === 'Quarterly') return Math.round(this.cost / 3);
      if (this.billingCycle === 'Weekly')    return Math.round(this.cost * 4.33);
      return this.cost;
    }
  },
  annualCost: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.billingCycle === 'Monthly')   return this.cost * 12;
      if (this.billingCycle === 'Annual')    return this.cost;
      if (this.billingCycle === 'Quarterly') return this.cost * 4;
      if (this.billingCycle === 'Weekly')    return Math.round(this.cost * 52);
      return this.cost;
    }
  },
  daysUntilRenewal: {
    type: DataTypes.VIRTUAL,
    get() {
      const diff = new Date(this.renewalDate) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  },
  usageStats: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        lastUsed: this.usageLastUsed,
        usageScore: this.usageScore || 0,
        monthlyLogins: this.usageMonthlyLogins || 0
      };
    },
    set(val) {
      if (val) {
        if (val.lastUsed !== undefined) this.setDataValue('usageLastUsed', val.lastUsed);
        if (val.usageScore !== undefined) this.setDataValue('usageScore', val.usageScore);
        if (val.monthlyLogins !== undefined) this.setDataValue('usageMonthlyLogins', val.monthlyLogins);
      }
    }
  },
  aiAnalysis: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        isUnused: !!this.aiIsUnused,
        isDuplicate: !!this.aiIsDuplicate,
        savingsSuggestion: this.aiSavingsSuggestion || '',
        riskScore: this.aiRiskScore || 0,
        lastAnalyzed: this.aiLastAnalyzed
      };
    },
    set(val) {
      if (val) {
        if (val.isUnused !== undefined) this.setDataValue('aiIsUnused', val.isUnused);
        if (val.isDuplicate !== undefined) this.setDataValue('aiIsDuplicate', val.isDuplicate);
        if (val.savingsSuggestion !== undefined) this.setDataValue('aiSavingsSuggestion', val.savingsSuggestion);
        if (val.riskScore !== undefined) this.setDataValue('aiRiskScore', val.riskScore);
        if (val.lastAnalyzed !== undefined) this.setDataValue('aiLastAnalyzed', val.lastAnalyzed);
      }
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'status'] },
    { fields: ['userId', 'renewalDate'] },
    { fields: ['userId', 'category'] }
  ]
});

// Custom JSON serialization to include virtuals automatically
Subscription.prototype.toJSON = function() {
  const values = { ...this.get() };
  values._id = this.id;
  values.user = this.userId;
  values.monthlyCost = this.monthlyCost;
  values.annualCost = this.annualCost;
  values.daysUntilRenewal = this.daysUntilRenewal;
  values.usageStats = this.usageStats;
  values.aiAnalysis = this.aiAnalysis;
  return values;
};

module.exports = Subscription;
