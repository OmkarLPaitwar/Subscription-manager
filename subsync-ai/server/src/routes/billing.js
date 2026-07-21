const router = require('express').Router();
const ctrl = require('../controllers/billingController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/current-plan', ctrl.getCurrentPlan);
router.get('/plans', ctrl.getPlans);
router.post('/upgrade', ctrl.upgradePlan);
module.exports = router;
