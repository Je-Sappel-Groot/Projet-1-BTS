const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Etudiant = require('./Etudiant');
const SessionFormation = require('./session');

const Note = sequelize.define('Note', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_etudiant: { type: DataTypes.INTEGER, allowNull: false },
  id_session: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.FLOAT, allowNull: false },
}, {
  tableName: 'note',
  timestamps: false,
});

// Associations
Note.belongsTo(Etudiant, { foreignKey: 'id_etudiant', as: 'etudiant' });
Note.belongsTo(SessionFormation, { foreignKey: 'id_session', as: 'session' });

module.exports = Note;
