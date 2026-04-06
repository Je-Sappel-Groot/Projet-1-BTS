const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Etudiant = require('./Etudiant');
const SessionFormation = require('./session');

const Inscription = sequelize.define('Inscription', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_session: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_etudiant: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'inscription',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_session', 'id_etudiant'],
    },
  ],
});

Inscription.belongsTo(SessionFormation, { foreignKey: 'id_session', as: 'session' });
Inscription.belongsTo(Etudiant, { foreignKey: 'id_etudiant', as: 'etudiant' });
SessionFormation.hasMany(Inscription, { foreignKey: 'id_session', as: 'inscriptions' });

module.exports = Inscription;
