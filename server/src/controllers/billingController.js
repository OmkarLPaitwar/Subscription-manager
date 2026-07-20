<<<<<<< HEAD
const { prisma, toPublicJSON } = require('../utils/db');
=======
const User = require('../models/User');
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8

const PLANS = {
  starter:    { name: 'Starter',    price: 499,  subsLimit: 20,  features: ['20 subscriptions','Renewal alerts','Basic AI'] },
  business:   { name: 'Business',   price: 1499, subsLimit: -1,  features: ['Unlimited subscriptions','Advanced AI','Team billing','PDF reports','Priority support'] },
  enterprise: { name: 'Enterprise', price: null, subsLimit: -1,  features: ['Multi-org','Custom AI','SAML SSO','SLA','Dedicated success manager'] }
};

// Mock invoices
const generateInvoices = (plan) => {
  const inv = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    inv.push({
      id: `INV-2025-${String(i+1).padStart(3,'0')}`,
      date: d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
      description: `${PLANS[plan]?.name || 'Starter'} Plan — ${d.toLocaleString('default',{month:'long',year:'numeric'})}`,
      amount: PLANS[plan]?.price || 499,
      status: 'Paid'
    });
  }
  return inv;
};

<<<<<<< HEAD
// route handler
=======
// @GET /api/billing/current-plan
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.getCurrentPlan = async (req, res) => {
  try {
    const plan = req.user.plan || 'starter';
    res.json({
      success: true,
      data: {
        plan,
        details: PLANS[plan],
        invoices: generateInvoices(plan),
        nextRenewal: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-IN')
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
=======
// @GET /api/billing/plans
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.getPlans = (req, res) => {
  res.json({ success: true, data: PLANS });
};

<<<<<<< HEAD
// route handler
=======
// @POST /api/billing/upgrade
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, message: 'Invalid plan.' });
<<<<<<< HEAD
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        plan,
        planExpiry: new Date(Date.now() + 30 * 86400000)
      }
    });
    
    res.json({ success: true, message: `Upgraded to ${PLANS[plan].name} plan.`, user: toPublicJSON(user) });
=======
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan, planExpiry: new Date(Date.now() + 30 * 86400000) },
      { new: true }
    );
    res.json({ success: true, message: `Upgraded to ${PLANS[plan].name} plan.`, user: user.toPublicJSON() });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
