const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middelwares/auth');
const Enseignant = require('../models/Enseignant');

// ---------------------
// ➕ Ajouter un étudiant
// ---------------------
router.post('/', auth(['admin', 'enseignant']), async (req, res) => {
  try {
    const { nom, prenom, adresse, dob, phone } = req.body;

    const enseignant = await Enseignant.create({
      nom,
      prenom,
      adresse,
      dob: new Date(dob),
      phone,
    });

    res.status(201).json(enseignant);
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
    const { count, rows } = await Enseignant.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      enseignants: rows,
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
// 🔍 Obtenir un Enseignant par ID
// ---------------------
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const enseignant = await Enseignant.findByPk(id);
    if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouvé' });

    res.json(enseignant);
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

    const enseignant = await Enseignant.findByPk(id);
    if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouvé' });

    await enseignant.update({
      nom,
      prenom,
      phone,
      adresse,
      dob: new Date(dob),
      
    });

    res.json({ success: true, message: 'Enseignant mis à jour', enseignant });
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

    const enseignant = await Enseignant.findByPk(id);
    if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouvé' });

    await enseignant.destroy();
    res.json({ success: true, message: 'Enseignant supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
