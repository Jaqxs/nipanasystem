const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function check() {
  try {
    const tables = ['Transactions', 'InventoryBatches', 'Invoices', 'Quotations', 'Contacts'];
    for (const table of tables) {
      console.log(`\n--- ${table} ---`);
      const columns = await sequelize.query(`PRAGMA table_info(${table})`, { type: QueryTypes.SELECT });
      columns.forEach(c => console.log(`${c.name} (${c.type})`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
