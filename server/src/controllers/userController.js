<<<<<<< HEAD
const { prisma, toPublicJSON } = require('../utils/db');
const { comparePassword, hashPassword } = require('./authController');

// route handler
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'avatar', 'company'];
    const updates = {};
    allowed.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates
    });

    res.json({ success: true, user: toPublicJSON(user), message: 'Profile updated.' });
=======
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName','lastName','phone','avatar','company'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toPublicJSON(), message: 'Profile updated.' });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.updatePreferences = async (req, res) => {
  try {
    const updatedPreferences = {
      ...req.user.preferences,
      ...req.body
    };

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { preferences: updatedPreferences }
    });

    res.json({ success: true, user: toPublicJSON(user), message: 'Preferences updated.' });
=======
// @PUT /api/users/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id, { preferences: { ...req.user.preferences.toObject(), ...req.body } },
      { new: true }
    );
    res.json({ success: true, user: user.toPublicJSON(), message: 'Preferences updated.' });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.password) {
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

=======
// @PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.deleteAccount = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isActive: false }
    });
=======
// @DELETE /api/users/account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, message: 'Account deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
