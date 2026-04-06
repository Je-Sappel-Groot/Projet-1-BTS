const express = require('express');
const router = express.Router();

const Note = require('../models/note');
const Etudiant = require('../models/Etudiant');
const SessionFormation = require('../models/session');
const Cours = require('../models/cours');
const Enseignant = require('../models/Enseignant');
const User = require('../models/User');
const auth = require('../middelwares/auth');

async function resolveEnseignantForConnectedUser(userPayload) {
  if (!userPayload?.id) return null;

  const user = await User.findByPk(userPayload.id, {
    attributes: ['id', 'username', 'nom', 'prenom', 'phone'],
  });
  if (!user) return null;

  const username = (user.username || '').trim();
  const nom = (user.nom || '').trim() || username || `enseignant_${user.id}`;
  const prenom = (user.prenom || '').trim() || 'profil';
  const phone = (user.phone || '').trim();

  if (phone) {
    const byPhone = await Enseignant.findOne({ where: { nom, prenom, phone }, order: [['id', 'ASC']] });
    if (byPhone) return byPhone;
  }

  return Enseignant.findOne({ where: { nom, prenom }, order: [['id', 'ASC']] });
}

router.get('/', auth(['admin', 'administratif', 'enseignant']), (req, res) => {
  res.redirect('/notes/liste');
});

router.get('/liste', auth(['admin', 'administratif', 'enseignant']), (req, res) => {
  res.render('notes/liste');
});

router.get(['/mes-notes'], auth(['etudiant']), (req, res) => {
  res.render('notes/mesnotes', { title: 'Mes notes sessions' });
});

router.get(['/avis', '/mes-avis'], auth(['etudiant']), (req, res) => {
  res.redirect('/notes/mes-notes');
});

router.get(['/sessions/:id', '/sessions/:id/note', '/sessions/:id/avis'], auth(['admin', 'administratif', 'enseignant', 'etudiant']), async (req, res) => {
  try {
    const sessionId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).render('error', { message: 'ID session invalide', error: {} });
    }

    const session = await SessionFormation.findByPk(sessionId, {
      include: [{
        model: Cours,
        as: 'cours',
        attributes: ['id', 'nom', 'id_enseignant'],
        include: [{ model: Enseignant, as: 'enseignant', attributes: ['id', 'nom', 'prenom'] }],
      }],
    });

    if (!session) {
      return res.status(404).render('404', { title: 'Page non trouvee' });
    }

    if (req.user?.role === 'enseignant') {
      const me = await resolveEnseignantForConnectedUser(req.user);
      if (!me || Number(session.cours?.id_enseignant) !== Number(me.id)) {
        return res.status(403).render('403', { message: 'Acces refuse' });
      }
    }

    res.render('notes/session-notes', { session, title: `Notes - Session #${session.id}` });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

router.get(['/cours/:id', '/cours/:id/note', '/cours/:id/avis'], auth(['admin', 'administratif', 'enseignant', 'etudiant']), (req, res) => {
  res.redirect(`/sessions/liste?id_cours=${encodeURIComponent(req.params.id)}`);
});

router.get('/ajouter', auth(['admin']), async (req, res) => {
  try {
    const etudiants = await Etudiant.findAll();
    const sessions = await SessionFormation.findAll({
      include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom'] }],
      order: [['id', 'DESC']],
    });
    res.render('notes/ajouter', { etudiants, sessions });
  } catch (error) {
    console.error(error);
    res.render('notes/ajouter', { etudiants: [], sessions: [] });
  }
});

router.get('/modifier/:id', auth(['admin']), async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).render('404', { title: 'Page non trouvee' });

    const etudiants = await Etudiant.findAll();
    const sessions = await SessionFormation.findAll({
      include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom'] }],
      order: [['id', 'DESC']],
    });
    res.render('notes/modifier', { note, etudiants, sessions });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Erreur serveur', error });
  }
});

module.exports = router;
