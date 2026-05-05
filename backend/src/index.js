const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const seedAdmin = require('./utils/seedAdmin');
const userRoutes = require('./routes/userRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const menuRoutes = require('./routes/menuRoutes');
const path = require('path');
const uploadRoutes = require('./routes/uploadRoutes');

// Nạp biến môi trường từ file .env
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Cho phép tất cả các origin truy cập (có thể giới hạn sau)
app.use(express.json()); // Phân tích cú pháp JSON từ body request

// Cho phép truy cập file tĩnh trong thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Định nghĩa routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', require('./routes/orderRoutes'));

// Route mặc định
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

// Hàm khởi động server
const startServer = async () => {
  try {
    // Kết nối database
    await connectDB();

    // Tạo admin mặc định nếu chưa có
    await seedAdmin();

    // Khởi động server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Không thể khởi động server:', error);
    process.exit(1);
  }
};

startServer();
