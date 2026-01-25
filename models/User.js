const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('admin', 'etudiant', 'enseignant', 'administratif'),
    allowNull: false,
    defaultValue: 'etudiant'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active'
  },
  nom: { type: DataTypes.STRING, allowNull: true },
  prenom: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  adresse: { type: DataTypes.STRING, allowNull: true },
  lastLogin: { type: DataTypes.DATE, allowNull: true },
  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = User;
