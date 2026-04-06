const express = require('express');
const router = express.Router();
const Enseignant = require('../models/Enseignant');
const auth = require('../middelwares/auth');

router.get('/', auth(['admin', 'administratif']), (req, res) => {
  res.redirect('/enseignants');
});

router.get('/enseignants', auth(['admin', 'administratif']), (req, res) => {
  res.render('enseignants/liste');
});

router.get('/enseignants/ajouter', auth(['admin', 'administratif']), (req, res) => {
  res.render('enseignants/ajouter');
});

router.get('/enseignants/modifier/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const enseignant = await Enseignant.findByPk(req.params.id);
    if (!enseignant) return res.status(404).render('404', { title: 'Page non trouvee' });
    res.render('enseignants/modifier', { enseignant });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

module.exports = router;
