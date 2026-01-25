const express = require('express');
const router = express.Router();
const Note = require('../models/note');
const Etudiant = require('../models/Etudiant');
const Cours = require('../models/cours');

router.get('/', (req, res) => {
  res.redirect('/notes/liste');
});

router.get('/liste', (req, res) => {
  res.render('notes/liste');
});

router.get('/ajouter', async (req, res) => {
  try {
    const etudiants = await Etudiant.findAll();
    const cours = await Cours.findAll();
    res.render('notes/ajouter', { etudiants, cours });
  } catch (error) {
    console.error(error);
    res.render('notes/ajouter', { etudiants: [], cours: [] });
  }
});

router.get('/modifier/:id', async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).render('404', { title: 'Page non trouvee' });

    const etudiants = await Etudiant.findAll();
    const cours = await Cours.findAll();
    res.render('notes/modifier', { note, etudiants, cours });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

module.exports = router;
