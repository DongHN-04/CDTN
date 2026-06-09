const dns = require('dns');
require('dotenv').config();

if (process.env.FORCE_GOOGLE_DNS === 'true') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const connectDB = require('../config/db');
const seedAdmin = require('./seedAdmin');
const seedData = require('./seedData');

const runSeed = async () => {
  try {
    await connectDB();
    await seedAdmin();
    await seedData();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

runSeed();
