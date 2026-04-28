const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('App', {
  id:          { type: DataTypes.STRING(40),  primaryKey: true },
  name:        { type: DataTypes.STRING(200), allowNull: false },
  desc:        { type: DataTypes.TEXT },
  icon:        { type: DataTypes.TEXT },
  fileId:      { type: DataTypes.STRING(80) },
  fileName:    { type: DataTypes.STRING(200) },
  link:        { type: DataTypes.STRING(500) },
  price:       { type: DataTypes.INTEGER, defaultValue: 0 },
  category:    { type: DataTypes.STRING(50), defaultValue: 'other' },
  paymentInfo: { type: DataTypes.STRING(300) },
}, { tableName: 'apps', timestamps: true });
