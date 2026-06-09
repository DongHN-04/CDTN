const dns = require('dns');
require('dotenv').config();

if (process.env.FORCE_GOOGLE_DNS === 'true') {
  // Chi ep DNS khi can debug ket noi MongoDB trong moi truong dev.
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const seedData = require('./utils/seedData');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const menuRoutes = require('./routes/menuRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const comboRoutes = require('./routes/comboRoutes');
const publicRoutes = require('./routes/publicRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { releaseExpiredPaymentReservations } = require('./controllers/orderController');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/images', express.static(path.join(__dirname, '..', '..', 'frontend', 'public', 'images')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const PAYMENT_RESERVATION_SWEEP_MS = Number(process.env.PAYMENT_RESERVATION_SWEEP_MS || 60 * 1000);

const startServer = async () => {
  try {
    await connectDB();
    if (process.env.RUN_SEED_ON_START === 'true') {
      // Khong seed mac dinh o production de tranh thay doi du lieu ngoai y muon khi restart server.
      await seedAdmin();
      await seedData();
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    let isSweepingPaymentReservations = false;
    setInterval(async () => {
      if (isSweepingPaymentReservations) return;
      isSweepingPaymentReservations = true;
      try {
        await releaseExpiredPaymentReservations();
      } catch (error) {
        console.warn('Khong the quet don VNPay qua han:', error.message);
      } finally {
        isSweepingPaymentReservations = false;
      }
    }, PAYMENT_RESERVATION_SWEEP_MS);
  } catch (error) {
    console.error('Cannot start server:', error);
    process.exit(1);
  }
};

startServer();
