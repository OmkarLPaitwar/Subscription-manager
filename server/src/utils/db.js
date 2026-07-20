const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const toPublicJSON = (user) => {
  if (!user) return null;
  const publicUser = { ...user };
  delete publicUser.password;
  delete publicUser.resetPasswordToken;
  delete publicUser.resetPasswordExpire;
  delete publicUser.emailVerifyToken;
  
  // Virtual fullName
  publicUser.fullName = `${publicUser.firstName || ''} ${publicUser.lastName || ''}`.trim();
  
  // Parse JSON fields if they are returned as strings (Prisma client does this automatically for PostgreSQL, but helper is useful for safety)
  if (typeof publicUser.company === 'string') {
    try { publicUser.company = JSON.parse(publicUser.company); } catch (_) {}
  }
  if (typeof publicUser.preferences === 'string') {
    try { publicUser.preferences = JSON.parse(publicUser.preferences); } catch (_) {}
  }
  
  return publicUser;
};

const addVirtualFields = (sub) => {
  if (!sub) return null;
  const result = { ...sub };

  // Calculate monthlyCost
  let monthlyCost = sub.cost;
  if (sub.billingCycle === 'Monthly') {
    monthlyCost = sub.cost;
  } else if (sub.billingCycle === 'Annual') {
    monthlyCost = Math.round(sub.cost / 12);
  } else if (sub.billingCycle === 'Quarterly') {
    monthlyCost = Math.round(sub.cost / 3);
  } else if (sub.billingCycle === 'Weekly') {
    monthlyCost = Math.round(sub.cost * 4.33);
  }

  // Calculate annualCost
  let annualCost = sub.cost;
  if (sub.billingCycle === 'Monthly') {
    annualCost = sub.cost * 12;
  } else if (sub.billingCycle === 'Annual') {
    annualCost = sub.cost;
  } else if (sub.billingCycle === 'Quarterly') {
    annualCost = sub.cost * 4;
  } else if (sub.billingCycle === 'Weekly') {
    annualCost = Math.round(sub.cost * 52);
  }

  // Calculate daysUntilRenewal
  const diff = new Date(sub.renewalDate) - new Date();
  const daysUntilRenewal = Math.ceil(diff / (1000 * 60 * 60 * 24));

  result.monthlyCost = monthlyCost;
  result.annualCost = annualCost;
  result.daysUntilRenewal = daysUntilRenewal;

  // Safe parsing for any JSON column types
  const jsonKeys = ['usageStats', 'aiAnalysis', 'tags', 'remindersSent'];
  jsonKeys.forEach(key => {
    if (typeof result[key] === 'string') {
      try {
        result[key] = JSON.parse(result[key]);
      } catch (_) {}
    }
  });

  return result;
};

const addVirtualsToList = (subs) => {
  if (!Array.isArray(subs)) return [];
  return subs.map(addVirtualFields);
};

module.exports = {
  prisma,
  toPublicJSON,
  addVirtualFields,
  addVirtualsToList
};
