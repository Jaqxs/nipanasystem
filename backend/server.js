const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config({ override: true });
const sequelize = require('./config/database');
require('./models/associations'); // Initialize associations



const app = express();

// Middleware
const allowedOrigins = [
  'https://system.nipanaatlas.co.tz',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));

app.get('/', (req, res) => {
  res.send('GBMS API (SQLite) is running...');
});

// Database Connection
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(async () => {
    const dbType = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
    console.log(`Connected to ${dbType} and models synchronized.`);
    
    // Auto-seed demo users if database is empty
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Seeding demo users...');
      const hashedPassword = await bcrypt.hash('demo', 10);
      await User.bulkCreate([
        { id: '92c6d291-fc13-469f-a690-964b5f140d05', name: 'Julius Assey', email: 'j.assey@nipana.tz', password: hashedPassword, role: 'admin' },
        { id: '92c6d291-fc13-469f-a690-964b5f140d06', name: 'Maria Rweyemamu', email: 'm.rwey@nipana.tz', password: hashedPassword, role: 'ops' }
      ]);
      console.log('Demo users seeded successfully.');
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('Database connection error:', err));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});
