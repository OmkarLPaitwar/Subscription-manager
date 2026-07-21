const User = require('./User');
const Subscription = require('./Subscription');
const Notification = require('./Notification');

// User <-> Subscription (use 'owner' alias to avoid collision with 'userId' column)
User.hasMany(Subscription, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// User <-> Notification (use 'owner' alias here too)
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Subscription <-> Notification (use 'sub' alias to avoid collision with 'subscriptionId' column)
Subscription.hasMany(Notification, { foreignKey: 'subscriptionId', onDelete: 'SET NULL', as: 'subNotifications' });
Notification.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'sub' });

module.exports = {
  User,
  Subscription,
  Notification
};
