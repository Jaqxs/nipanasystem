const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  type: {
    type: DataTypes.ENUM('customer', 'supplier'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  totalValue: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  outstanding: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  },
  joined: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastTx: {
    type: DataTypes.DATE
  }
});

module.exports = Contact;
