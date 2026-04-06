const express = require('express');
const router = express.Router();
const SessionFormation = require('../models/session');
const Cours = require('../models/cours');
const Etudiant = require('../models/Etudiant');
const auth = require('../middelwares/auth');

router.get('/', auth(['admin', 'administratif', 'enseignant', 'etudiant']), (req, res) => {
  res.redirect('/sessions/liste');
});

router.get('/liste', auth(['admin', 'administratif', 'enseignant', 'etudiant']), (req, res) => {
  res.render('sessions/liste');
});

router.get('/ajouter', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const cours = await Cours.findAll({ order: [['nom', 'ASC']] });
    res.render('sessions/ajouter', { cours });
  } catch (error) {
    console.error(error);
    res.render('sessions/ajouter', { cours: [] });
  }
});

router.get('/modifier/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const session = await SessionFormation.findByPk(req.params.id, {
      include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom'] }],
    });

    if (!session) {
      return res.status(404).render('404', { title: 'Page non trouvee' });
    }

    const cours = await Cours.findAll({ order: [['nom', 'ASC']] });
    res.render('sessions/modifier', { session, cours });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

router.get('/inscriptions/:id', auth(['admin', 'administratif', 'enseignant', 'etudiant']), async (req, res) => {
  try {
    const session = await SessionFormation.findByPk(req.params.id, {
      include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom'] }],
    });

    if (!session) {
      return res.status(404).render('404', { title: 'Page non trouvee' });
    }

    const etudiants = await Etudiant.findAll({ order: [['nom', 'ASC'], ['prenom', 'ASC']] });
    res.render('sessions/inscriptions', { session, etudiants });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

module.exports = router;
