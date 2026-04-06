const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Connexion - IRIS Toulouse' });
});

router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Inscription - IRIS Toulouse' });
});

module.exports = router;
