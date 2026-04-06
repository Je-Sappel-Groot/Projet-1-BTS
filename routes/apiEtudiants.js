const express = require('express');
const { Op } = require('sequelize');

const router = express.Router();

const Etudiant = require('../models/Etudiant');
const auth = require('../middelwares/auth');

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

router.post('/', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const { nom, prenom, adresse, dob, phone } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({ message: 'nom et prenom sont obligatoires' });
    }

    const etudiant = await Etudiant.create({
      nom,
      prenom,
      adresse: adresse || null,
      dob: toDateOrNull(dob),
      phone: phone || '',
    });

    res.status(201).json(etudiant);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

router.get('/', auth(['admin', 'administratif', 'enseignant']), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereCondition = search
      ? {
          [Op.or]: [
            { nom: { [Op.like]: `%${search}%` } },
            { prenom: { [Op.like]: `%${search}%` } },
            { adresse: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Etudiant.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    res.json({
      etudiants: rows,
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

router.get('/:id', auth(['admin', 'administratif', 'enseignant']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const etudiant = await Etudiant.findByPk(id);
    if (!etudiant) return res.status(404).json({ message: 'Etudiant non trouve' });

    res.json(etudiant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const etudiant = await Etudiant.findByPk(id);
    if (!etudiant) return res.status(404).json({ message: 'Etudiant non trouve' });

    const { nom, prenom, adresse, dob, phone } = req.body;

    await etudiant.update({
      nom: nom !== undefined ? nom : etudiant.nom,
      prenom: prenom !== undefined ? prenom : etudiant.prenom,
      adresse: adresse !== undefined ? adresse : etudiant.adresse,
      dob: dob !== undefined ? toDateOrNull(dob) : etudiant.dob,
      phone: phone !== undefined ? phone : etudiant.phone,
    });

    res.json({ success: true, message: 'Etudiant mis a jour', etudiant });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const etudiant = await Etudiant.findByPk(id);
    if (!etudiant) return res.status(404).json({ message: 'Etudiant non trouve' });

    await etudiant.destroy();
    res.json({ success: true, message: 'Etudiant supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
