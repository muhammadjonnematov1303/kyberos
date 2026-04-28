const { Sequelize } = require("sequelize");
const path = require("path");

// Use SQLite for local development (no internet required)
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "database.sqlite"),
  logging: false,
});

module.exports = sequelize;
