const express = require('express');
const { Op } = require('sequelize');

const router = express.Router();

const Note = require('../models/note');
const Etudiant = require('../models/Etudiant');
const SessionFormation = require('../models/session');
const Cours = require('../models/cours');
const Inscription = require('../models/inscription');
const Enseignant = require('../models/Enseignant');
const User = require('../models/User');
const auth = require('../middelwares/auth');

function parsePositiveInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) || n <= 0 ? null : n;
}

function parseNoteValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function isValidNoteOn20(value) {
  return Number.isFinite(value) && value >= 0 && value <= 20;
}

async function resolveEtudiantForConnectedUser(userPayload, createIfMissing = false) {
  if (!userPayload?.id) return null;

  const user = await User.findByPk(userPayload.id, {
    attributes: ['id', 'username', 'nom', 'prenom', 'phone', 'adresse'],
  });
  if (!user) return null;

  const username = (user.username || '').trim();
  const nom = (user.nom || '').trim() || username || `etudiant_${user.id}`;
  const prenom = (user.prenom || '').trim() || 'profil';
  const phone = (user.phone || '').trim();

  let etudiant = null;
  if (phone) {
    etudiant = await Etudiant.findOne({ where: { nom, prenom, phone }, order: [['id', 'ASC']] });
  }
  if (!etudiant) {
    etudiant = await Etudiant.findOne({ where: { nom, prenom }, order: [['id', 'ASC']] });
  }

  if (!etudiant && createIfMissing) {
    etudiant = await Etudiant.create({
      nom,
      prenom,
      phone: phone || '',
      adresse: user.adresse || null,
      dob: null,
    });
  }

  return etudiant;
}

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

async function getSessionWithCours(sessionId) {
  return SessionFormation.findByPk(sessionId, {
    include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom', 'id_enseignant'] }],
  });
}

