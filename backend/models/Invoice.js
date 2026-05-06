const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  no: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  issued: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  due: {
    type: DataTypes.DATE,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'draft'
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  tax: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  customerName: {
    type: DataTypes.STRING
  },
  customer: {
    type: DataTypes.UUID,
    allowNull: true
  }
});

module.exports = Invoice;
