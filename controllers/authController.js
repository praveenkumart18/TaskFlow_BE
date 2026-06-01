const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, adminCode } = req.body;
    const requestedRole = role === 'admin' && adminCode === process.env.ADMIN_INVITE_CODE ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: userPayload(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userPayload(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile fetched successfully',
    data: { user: userPayload(req.user) }
  });
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, getUsers };
