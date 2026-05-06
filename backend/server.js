const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
require('./models/associations'); // Initialize associations

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));

app.get('/', (req, res) => {
  res.send('GBMS API (SQLite) is running...');
});

// Database Connection
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }) // Update tables to match models
  .then(() => {
    console.log('Connected to SQLite');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('SQLite connection error:', err));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});
