const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Etudiant = require('../models/Etudiant'); // modèle Sequelize
const auth = require('../middelwares/auth');

// ---------------------
// ➕ Ajouter un étudiant
// ---------------------
router.post('/', auth(['admin', 'enseignant']), async (req, res) => {
  try {
    const { nom, prenom, adresse, dob, phone } = req.body;

    const etudiant = await Etudiant.create({
      nom,
      prenom,
      adresse,
      dob: new Date(dob),
      phone,
    });

    res.status(201).json(etudiant);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// ---------------------
// Liste paginée avec recherche
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || '';

    const offset = (page - 1) * limit;

    // Créer condition de recherche
    const whereCondition = search
      ? {
          [Op.or]: [
            { nom: { [Op.like]: `%${search}%` } },
            { prenom: { [Op.like]: `%${search}%` } },
            { adresse: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    // Récupérer les étudiants
    const { count, rows } = await Etudiant.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      etudiants: rows,
      pagination: {
        page,
        totalPages,
        totalItems: count
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ---------------------
// 🔍 Obtenir un étudiant par ID
// ---------------------
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const etudiant = await Etudiant.findByPk(id);
    if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------
// ✏️ Modifier un étudiant
// ---------------------
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const { nom, prenom, adresse, dob, phone } = req.body;

    const etudiant = await Etudiant.findByPk(id);
    if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

    await etudiant.update({
      nom,
      prenom,
      adresse,
      dob: new Date(dob),
      phone,
    });

    res.json({ success: true, message: 'Étudiant mis à jour', etudiant });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------
// ❌ Supprimer un étudiant
// ---------------------
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const etudiant = await Etudiant.findByPk(id);
    if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

    await etudiant.destroy();
    res.json({ success: true, message: 'Étudiant supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
