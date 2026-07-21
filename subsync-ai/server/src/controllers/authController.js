const { User } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: user.toPublicJSON()
  });
};

// @POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    
    const user = await User.create({ firstName, lastName, email, password });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    user.lastLogin = new Date();
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, avatar } = req.body;
    if (!googleId || !email)
      return res.status(400).json({ success: false, message: 'Google auth data required.' });
    
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { googleId },
          { email: email.toLowerCase().trim() }
        ]
      }
    });

    if (user) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({ googleId, email, firstName, lastName, avatar, isVerified: true });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    
    const accessToken = user.generateAccessToken();
    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email.toLowerCase().trim() } });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account with that email.' });
    
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();
    
    // In production, send email with reset link
    res.json({ success: true, message: 'Password reset link sent to email.', resetToken: token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [Op.gt]: new Date() }
      }
    });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    
    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};

// @POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
