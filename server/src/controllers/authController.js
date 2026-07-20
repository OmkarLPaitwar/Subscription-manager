<<<<<<< HEAD
const { prisma, toPublicJSON } = require('../utils/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
=======
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8

const assertJwtSecrets = () => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secret values are not configured. Set JWT_SECRET and JWT_REFRESH_SECRET in server/.env');
  }
};

<<<<<<< HEAD
const generateAccessToken = (user) => {
  assertJwtSecrets();
  return jwt.sign(
    { id: user.id, email: user.email, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (user) => {
  assertJwtSecrets();
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

const comparePassword = async (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
=======
const sendTokenResponse = (user, statusCode, res) => {
  assertJwtSecrets();
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
<<<<<<< HEAD
    user: toPublicJSON(user)
  });
};

// route handler
=======
    user: user.toPublicJSON()
  });
};

// @POST /api/auth/register
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
<<<<<<< HEAD
    
    const emailLower = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailLower,
        password: hashedPassword
      }
    });
=======
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    assertJwtSecrets();
    const user = await User.create({ firstName, lastName, email, password });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
=======
// @POST /api/auth/login
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });
<<<<<<< HEAD
    
    const emailLower = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    sendTokenResponse(updatedUser, 200, res);
=======
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    sendTokenResponse(user, 200, res);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
=======
// @POST /api/auth/google
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, avatar } = req.body;
    if (!googleId || !email)
      return res.status(400).json({ success: false, message: 'Google auth data required.' });
<<<<<<< HEAD
    
    const emailLower = email.toLowerCase().trim();
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: emailLower }
        ]
      }
    });
    
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          lastLogin: new Date(),
          ...(avatar && { avatar })
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          googleId,
          email: emailLower,
          firstName: firstName ? firstName.trim() : '',
          lastName: lastName ? lastName.trim() : '',
          avatar: avatar || '',
          isVerified: true,
          lastLogin: new Date()
        }
      });
=======
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      assertJwtSecrets();
      user = await User.create({ googleId, email, firstName, lastName, avatar, isVerified: true });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    }
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
=======
// @POST /api/auth/refresh
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
<<<<<<< HEAD
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    const accessToken = generateAccessToken(user);
=======
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    const accessToken = user.generateAccessToken();
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

<<<<<<< HEAD
// route handler
exports.forgotPassword = async (req, res) => {
  try {
    const emailLower = req.body.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account with that email.' });
    
    const token = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpire
      }
    });
    
=======
// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account with that email.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save({ validateBeforeSave: false });
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    // In production, send email with reset link
    res.json({ success: true, message: 'Password reset link sent to email.', resetToken: token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gt: new Date() }
      }
    });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    
    const hashedPassword = await hashPassword(req.body.password);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });
    sendTokenResponse(updatedUser, 200, res);
=======
// @PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

<<<<<<< HEAD
// route handler
exports.getMe = async (req, res) => {
  res.json({ success: true, user: toPublicJSON(req.user) });
};

// route handler
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

// Exports for reuse in other controllers (e.g. userController)
module.exports = {
  ...module.exports,
  generateAccessToken,
  generateRefreshToken,
  comparePassword,
  hashPassword,
  sendTokenResponse
};
=======
// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};

// @POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
