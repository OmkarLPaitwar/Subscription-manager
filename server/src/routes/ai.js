const router = require('express').Router();
const ctrl = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.post('/chat', ctrl.chat);
router.get('/analyze', ctrl.analyze);
router.get('/insights', ctrl.getInsights);
module.exports = router;
