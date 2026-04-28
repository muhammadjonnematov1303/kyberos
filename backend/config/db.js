const { Sequelize } = require("sequelize");
const path = require("path");

// Use PostgreSQL in production, SQLite in development
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction && process.env.DATABASE_URL) {
  // Production: PostgreSQL (Render + Neon)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
  });
} else {
  // Development: SQLite (local)
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "database.sqlite"),
    logging: false,
  });
}

module.exports = sequelize;
