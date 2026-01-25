// routes/apiAuth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ajuste selon ton export
const auth = require('../middelwares/auth');
// --- INSCRIPTION API ---
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, nom, prenom, phone, adresse, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs obligatoires doivent être remplis.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    const existingUsername = await User.findOne({ where: { username } });

    if (existingUser) return res.status(400).json({ success: false, message: 'Cet e-mail est déjà utilisé.' });
    if (existingUsername) return res.status(400).json({ success: false, message: "Ce nom d'utilisateur est déjà pris." });

    const hashedPassword = await bcrypt.hash(password, 10);
    

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      nom: nom || null,
      prenom: prenom || null,
   
      phone: phone || null,
      adresse: adresse || null,
      role: role || 'etudiant',
      status: 'active',
    });

    res.status(201).json({ success: true, message: 'Utilisateur créé avec succès.', userId: newUser.id });
  } catch (error) {
    console.error('💥 Erreur inscription API :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de l’inscription.' });
  }
});

// --- LOGIN API ---
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez entrer vos identifiants.' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true });

    res.json({
      success: true,
      message: 'Connexion réussie.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });

  } catch (error) {
    console.error('💥 Erreur login API :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
  }
});

// --- LOGOUT API ---
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});


module.exports = router;
