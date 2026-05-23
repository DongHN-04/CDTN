require('dotenv').config();

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
