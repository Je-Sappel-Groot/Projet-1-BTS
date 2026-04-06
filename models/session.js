const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Cours = require('./cours');

const SessionFormation = sequelize.define('SessionFormation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_cours: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  archivee: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'sessions',
  timestamps: false,
});

SessionFormation.belongsTo(Cours, { foreignKey: 'id_cours', as: 'cours' });

module.exports = SessionFormation;
