const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Enseignant = require('./Enseignant');

const Cours = sequelize.define('Cours', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_enseignant: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'enseignant',
      key: 'id',
    },
  },
}, {
  tableName: 'cours',
  timestamps: false,
});

// 🔗 Relation avec Enseignant (1 enseignant → plusieurs cours)
Cours.belongsTo(Enseignant, { foreignKey: 'id_enseignant', as: 'enseignant' });

module.exports = Cours;
