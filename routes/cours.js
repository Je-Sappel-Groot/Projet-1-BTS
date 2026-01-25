const express = require('express');
const router = express.Router();
const Cours = require('../models/cours');
const Enseignant = require('../models/Enseignant');

router.get('/', (req, res) => {
  res.redirect('/cours/liste');
});

router.get('/liste', (req, res) => {
  res.render('cours/liste');
});

router.get('/ajouter', async (req, res) => {
  try {
    const enseignants = await Enseignant.findAll();
    res.render('cours/ajouter', { enseignants });
  } catch (error) {
    console.error(error);
    res.render('cours/ajouter', { enseignants: [] });
  }
});

router.get('/modifier/:id', async (req, res) => {
  try {
    const cours = await Cours.findByPk(req.params.id, {
      include: [{ model: Enseignant, as: 'enseignant', attributes: ['id', 'nom', 'prenom'] }]
    });
    if (!cours) return res.status(404).render('404', { title: 'Page non trouvee' });

    const enseignants = await Enseignant.findAll();
    res.render('cours/modifier', { cours, enseignants });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

module.exports = router;
