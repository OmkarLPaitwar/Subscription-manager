const { Subscription, Notification, User } = require('../models');
const { Op } = require('sequelize');

exports.checkRenewals = async () => {
  console.log('⏰ Running renewal check cron job...');
  try {
    const now = new Date();
    const intervals = [1, 3, 7]; // days before renewal to notify

    for (const days of intervals) {
      const target = new Date(now);
      target.setDate(target.getDate() + days);
      const start = new Date(target); start.setHours(0, 0, 0, 0);
      const end   = new Date(target); end.setHours(23, 59, 59, 999);

      const subs = await Subscription.findAll({
        where: {
          status: 'Active',
          renewalDate: {
            [Op.gte]: start,
            [Op.lte]: end
          }
        },
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'firstName', 'preferencesEmailNotifications', 'preferencesSmsAlerts']
        }]
      });

      for (const sub of subs) {
        if (!sub.owner) continue;
        
        // Check if already sent for today
        const alreadySent = sub.remindersSent?.some(d => {
          const diff = Math.abs(new Date(d) - now);
          return diff < 86400000;
        });
        if (alreadySent) continue;

        await Notification.create({
          userId: sub.owner.id,
          subscriptionId: sub.id,
          type: 'renewal',
          title: `${sub.name} renews in ${days} day${days > 1 ? 's' : ''}`,
          message: `Your ${sub.name} subscription (₹${sub.monthlyCost}/mo) will auto-renew on ${new Date(sub.renewalDate).toLocaleDateString('en-IN')}. Make sure your payment method is up to date.`,
          priority: days === 1 ? 'urgent' : days === 3 ? 'high' : 'medium',
          metadata: { daysUntilRenewal: days, cost: sub.monthlyCost }
        });

        // Save reminder send date
        const reminders = [...(sub.remindersSent || [])];
        reminders.push(now.toISOString());
        sub.remindersSent = reminders;
        await sub.save();
      }
      console.log(`✅ Processed ${subs.length} renewals for ${days}-day notice`);
    }
  } catch (err) {
    console.error('❌ Renewal check error:', err.message);
  }
};
