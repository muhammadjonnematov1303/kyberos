const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Message', {
  id:      { type: DataTypes.STRING(40), primaryKey: true },
  name:    { type: DataTypes.STRING(200) },
  phone:   { type: DataTypes.STRING(50) },
  email:   { type: DataTypes.STRING(200) },
  message: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('unread', 'read'),
    defaultValue: 'unread',
  },
}, { tableName: 'messages', timestamps: true });
