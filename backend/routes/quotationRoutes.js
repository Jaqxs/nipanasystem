const express = require('express');
const Quotation = require('../models/Quotation');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all quotations
// @route   GET /api/quotations
router.get('/', protect, async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      include: [{ model: require('../models/Contact'), as: 'customerContact', attributes: ['name'] }]
    });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create new quotation
// @route   POST /api/quotations
router.post('/', protect, async (req, res) => {
  try {
    const quotation = await Quotation.create(req.body);
    res.status(201).json(quotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Get single quotation
// @route   GET /api/quotations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id, {
      include: [{ model: require('../models/Contact'), as: 'customerContact' }]
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update quotation
// @route   PUT /api/quotations/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    
    await quotation.update(req.body);
    res.json(quotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    
    await quotation.destroy();
    res.json({ message: 'Quotation removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
