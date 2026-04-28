const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Payment', {
  id:        { type: DataTypes.STRING(40), primaryKey: true },
  userId:    { type: DataTypes.STRING(40) },
  userName:  { type: DataTypes.STRING(200) },
  userEmail: { type: DataTypes.STRING(200) },
  appId:     { type: DataTypes.STRING(40) },
  appName:   { type: DataTypes.STRING(200) },
  amount:    { type: DataTypes.INTEGER, defaultValue: 0 },
  receipt:   { type: DataTypes.TEXT('long') },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'denied'),
    defaultValue: 'pending',
  },
}, { tableName: 'payments', timestamps: true });
