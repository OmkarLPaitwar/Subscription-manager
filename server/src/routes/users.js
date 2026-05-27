const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.put('/profile', ctrl.updateProfile);
router.put('/preferences', ctrl.updatePreferences);
router.put('/change-password', ctrl.changePassword);
router.delete('/account', ctrl.deleteAccount);
module.exports = router;
