const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const sequelize = require('../config/db');
const User = require('../models/User');
const Etudiant = require('../models/Etudiant');
const Enseignant = require('../models/Enseignant');
const auth = require('../middelwares/auth');

const ALLOWED_ROLES = ['admin', 'etudiant', 'enseignant', 'administratif'];
const ALLOWED_STATUS = ['active', 'inactive', 'banned'];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function ensureRoleProfile({ role, nom, prenom, adresse, phone, transaction }) {
  if (role === 'etudiant') {
    await Etudiant.findOrCreate({
      where: { nom, prenom, phone: phone || '' },
      defaults: { nom, prenom, adresse, phone, dob: null },
      transaction,
    });
    return;
  }

  if (role === 'enseignant') {
    await Enseignant.findOrCreate({
      where: { nom, prenom, phone: phone || '' },
      defaults: { nom, prenom, adresse, phone, dob: null },
      transaction,
    });
  }
}

router.use(auth(['admin']));

router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'nom', 'prenom', 'email', 'role', 'status', 'phone', 'adresse'],
      order: [['id', 'ASC']],
    });
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve.' });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const username = normalizeText(req.body.username);
    const email = normalizeText(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';
    const nom = normalizeText(req.body.nom);
    const prenom = normalizeText(req.body.prenom);
    const phone = normalizeText(req.body.phone);
    const adresse = normalizeText(req.body.adresse);
    const role = normalizeText(req.body.role) || 'etudiant';
    const status = normalizeText(req.body.status) || 'active';

    if (!username || !email || !password || !nom || !prenom) {
      return res.status(400).json({
        success: false,
        message: 'username, email, password, nom et prenom sont obligatoires.',
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role invalide.' });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Cet e-mail est deja utilise.' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: "Ce nom d'utilisateur est deja pris." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await sequelize.transaction(async (transaction) => {
      const createdUser = await User.create({
        username,
        email,
        password: hashedPassword,
        nom,
        prenom,
        role,
        status,
        phone: phone || null,
        adresse: adresse || null,
      }, { transaction });

      await ensureRoleProfile({
        role,
        nom,
        prenom,
        adresse: adresse || null,
        phone: phone || '',
        transaction,
      });

      return createdUser;
    });

    res.status(201).json({ success: true, message: 'Utilisateur cree', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });

    const allowedFields = ['username', 'email', 'nom', 'prenom', 'phone', 'adresse', 'role', 'status'];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'phone' || field === 'adresse') {
          updateData[field] = normalizeText(req.body[field]) || null;
        } else if (field === 'role' || field === 'status') {
          updateData[field] = normalizeText(req.body[field]);
        } else {
          updateData[field] = normalizeText(req.body[field]);
        }
      }
    }

    if (updateData.role && !ALLOWED_ROLES.includes(updateData.role)) {
      return res.status(400).json({ success: false, message: 'Role invalide.' });
    }

    if (updateData.status && !ALLOWED_STATUS.includes(updateData.status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await User.findOne({ where: { username: updateData.username } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: "Ce nom d'utilisateur est deja pris." });
      }
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await User.findOne({ where: { email: updateData.email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Cet e-mail est deja utilise.' });
      }
    }

    const updatedUser = await sequelize.transaction(async (transaction) => {
      await user.update(updateData, { transaction });

      await ensureRoleProfile({
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        adresse: user.adresse,
        phone: user.phone || '',
        transaction,
      });

      return user;
    });

    res.json({ success: true, message: 'Utilisateur mis a jour', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve.' });

    await user.destroy();
    res.json({ success: true, message: 'Utilisateur supprime' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
