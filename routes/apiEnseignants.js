const express = require('express');
const { Op } = require('sequelize');

const router = express.Router();

const auth = require('../middelwares/auth');
const Enseignant = require('../models/Enseignant');

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

    const enseignant = await Enseignant.create({
      nom,
      prenom,
      adresse: adresse || null,
      dob: toDateOrNull(dob),
      phone: phone || '',
    });

    res.status(201).json(enseignant);
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

    const { count, rows } = await Enseignant.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    res.json({
      enseignants: rows,
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

    const enseignant = await Enseignant.findByPk(id);
    if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouve' });

    res.json(enseignant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const enseignant = await Enseignant.findByPk(id);
    if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouve' });

    const { nom, prenom, adresse, dob, phone } = req.body;

    await enseignant.update({
      nom: nom !== undefined ? nom : enseignant.nom,
      prenom: prenom !== undefined ? prenom : enseignant.prenom,
      adresse: adresse !== undefined ? adresse : enseignant.adresse,
      dob: dob !== undefined ? toDateOrNull(dob) : enseignant.dob,
      phone: phone !== undefined ? phone : enseignant.phone,
    });

    res.json({ success: true, message: 'Enseignant mis a jour', enseignant });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth(['admin', 'administratif']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID invalide' });

    const enseignant = await Enseignant.findByPk(id);
    if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouve' });

    await enseignant.destroy();
    res.json({ success: true, message: 'Enseignant supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
