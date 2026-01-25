// routes/apiNotes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Note = require('../models/note');
const Etudiant = require('../models/Etudiant');
const Cours = require('../models/cours');

// ---------------------
// Liste paginée avec recherche
// ---------------------
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Recherche sur le nom de l'étudiant ou du cours
    const whereCondition = search
      ? {
          [Op.or]: [
            { '$Etudiant.nom$': { [Op.like]: `%${search}%` } },
            { '$Etudiant.prenom$': { [Op.like]: `%${search}%` } },
            { '$Cours.nom$': { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Note.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Etudiant,
          as: 'etudiant',
          attributes: ['id', 'nom', 'prenom'],
        },
        {
          model: Cours,
          as: 'cours',
          attributes: ['id', 'nom'],
        },
      ],
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      notes: rows,
      pagination: {
        page,
        totalPages,
        totalItems: count,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ---------------------
// GET: Un note par ID
// ---------------------
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [
        { model: Etudiant, as: 'etudiant', attributes: ['id', 'nom', 'prenom'] },
        { model: Cours, as: 'cours', attributes: ['id', 'nom'] },
      ],
    });
    if (!note) return res.status(404).json({ message: 'Note non trouvée' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------
// POST: Ajouter une note
// ---------------------
router.post('/', async (req, res) => {
  try {
    const { id_etudiant, id_cours, note } = req.body;

    // Vérification existence Etudiant et Cours
    const etudiant = await Etudiant.findByPk(id_etudiant);
    if (!etudiant) return res.status(400).json({ message: 'Étudiant non trouvé' });

    const cours = await Cours.findByPk(id_cours);
    if (!cours) return res.status(400).json({ message: 'Cours non trouvé' });

    const nouvelleNote = await Note.create({ id_etudiant, id_cours, note });
    res.status(201).json(nouvelleNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------
// PUT: Modifier une note
// ---------------------
router.put('/:id', async (req, res) => {
  try {
    const { id_etudiant, id_cours, note } = req.body;

    const existingNote = await Note.findByPk(req.params.id);
    if (!existingNote) return res.status(404).json({ message: 'Note non trouvée' });

    if (id_etudiant) {
      const etudiant = await Etudiant.findByPk(id_etudiant);
      if (!etudiant) return res.status(400).json({ message: 'Étudiant non trouvé' });
    }

    if (id_cours) {
      const cours = await Cours.findByPk(id_cours);
      if (!cours) return res.status(400).json({ message: 'Cours non trouvé' });
    }

    await existingNote.update({ id_etudiant, id_cours, note });
    res.json(existingNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------
// DELETE: Supprimer une note
// ---------------------
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note non trouvée' });

    await note.destroy();
    res.json({ message: 'Note supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
