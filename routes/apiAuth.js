// routes/apiAuth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const sequelize = require('../config/db');
const User = require('../models/User');
const Etudiant = require('../models/Etudiant');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function ensureEtudiantProfile({ nom, prenom, adresse, phone, transaction }) {
  const where = {
    nom,
    prenom,
    phone: phone || '',
  };

  await Etudiant.findOrCreate({
    where,
    defaults: {
      nom,
      prenom,
      adresse,
      phone,
      dob: null,
    },
    transaction,
  });
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, nom, prenom, phone, adresse, role } = req.body;

    const usernameValue = normalizeText(username);
    const emailValue = normalizeText(email);
    const passwordValue = typeof password === 'string' ? password.trim() : '';
    const nomValue = normalizeText(nom);
    const prenomValue = normalizeText(prenom);
    const phoneValue = normalizeText(phone);
    const adresseValue = normalizeText(adresse);

    if (!usernameValue || !emailValue || !passwordValue || !nomValue || !prenomValue || !phoneValue || !adresseValue) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires (username, email, password, nom, prenom, phone, adresse).',
      });
    }

    if (role && role !== 'etudiant') {
      return res.status(403).json({
        success: false,
        message: "Le role admin/enseignant/administratif n'est pas autorise via cette page.",
      });
    }

    const existingUser = await User.findOne({ where: { email: emailValue } });
    const existingUsername = await User.findOne({ where: { username: usernameValue } });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Cet e-mail est deja utilise.' });
    }
    if (existingUsername) {
      return res.status(400).json({ success: false, message: "Ce nom d'utilisateur est deja pris." });
    }

    const hashedPassword = await bcrypt.hash(passwordValue, 10);

    const newUser = await sequelize.transaction(async (transaction) => {
      const createdUser = await User.create({
        username: usernameValue,
        email: emailValue,
        password: hashedPassword,
        nom: nomValue,
        prenom: prenomValue,
        phone: phoneValue,
        adresse: adresseValue,
        role: 'etudiant',
        status: 'active',
      }, { transaction });

      await ensureEtudiantProfile({
        nom: nomValue,
        prenom: prenomValue,
        adresse: adresseValue,
        phone: phoneValue,
        transaction,
      });

      return createdUser;
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur cree avec succes.',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Erreur inscription API :', error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'inscription." });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez entrer vos identifiants.' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true });

    res.json({
      success: true,
      message: 'Connexion reussie.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur login API :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
