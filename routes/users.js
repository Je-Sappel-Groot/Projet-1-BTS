const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const auth = require('../middelwares/auth');

// Page liste utilisateurs
// Page utilisateurs (CRUD via API)
router.get('/', auth(['admin']), async (req, res) => {
  // On ne charge pas les users ici, le fetch côté JS fera la récupération
  res.render('users/index', { title: 'Gestion des utilisateurs' });
});

// Page ajouter utilisateur
router.get('/ajouter', auth(['admin']), (req, res) => {
  res.render('users/ajouter', { title: 'Ajouter un utilisateur' });
});

// Page pour modifier un utilisateur
router.get('/modifier/:id', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send('Utilisateur non trouvé');

    res.render('users/modifier', { user, title: 'Modifier l\'utilisateur' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
