const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.findAll({ order: [['id', 'ASC']] });
    res.render('contacts/liste', { contacts });
  } catch (err) {
    console.error(err);
    res.render('contacts/liste', { contacts: [] });
  }
});

router.get('/ajouter', (req, res) => {
  res.render('contacts/ajouter');
});

router.get('/modifier/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).render('404', { title: 'Page non trouvee' });
    res.render('contacts/modifier', { contact });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Erreur serveur', error: err });
  }
});

module.exports = router;
