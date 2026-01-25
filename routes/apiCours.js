const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Cours = require('../models/cours');
const Enseignant = require('../models/Enseignant');

// ---------------------
// Liste paginée avec recherche sur nom du cours ou nom/prénom de l'enseignant
// ---------------------
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || '';

    const offset = (page - 1) * limit;

    // Condition de recherche
    const whereCondition = search
      ? {
          [Op.or]: [
            { nom: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const { count, rows } = await Cours.findAndCountAll({
      where: whereCondition,
      include: [{
        model: Enseignant,
        as: 'enseignant',
        attributes: ['id', 'nom', 'prenom'],
        where: search ? {
          [Op.or]: [
            { nom: { [Op.like]: `%${search}%` } },
            { prenom: { [Op.like]: `%${search}%` } }
          ]
        } : undefined
      }],
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      cours: rows,
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

// GET un cours par ID
router.get('/:id', async (req, res) => {
  try {
    const cours = await Cours.findByPk(req.params.id, {
      include: [{ model: Enseignant, as: 'enseignant', attributes: ['id', 'nom', 'prenom'] }]
    });
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });
    res.json(cours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST ajouter un cours
router.post('/', async (req, res) => {
  try {
    const { nom, id_enseignant } = req.body;
    const enseignant = await Enseignant.findByPk(id_enseignant);
    if (!enseignant) return res.status(400).json({ message: 'Enseignant non trouvé' });

    const cours = await Cours.create({ nom, id_enseignant });
    res.status(201).json(cours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT modifier un cours
router.put('/:id', async (req, res) => {
  try {
    const { nom, id_enseignant } = req.body;
    const cours = await Cours.findByPk(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });

    if (id_enseignant) {
      const enseignant = await Enseignant.findByPk(id_enseignant);
      if (!enseignant) return res.status(400).json({ message: 'Enseignant non trouvé' });
    }

    await cours.update({ nom, id_enseignant });
    res.json(cours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE supprimer un cours
router.delete('/:id', async (req, res) => {
  try {
    const cours = await Cours.findByPk(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });

    await cours.destroy();
    res.json({ message: 'Cours supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
