const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryBatch = sequelize.define('InventoryBatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  batchNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  weight: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false
  },
  karat: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fine: {
    type: DataTypes.DECIMAL(15, 3)
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Available', 'Reserved', 'Processing', 'In Transit', 'Sold'),
    defaultValue: 'Available'
  },
  value: {
    type: DataTypes.DECIMAL(15, 2)
  },
  history: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  sourceName: {
    type: DataTypes.STRING
  },
  source: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  hooks: {
    beforeSave: (batch) => {
      if (batch.karat > 0) {
        batch.fine = (batch.weight * batch.karat) / 24;
      } else {
        batch.fine = 0;
      }
    }
  }
});

module.exports = InventoryBatch;
