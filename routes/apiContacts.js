const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Contact = require('../models/contact');
const auth = require('../middelwares/auth');

router.get('/', auth(['admin', 'administratif']), async (req, res) => {
  try {
    let { page = 1, limit = 5, search = '' } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    const where = search
      ? { name: { [Op.like]: `%${search}%` } }
      : {};

    const { count, rows } = await Contact.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    res.json({
      contacts: rows,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact non trouve' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const contact = await Contact.create({ name, email, message });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact non trouve' });

    const { name, email, message } = req.body;
    await contact.update({ name, email, message });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact non trouve' });

    await contact.destroy();
    res.json({ message: 'Contact supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
