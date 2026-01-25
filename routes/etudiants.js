const express = require('express');
const router = express.Router();
const Etudiant = require('../models/Etudiant');

router.get('/', (req, res) => {
  res.redirect('/etudiants');
});

router.get('/etudiants', (req, res) => {
  res.render('etudiants/liste');
});

router.get('/etudiants/ajouter', (req, res) => {
  res.render('etudiants/ajouter');
});

router.get('/etudiants/modifier/:id', async (req, res) => {
  try {
    const etudiant = await Etudiant.findByPk(req.params.id);
    if (!etudiant) return res.status(404).render('404', { title: 'Page non trouvee' });
    res.render('etudiants/modifier', { etudiant });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

module.exports = router;
