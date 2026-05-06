const User = require('./User');
const Contact = require('./Contact');
const Transaction = require('./Transaction');
const InventoryBatch = require('./InventoryBatch');
const Invoice = require('./Invoice');
const Quotation = require('./Quotation');

// Transaction associations
Transaction.belongsTo(Contact, { as: 'partyContact', foreignKey: 'party' });
Transaction.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// InventoryBatch associations
InventoryBatch.belongsTo(Contact, { as: 'sourceContact', foreignKey: 'source' });

// Invoice associations
Invoice.belongsTo(Contact, { as: 'customerContact', foreignKey: 'customer' });

// Quotation associations
Quotation.belongsTo(Contact, { as: 'customerContact', foreignKey: 'customer' });

module.exports = {
  User,
  Contact,
  Transaction,
  InventoryBatch,
  Invoice,
  Quotation
};
