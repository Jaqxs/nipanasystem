const express = require('express');
const Contact = require('../models/Contact');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all contacts
// @route   GET /api/contacts
router.get('/', protect, async (req, res) => {
  try {
    const contacts = await Contact.findAll();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create new contact
// @route   POST /api/contacts
router.post('/', protect, async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Get single contact
// @route   GET /api/contacts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    
    await contact.update(req.body);
    res.json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    
    await contact.destroy();
    res.json({ message: 'Contact removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
