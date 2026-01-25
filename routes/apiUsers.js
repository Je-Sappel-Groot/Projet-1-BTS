const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middelwares/auth');
const bcrypt = require('bcrypt');

// 🔒 Routes API réservées aux admins
router.use(auth(['admin']));

// GET - récupérer tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'nom', 'prenom', 'email', 'role', 'status', 'phone', 'adresse']
    });
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET - récupérer un utilisateur par ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST - créer un utilisateur
router.post('/', async (req, res) => {
  try {
    const { username, email, password, nom, prenom, role, status, phone, adresse } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username, email, password: hashedPassword, nom, prenom, role, status, phone, adresse
    });

    res.status(201).json({ success: true, message: 'Utilisateur créé', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    const allowedFields = ['username','email','nom','prenom','phone','adresse'];
    const updateData = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    await user.update(updateData);
    res.json({ success: true, message: 'Utilisateur mis à jour', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// DELETE - supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });

    await user.destroy();
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
