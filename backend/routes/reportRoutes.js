const express = require('express');
const { Transaction, InventoryBatch, Invoice, Quotation } = require('../models/associations');
const { protect, admin } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// @desc    Get system-wide reports and metrics
// @route   GET /api/reports/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const [txCount, invCount, invcCount, quotCount] = await Promise.all([
      Transaction.count(),
      InventoryBatch.count({ where: { status: 'Available' } }),
      Invoice.count({ where: { status: { [Op.ne]: 'paid' } } }),
      Quotation.count({ where: { status: 'PENDING' } })
    ]);

    const transactions = await Transaction.findAll({
       where: { status: 'confirmed' },
       limit: 100,
       order: [['date', 'DESC']]
    });

    // Simple cash flow aggregation
    const inflows = transactions.filter(t => ['Gold Sale', 'Cash Inflow'].includes(t.type)).reduce((a, b) => a + Number(b.amount), 0);
    const outflows = transactions.filter(t => ['Gold Purchase', 'Op. Expense', 'Processing', 'Logistics', 'Cash Outflow'].includes(t.type)).reduce((a, b) => a + Number(b.amount), 0);

    res.json({
      counts: { transactions: txCount, inventory: invCount, invoices: invcCount, quotations: quotCount },
      finance: { inflows, outflows, net: inflows - outflows },
      recentTransactions: transactions.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get cash flow data
// @route   GET /api/reports/cash-flow
router.get('/cash-flow', protect, async (req, res) => {
  try {
    const flows = await Transaction.findAll({
      where: { status: 'confirmed' },
      order: [['date', 'DESC']],
      limit: 50
    });
    res.json(flows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get AI briefing/summary
// @route   GET /api/reports/briefing
router.get('/briefing', protect, async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);

    const txs = await Transaction.findAll({
      where: {
        date: { [Op.gte]: yesterday },
        status: 'confirmed'
      }
    });

    const inflow = txs.filter(t => ['Gold Sale', 'Cash Inflow'].includes(t.type)).reduce((a, b) => a + Number(b.amount), 0);
    const outflow = txs.filter(t => ['Gold Purchase', 'Op. Expense', 'Processing', 'Logistics', 'Cash Outflow'].includes(t.type)).reduce((a, b) => a + Number(b.amount), 0);

    let summary = `Yesterday recorded ${txs.length} confirmed transactions. `;
    if (txs.length > 0) {
      summary += `Total inflows of $${inflow.toLocaleString()} and outflows of $${outflow.toLocaleString()}. `;
      const balance = inflow - outflow;
      summary += `Net position changed by $${balance.toLocaleString()}. `;
    } else {
      summary = "No activity was recorded yesterday. Add transactions to see AI-generated summaries and insights here.";
    }

    res.json({
      summary,
      metrics: {
        sales: txs.filter(t => t.type === 'Gold Sale').reduce((a, b) => a + Number(b.amount), 0),
        expenses: txs.filter(t => ['Op. Expense', 'Processing', 'Logistics'].includes(t.type)).reduce((a, b) => a + Number(b.amount), 0),
        count: txs.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