router.get(['/sessions/:id/note', '/sessions/:id/notes'], auth(['admin', 'administratif', 'enseignant', 'etudiant']), async (req, res) => {
  try {
    const sessionId = parsePositiveInt(req.params.id);
    if (!sessionId) {
      return res.status(400).json({ message: 'ID session invalide' });
    }

    const session = await getSessionWithCours(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvee' });
    }

    if (req.user?.role === 'enseignant') {
      const me = await resolveEnseignantForConnectedUser(req.user);
      if (!me || Number(session.cours?.id_enseignant) !== Number(me.id)) {
        return res.status(403).json({ message: 'Acces refuse' });
      }
    }

    const notes = await Note.findAll({
      where: { id_session: sessionId },
      include: [{ model: Etudiant, as: 'etudiant', attributes: ['id', 'nom', 'prenom'] }],
      order: [['id', 'DESC']],
    });

    let myNote = null;
    let isInscrit = null;
    if (req.user?.role === 'etudiant') {
      const me = await resolveEtudiantForConnectedUser(req.user, false);
      if (me) {
        myNote = notes.find((n) => Number(n.id_etudiant) === Number(me.id)) || null;
        const inscription = await Inscription.findOne({
          where: { id_session: sessionId, id_etudiant: me.id },
        });
        isInscrit = !!inscription;
      } else {
        isInscrit = false;
      }
    }

    res.json({ session, notes, myNote, isInscrit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.post(['/sessions/:id/note', '/sessions/:id/notes'], auth(['etudiant']), async (req, res) => {
  try {
    const sessionId = parsePositiveInt(req.params.id);
    if (!sessionId) {
      return res.status(400).json({ message: 'ID session invalide' });
    }

    const valeur = parseNoteValue(req.body?.note);
    if (!isValidNoteOn20(valeur)) {
      return res.status(400).json({ message: 'La note doit etre comprise entre 0 et 20' });
    }

    const session = await getSessionWithCours(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvee' });
    }
    if (session.archivee) {
      return res.status(400).json({ message: 'Notation impossible sur une session archivee' });
    }

    const me = await resolveEtudiantForConnectedUser(req.user, true);
    if (!me) {
      return res.status(400).json({ message: 'Impossible de retrouver ou creer votre profil etudiant.' });
    }

    const inscription = await Inscription.findOne({
      where: { id_session: sessionId, id_etudiant: me.id },
    });
    if (!inscription) {
      return res.status(403).json({ message: 'Vous devez etre inscrit a cette session pour la noter' });
    }

    let existing = await Note.findOne({
      where: { id_etudiant: me.id, id_session: sessionId },
      order: [['id', 'DESC']],
    });

    if (existing) {
      await existing.update({ note: valeur });
      return res.json({ message: 'Note mise a jour', note: existing });
    }

    existing = await Note.create({
      id_etudiant: me.id,
      id_session: sessionId,
      note: valeur,
    });

    res.status(201).json({ message: 'Note enregistree', note: existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get(['/mes-notes', '/mes-avis'], auth(['etudiant']), async (req, res) => {
  try {
    const me = await resolveEtudiantForConnectedUser(req.user, false);
    if (!me) {
      return res.json({ notes: [] });
    }

    const notes = await Note.findAll({
      where: { id_etudiant: me.id },
      include: [{
        model: SessionFormation,
        as: 'session',
        attributes: ['id', 'date_debut', 'date_fin', 'archivee'],
        include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom'] }],
      }],
      order: [['id', 'DESC']],
    });

    res.json({ notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth(['admin', 'administratif', 'enseignant']), async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 5;
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    const andConditions = [];
    if (search) {
      const maybeSessionId = Number.parseInt(search, 10);
      const orConditions = [
        { '$etudiant.nom$': { [Op.like]: `%${search}%` } },
        { '$etudiant.prenom$': { [Op.like]: `%${search}%` } },
        { '$session.cours.nom$': { [Op.like]: `%${search}%` } },
      ];
      if (!Number.isNaN(maybeSessionId)) {
        orConditions.push({ id_session: maybeSessionId });
      }
      andConditions.push({ [Op.or]: orConditions });
    }

    if (req.user?.role === 'enseignant') {
      const me = await resolveEnseignantForConnectedUser(req.user);
      if (!me) {
        return res.json({
          notes: [],
          pagination: { page, totalPages: 0, totalItems: 0 },
        });
      }
      andConditions.push({ '$session.cours.id_enseignant$': me.id });
    }

    const whereCondition = andConditions.length ? { [Op.and]: andConditions } : {};

    const { count, rows } = await Note.findAndCountAll({
      where: whereCondition,
      include: [
        { model: Etudiant, as: 'etudiant', attributes: ['id', 'nom', 'prenom'], required: true },
        {
          model: SessionFormation,
          as: 'session',
          attributes: ['id', 'date_debut', 'date_fin', 'archivee'],
          required: true,
          include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom', 'id_enseignant'], required: true }],
        },
      ],
      limit,
      offset,
      order: [['id', 'ASC']],
      subQuery: false,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);
    res.json({
      notes: rows,
      pagination: { page, totalPages, totalItems: count },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth(['admin', 'administratif', 'enseignant']), async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [
        { model: Etudiant, as: 'etudiant', attributes: ['id', 'nom', 'prenom'] },
        {
          model: SessionFormation,
          as: 'session',
          attributes: ['id', 'date_debut', 'date_fin', 'archivee'],
          include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom', 'id_enseignant'] }],
        },
      ],
    });
    if (!note) return res.status(404).json({ message: 'Note non trouvee' });

    if (req.user?.role === 'enseignant') {
      const me = await resolveEnseignantForConnectedUser(req.user);
      if (!me || Number(note.session?.cours?.id_enseignant) !== Number(me.id)) {
        return res.status(403).json({ message: 'Acces refuse' });
      }
    }

    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth(['admin']), async (req, res) => {
  try {
    const id_etudiant = parsePositiveInt(req.body.id_etudiant);
    const id_session = parsePositiveInt(req.body.id_session);
    const valeur = parseNoteValue(req.body.note);

    if (!id_etudiant || !id_session) {
      return res.status(400).json({ message: 'id_etudiant et id_session sont obligatoires' });
    }
    if (!isValidNoteOn20(valeur)) {
      return res.status(400).json({ message: 'La note doit etre comprise entre 0 et 20' });
    }

    const etudiant = await Etudiant.findByPk(id_etudiant);
    if (!etudiant) return res.status(400).json({ message: 'Etudiant non trouve' });

    const session = await SessionFormation.findByPk(id_session);
    if (!session) return res.status(400).json({ message: 'Session non trouvee' });

    const nouvelleNote = await Note.create({ id_etudiant, id_session, note: valeur });
    res.status(201).json(nouvelleNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const existingNote = await Note.findByPk(req.params.id);
    if (!existingNote) return res.status(404).json({ message: 'Note non trouvee' });

    const payload = {};

    if (req.body.id_etudiant !== undefined) {
      const id_etudiant = parsePositiveInt(req.body.id_etudiant);
      if (!id_etudiant) return res.status(400).json({ message: 'id_etudiant invalide' });
      const etudiant = await Etudiant.findByPk(id_etudiant);
      if (!etudiant) return res.status(400).json({ message: 'Etudiant non trouve' });
      payload.id_etudiant = id_etudiant;
    }

    if (req.body.id_session !== undefined) {
      const id_session = parsePositiveInt(req.body.id_session);
      if (!id_session) return res.status(400).json({ message: 'id_session invalide' });
      const session = await SessionFormation.findByPk(id_session);
      if (!session) return res.status(400).json({ message: 'Session non trouvee' });
      payload.id_session = id_session;
    }

    if (req.body.note !== undefined) {
      const valeur = parseNoteValue(req.body.note);
      if (!isValidNoteOn20(valeur)) {
        return res.status(400).json({ message: 'La note doit etre comprise entre 0 et 20' });
      }
      payload.note = valeur;
    }

    if (!Object.keys(payload).length) {
      return res.status(400).json({ message: 'Aucune donnee a mettre a jour' });
    }

    await existingNote.update(payload);
    res.json(existingNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note non trouvee' });

    await note.destroy();
    res.json({ message: 'Note supprimee' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
