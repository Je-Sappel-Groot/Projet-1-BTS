const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const Etudiant = require('../models/Etudiant');
const Enseignant = require('../models/Enseignant');
const Cours = require('../models/cours');
const Note = require('../models/note');

router.get('/', async (req, res) => {
  try {
    const [etudiants, enseignants, cours, notes] = await Promise.all([
      Etudiant.count(),
      Enseignant.count(),
      Cours.count(),
      Note.count()
    ]);

    const avgResult = await Note.findAll({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('note')), 'moyenne']]
    });
    const moyenne = avgResult[0]?.dataValues?.moyenne || 0;

    const dernieresFormations = await Cours.findAll({
      limit: 5,
      order: [['id', 'DESC']],
      include: [{ model: Enseignant, as: 'enseignant', attributes: ['nom', 'prenom'] }]
    });

    res.json({
      counts: { etudiants, enseignants, cours, notes },
      moyenne: Number(parseFloat(moyenne).toFixed(2)),
      dernieresFormations
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
