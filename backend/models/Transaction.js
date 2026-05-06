const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ref: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  type: {
    type: DataTypes.ENUM('Gold Sale', 'Gold Purchase', 'Op. Expense', 'Processing', 'Logistics', 'Cash Inflow', 'Cash Outflow'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  partyName: {
    type: DataTypes.STRING
  },
  party: {
    type: DataTypes.UUID,
    allowNull: true
  }
});

module.exports = Transaction;
