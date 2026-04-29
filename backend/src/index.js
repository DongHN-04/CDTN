const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const seedAdmin = require('./utils/seedAdmin');

// Nạp biến môi trường từ file .env
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Cho phép tất cả các origin truy cập (có thể giới hạn sau)
app.use(express.json()); // Phân tích cú pháp JSON từ body request

// Định nghĩa routes
app.use('/api/auth', authRoutes);

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
