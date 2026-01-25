// routes/index.js
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', { title: 'Training Medical Academy' });
});

router.get('/dashboard', function(req, res) {
  res.render('dashboard', { title: 'Dashboard' });
});

router.get('/about', function(req, res) {
  res.render('about', { title: 'A propos' });
});

router.get('/contact', function(req, res) {
  res.render('contact', { title: 'Contact' });
});

router.post('/contact', function(req, res) {
  res.render('contact', { title: 'Contact', success: 'Message envoye. Nous vous repondons rapidement.' });
});

module.exports = router;
