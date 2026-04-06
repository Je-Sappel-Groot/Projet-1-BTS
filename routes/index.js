const express = require('express');
const router = express.Router();
const auth = require('../middelwares/auth');

router.get('/', auth(), function(req, res) {
  res.render('index', { title: 'Training Medical Academy' });
});

router.get('/dashboard', auth(), function(req, res) {
  res.render('dashboard', { title: 'Dashboard' });
});

router.get('/about', auth(), function(req, res) {
  res.render('about', { title: 'A propos' });
});

router.get('/contact', auth(), function(req, res) {
  res.render('contact', { title: 'Contact' });
});

router.post('/contact', auth(), function(req, res) {
  res.render('contact', { title: 'Contact', success: 'Message envoye. Nous vous repondons rapidement.' });
});

module.exports = router;
