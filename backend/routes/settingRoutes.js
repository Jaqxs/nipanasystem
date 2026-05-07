const express = require('express');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// Mock settings storage (in production this would be in DB)
let systemSettings = {
  goldPriceUSD: 74.50,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System'
};

// @desc    Get system settings
// @route   GET /api/settings
router.get('/', protect, (req, res) => {
  res.json(systemSettings);
});

// @desc    Update system settings
// @route   PUT /api/settings
router.put('/', protect, admin, (req, res) => {
  systemSettings = {
    ...systemSettings,
    ...req.body,
    lastUpdated: new Date().toISOString(),
    updatedBy: req.user.name
  };
  res.json(systemSettings);
});

module.exports = router;
