const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Cours = require('../models/cours');
const Enseignant = require('../models/Enseignant');
const auth = require('../middelwares/auth');

router.get('/', auth(['admin', 'administratif', 'enseignant', 'etudiant']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || '';

    const offset = (page - 1) * limit;

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

router.get('/:id', auth(['admin', 'administratif', 'enseignant', 'etudiant']), async (req, res) => {
  try {
    const cours = await Cours.findByPk(req.params.id, {
      include: [{ model: Enseignant, as: 'enseignant', attributes: ['id', 'nom', 'prenom'] }]
    });
    if (!cours) return res.status(404).json({ message: 'Cours non trouve' });
    res.json(cours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const { nom, id_enseignant } = req.body;
    const enseignant = await Enseignant.findByPk(id_enseignant);
    if (!enseignant) return res.status(400).json({ message: 'Enseignant non trouve' });

    const cours = await Cours.create({ nom, id_enseignant });
    res.status(201).json(cours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const { nom, id_enseignant } = req.body;
    const cours = await Cours.findByPk(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouve' });

    if (id_enseignant) {
      const enseignant = await Enseignant.findByPk(id_enseignant);
      if (!enseignant) return res.status(400).json({ message: 'Enseignant non trouve' });
    }

    await cours.update({ nom, id_enseignant });
    res.json(cours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const cours = await Cours.findByPk(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouve' });

    await cours.destroy();
    res.json({ message: 'Cours supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
