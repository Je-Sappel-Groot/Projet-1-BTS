// routes/auth.js
const express = require('express');
const router = express.Router();

// Page login
router.get('/login', (req, res) => {
  res.render('login', { title: 'Connexion - IRIS Toulouse' });
});

// Page register
router.get('/register', (req, res) => {
  res.render('register', { title: 'Inscription - IRIS Toulouse' });
});

module.exports = router;
