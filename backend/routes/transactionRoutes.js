const express = require('express');
const Transaction = require('../models/Transaction');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all transactions
// @route   GET /api/transactions
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [{ model: require('../models/Contact'), as: 'partyContact', attributes: ['name'] }]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create new transaction
// @route   POST /api/transactions
router.post('/', protect, async (req, res) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: require('../models/Contact'), as: 'partyContact' },
        { model: require('../models/User'), as: 'creator', attributes: ['name'] }
      ]
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    await transaction.update(req.body);
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    await transaction.destroy();
    res.json({ message: 'Transaction removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
