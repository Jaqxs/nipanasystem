const express = require('express');
const Invoice = require('../models/Invoice');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all invoices
// @route   GET /api/invoices
router.get('/', protect, async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{ model: require('../models/Contact'), as: 'customerContact', attributes: ['name'] }]
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create new invoice
// @route   POST /api/invoices
router.post('/', protect, async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: require('../models/Contact'), as: 'customerContact' }]
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    await invoice.update(req.body);
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    await invoice.destroy();
    res.json({ message: 'Invoice removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
