const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quotation = sequelize.define('Quotation', {
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
  expires: {
    type: DataTypes.DATE,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING', 'APPROVED', 'ACCEPTED', 'EXPIRED', 'CONVERTED'),
    defaultValue: 'DRAFT'
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  customerName: {
    type: DataTypes.STRING
  },
  customer: {
    type: DataTypes.UUID,
    allowNull: true
  }
});

module.exports = Quotation;
