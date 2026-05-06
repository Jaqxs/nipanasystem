const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) {
      const responseData = {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      };
      console.log(`[Auth] Login success for ${email}:`, JSON.stringify(responseData, null, 2));
      res.json(responseData);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role, location });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
