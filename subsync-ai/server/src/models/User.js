const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'First name is required' },
      len: [0, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Last name is required' },
      len: [0, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Invalid email' },
      notEmpty: { msg: 'Email is required' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [6, 100]
    }
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  // Flattened company details
  companyName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  companyGst: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  companyAddress: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  // Flattened preferences
  preferencesCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'INR',
    validate: {
      isIn: [['INR', 'USD', 'EUR', 'GBP']]
    }
  },
  preferencesTheme: {
    type: DataTypes.STRING,
    defaultValue: 'dark',
    validate: {
      isIn: [['dark', 'light']]
    }
  },
  preferencesEmailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferencesSmsAlerts: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preferencesWeeklyReport: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferencesTwoFactor: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  plan: {
    type: DataTypes.STRING,
    defaultValue: 'starter',
    validate: {
      isIn: [['starter', 'business', 'enterprise']]
    }
  },
  planExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerifyToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Virtual objects for NoSQL compatibility
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id;
    }
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    }
  },
  company: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        name: this.companyName || '',
        gst: this.companyGst || '',
        address: this.companyAddress || ''
      };
    },
    set(val) {
      if (val) {
        if (val.name !== undefined) this.setDataValue('companyName', val.name);
        if (val.gst !== undefined) this.setDataValue('companyGst', val.gst);
        if (val.address !== undefined) this.setDataValue('companyAddress', val.address);
      }
    }
  },
  preferences: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        currency: this.preferencesCurrency || 'INR',
        theme: this.preferencesTheme || 'dark',
        emailNotifications: this.preferencesEmailNotifications !== false,
        smsAlerts: !!this.preferencesSmsAlerts,
        weeklyReport: this.preferencesWeeklyReport !== false,
        twoFactor: !!this.preferencesTwoFactor,
        // Helper mock to avoid toObject() failures in controller
        toObject: () => ({
          currency: this.preferencesCurrency || 'INR',
          theme: this.preferencesTheme || 'dark',
          emailNotifications: this.preferencesEmailNotifications !== false,
          smsAlerts: !!this.preferencesSmsAlerts,
          weeklyReport: this.preferencesWeeklyReport !== false,
          twoFactor: !!this.preferencesTwoFactor
        })
      };
    },
    set(val) {
      if (val) {
        if (val.currency !== undefined) this.setDataValue('preferencesCurrency', val.currency);
        if (val.theme !== undefined) this.setDataValue('preferencesTheme', val.theme);
        if (val.emailNotifications !== undefined) this.setDataValue('preferencesEmailNotifications', val.emailNotifications);
        if (val.smsAlerts !== undefined) this.setDataValue('preferencesSmsAlerts', val.smsAlerts);
        if (val.weeklyReport !== undefined) this.setDataValue('preferencesWeeklyReport', val.weeklyReport);
        if (val.twoFactor !== undefined) this.setDataValue('preferencesTwoFactor', val.twoFactor);
      }
    }
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
      if (user.changed('email') && user.email) {
        user.email = user.email.toLowerCase().trim();
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateAccessToken = function() {
  return jwt.sign(
    { id: this.id, email: this.email, plan: this.plan },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

User.prototype.generateRefreshToken = function() {
  return jwt.sign(
    { id: this.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

User.prototype.toPublicJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpire;
  delete values.emailVerifyToken;
  // Expose virtuals
  values._id = this.id;
  values.fullName = this.fullName;
  values.company = this.company;
  values.preferences = this.preferences;
  return values;
};

module.exports = User;
