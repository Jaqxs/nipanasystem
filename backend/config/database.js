const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = (process.env.DATABASE_URL && process.env.NODE_ENV === 'production')
  ? new Sequelize(process.env.DATABASE_URL, {
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: false,
    });

module.exports = sequelize;
