const { User } = require('../models');

// @PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const allowed = ['firstName', 'lastName', 'phone', 'avatar', 'company'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        user[f] = req.body[f];
      }
    });
    await user.save();
    res.json({ success: true, user: user.toPublicJSON(), message: 'Profile updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/users/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const user = req.user;
    // merge existing virtual preferences with updates
    user.preferences = { ...user.preferences, ...req.body };
    await user.save();
    res.json({ success: true, user: user.toPublicJSON(), message: 'Preferences updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @DELETE /api/users/account
exports.deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'Account deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
