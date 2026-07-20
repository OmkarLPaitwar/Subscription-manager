<<<<<<< HEAD
const { prisma, addVirtualsToList } = require('./db');
=======
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8

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

<<<<<<< HEAD
      const subs = await prisma.subscription.findMany({
        where: {
          status: 'Active',
          renewalDate: { gte: start, lte: end }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              preferences: true
            }
          }
        }
      });

      const virtualSubs = addVirtualsToList(subs);

      for (const sub of virtualSubs) {
        if (!sub.user) continue;
        
=======
      const subs = await Subscription.find({
        status: 'Active',
        renewalDate: { $gte: start, $lte: end }
      }).populate('user', '_id email firstName preferences');

      for (const sub of subs) {
        if (!sub.user) continue;
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
        // Check if already sent for today
        const alreadySent = sub.remindersSent?.some(d => {
          const diff = Math.abs(new Date(d) - now);
          return diff < 86400000;
        });
        if (alreadySent) continue;

<<<<<<< HEAD
        await prisma.notification.create({
          data: {
            userId: sub.user.id,
            subscriptionId: sub.id,
            type: 'renewal',
            title: `${sub.name} renews in ${days} day${days > 1 ? 's' : ''}`,
            message: `Your ${sub.name} subscription (₹${sub.monthlyCost}/mo) will auto-renew on ${new Date(sub.renewalDate).toLocaleDateString('en-IN')}. Make sure your payment method is up to date.`,
            priority: days === 1 ? 'urgent' : days === 3 ? 'high' : 'medium',
            metadata: { daysUntilRenewal: days, cost: sub.monthlyCost }
          }
        });

        const newReminders = [...(sub.remindersSent || []), now];
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            remindersSent: newReminders
          }
        });
=======
        await Notification.create({
          user: sub.user._id,
          subscription: sub._id,
          type: 'renewal',
          title: `${sub.name} renews in ${days} day${days > 1 ? 's' : ''}`,
          message: `Your ${sub.name} subscription (₹${sub.monthlyCost}/mo) will auto-renew on ${new Date(sub.renewalDate).toLocaleDateString('en-IN')}. Make sure your payment method is up to date.`,
          priority: days === 1 ? 'urgent' : days === 3 ? 'high' : 'medium',
          metadata: { daysUntilRenewal: days, cost: sub.monthlyCost }
        });

        sub.remindersSent = [...(sub.remindersSent || []), now];
        await sub.save({ validateBeforeSave: false });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
      }
      console.log(`✅ Processed ${subs.length} renewals for ${days}-day notice`);
    }
  } catch (err) {
    console.error('❌ Renewal check error:', err.message);
  }
};
