// models/etudiant.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // 👈 bien le fichier de config

const Etudiant = sequelize.define('Etudiant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
  },
}, {
  tableName: 'etudiants',
  timestamps: false, // désactiver createdAt / updatedAt si ta table n’en a pas
});

module.exports = Etudiant;
