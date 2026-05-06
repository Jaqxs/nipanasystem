const sequelize = require('./config/database');
const { User } = require('./models/associations');
const dotenv = require('dotenv');

dotenv.config();

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to SQLite for clean seeding...');

    // Clear existing data
    await sequelize.sync({ force: true });
    console.log('Tables recreated.');

    // 1. Create Demo Users
    await User.create({ 
      name: 'Julius Assey', 
      email: 'j.assey@nipana.tz', 
      password: 'demo', 
      role: 'admin', 
      location: 'Mwanza · HQ' 
    });

    await User.create({ 
      name: 'Maria Rweyemamu', 
      email: 'm.rwey@nipana.tz', 
      password: 'demo', 
      role: 'sales_ops', 
      location: 'Vault A' 
    });

    console.log('Clean database initialized with Demo users: j.assey@nipana.tz and m.rwey@nipana.tz / password: demo');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
