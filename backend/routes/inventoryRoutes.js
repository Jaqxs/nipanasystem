const express = require('express');
const InventoryBatch = require('../models/InventoryBatch');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all inventory batches
// @route   GET /api/inventory
router.get('/', protect, async (req, res) => {
  try {
    const batches = await InventoryBatch.findAll({
      include: [{ model: require('../models/Contact'), as: 'sourceContact', attributes: ['name'] }]
    });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create new inventory batch
// @route   POST /api/inventory
router.post('/', protect, async (req, res) => {
  try {
    const batch = await InventoryBatch.create(req.body);
    res.status(201).json(batch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Get single inventory batch
// @route   GET /api/inventory/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const batch = await InventoryBatch.findByPk(req.params.id, {
      include: [{ model: require('../models/Contact'), as: 'sourceContact' }]
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update inventory batch
// @route   PUT /api/inventory/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const batch = await InventoryBatch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    await batch.update(req.body);
    res.json(batch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete inventory batch
// @route   DELETE /api/inventory/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const batch = await InventoryBatch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    await batch.destroy();
    res.json({ message: 'Batch removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
