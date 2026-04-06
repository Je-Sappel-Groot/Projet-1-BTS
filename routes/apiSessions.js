const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const SessionFormation = require('../models/session');
const Cours = require('../models/cours');
const Enseignant = require('../models/Enseignant');
const Etudiant = require('../models/Etudiant');
const Inscription = require('../models/inscription');
const User = require('../models/User');
const auth = require('../middelwares/auth');

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return null;
}

async function resolveEtudiantForConnectedUser(userPayload, createIfMissing = false) {
  if (!userPayload?.id) return null;

  const user = await User.findByPk(userPayload.id, {
    attributes: ['id', 'username', 'nom', 'prenom', 'phone', 'adresse'],
  });
  if (!user) return null;

  // Fallbacks pour les anciens comptes incomplets:
  // on n'empêche plus l'inscription si nom/prenom n'ont jamais été renseignés.
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

router.get('/', auth(['admin', 'administratif', 'enseignant', 'etudiant']), async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    const where = {};

    const archivee = parseBoolean(req.query.archivee);
    if (archivee !== null) {
      where.archivee = archivee;
    }

    const coursId = Number.parseInt(req.query.id_cours, 10);
    if (!Number.isNaN(coursId)) {
      where.id_cours = coursId;
    }

    const includeCours = {
      model: Cours,
      as: 'cours',
      attributes: ['id', 'nom', 'id_enseignant'],
      include: [{ model: Enseignant, as: 'enseignant', attributes: ['id', 'nom', 'prenom'] }],
      required: false,
    };

    if (search) {
      includeCours.where = { nom: { [Op.like]: `%${search}%` } };
      includeCours.required = true;
    }

    const { count, rows } = await SessionFormation.findAndCountAll({
      where,
      include: [includeCours],
      distinct: true,
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    res.json({
      sessions: rows,
      pagination: {
        page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth(['admin', 'administratif', 'enseignant', 'etudiant']), async (req, res) => {
  try {
    const sessionId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ message: 'ID session invalide' });
    }

    const session = await SessionFormation.findByPk(sessionId, {
      include: [
        {
          model: Cours,
          as: 'cours',
          attributes: ['id', 'nom', 'id_enseignant'],
          include: [{ model: Enseignant, as: 'enseignant', attributes: ['id', 'nom', 'prenom'] }],
        },
        {
          model: Inscription,
          as: 'inscriptions',
          attributes: ['id', 'id_etudiant'],
          include: [{ model: Etudiant, as: 'etudiant', attributes: ['id', 'nom', 'prenom'] }],
        },
      ],
    });

    if (!session) {
      return res.status(404).json({ message: 'Session non trouvee' });
    }

    const payload = session.toJSON();
    if (req.user?.role === 'etudiant') {
      const me = await resolveEtudiantForConnectedUser(req.user, false);
      payload.my_etudiant_id = me ? me.id : null;
    }

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const { id_cours, date_debut, date_fin } = req.body;

    const coursId = Number.parseInt(id_cours, 10);
    if (Number.isNaN(coursId)) {
      return res.status(400).json({ message: 'id_cours est obligatoire et doit etre un entier' });
    }

    const cours = await Cours.findByPk(coursId);
    if (!cours) {
      return res.status(400).json({ message: 'Cours non trouve' });
    }

    if (!date_debut || !date_fin) {
      return res.status(400).json({ message: 'date_debut et date_fin sont obligatoires' });
    }

    const startDate = new Date(date_debut);
    const endDate = new Date(date_fin);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Format de date invalide (attendu: YYYY-MM-DD)' });
    }

    if (startDate > endDate) {
      return res.status(400).json({ message: 'date_debut doit etre inferieure ou egale a date_fin' });
    }

    const session = await SessionFormation.create({
      id_cours: coursId,
      date_debut,
      date_fin,
      archivee: false,
    });

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const sessionId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ message: 'ID session invalide' });
    }

    const session = await SessionFormation.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvee' });
    }

    const { id_cours, date_debut, date_fin, archivee } = req.body;
    const payload = {};

    if (id_cours !== undefined) {
      const coursId = Number.parseInt(id_cours, 10);
      if (Number.isNaN(coursId)) {
        return res.status(400).json({ message: 'id_cours invalide' });
      }
      const cours = await Cours.findByPk(coursId);
      if (!cours) {
        return res.status(400).json({ message: 'Cours non trouve' });
      }
      payload.id_cours = coursId;
    }

    if (date_debut !== undefined) {
      payload.date_debut = date_debut;
    }

    if (date_fin !== undefined) {
      payload.date_fin = date_fin;
    }

    if (archivee !== undefined) {
      const archiveeValue = parseBoolean(archivee);
      if (archiveeValue === null) {
        return res.status(400).json({ message: 'archivee doit etre un booleen' });
      }
      payload.archivee = archiveeValue;
    }

    const finalDateDebut = payload.date_debut || session.date_debut;
    const finalDateFin = payload.date_fin || session.date_fin;

    if (finalDateDebut && finalDateFin) {
      const startDate = new Date(finalDateDebut);
      const endDate = new Date(finalDateFin);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Format de date invalide (attendu: YYYY-MM-DD)' });
      }
      if (startDate > endDate) {
        return res.status(400).json({ message: 'date_debut doit etre inferieure ou egale a date_fin' });
      }
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'Aucune donnee a mettre a jour' });
    }

    await session.update(payload);
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/archive', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const sessionId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ message: 'ID session invalide' });
    }

    const session = await SessionFormation.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvee' });
    }

    if (session.archivee) {
      return res.status(409).json({ message: 'La session est deja archivee' });
    }

    await session.update({ archivee: true });
    res.json({ message: 'Session archivee', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/inscriptions', auth(['admin', 'administratif', 'etudiant']), async (req, res) => {
  try {
    const sessionId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ message: 'id session invalide' });
    }

    let etudiantId = null;
    if (req.user?.role === 'etudiant') {
      const me = await resolveEtudiantForConnectedUser(req.user, true);
      if (!me) {
        return res.status(400).json({
          message: "Impossible de retrouver ou creer votre profil etudiant.",
        });
      }
      etudiantId = me.id;
    } else {
      etudiantId = Number.parseInt(req.body?.id_etudiant, 10);
      if (Number.isNaN(etudiantId)) {
        return res.status(400).json({ message: 'id_etudiant doit etre valide' });
      }
    }

    const session = await SessionFormation.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvee' });
    }

    if (session.archivee) {
      return res.status(400).json({ message: 'Inscription impossible sur une session archivee' });
    }

    const etudiant = await Etudiant.findByPk(etudiantId);
    if (!etudiant) {
      return res.status(404).json({ message: 'Etudiant non trouve' });
    }

    const deja = await Inscription.findOne({ where: { id_session: sessionId, id_etudiant: etudiantId } });
    if (deja) {
      return res.status(409).json({ message: 'Cet etudiant est deja inscrit a cette session' });
    }

    const inscription = await Inscription.create({
      id_session: sessionId,
      id_etudiant: etudiantId,
    });

    res.status(201).json(inscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/inscriptions/:etudiantId', auth(['admin', 'administratif', 'etudiant']), async (req, res) => {
  try {
    const sessionId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ message: 'ID session invalide' });
    }

    let etudiantId = Number.parseInt(req.params.etudiantId, 10);
    if (req.user?.role === 'etudiant') {
      const me = await resolveEtudiantForConnectedUser(req.user, false);
      if (!me) {
        return res.status(400).json({
          message: "Impossible de retrouver votre profil etudiant.",
        });
      }
      if (!Number.isNaN(etudiantId) && etudiantId !== me.id) {
        return res.status(403).json({ message: "Vous ne pouvez supprimer que votre propre inscription" });
      }
      etudiantId = me.id;
    }

    if (Number.isNaN(etudiantId)) {
      return res.status(400).json({ message: 'ID etudiant invalide' });
    }

    const inscription = await Inscription.findOne({
      where: {
        id_session: sessionId,
        id_etudiant: etudiantId,
      },
    });

    if (!inscription) {
      return res.status(404).json({ message: 'Inscription non trouvee' });
    }

    await inscription.destroy();
    res.json({ message: 'Inscription supprimee' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
