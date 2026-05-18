const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary bằng các biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình bộ lưu trữ Multer cho Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cdtn_uploads', // Thư mục lưu trữ trên Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'limit' }], // Giới hạn kích thước ảnh tối ưu
  },
});

// Bộ lọc định dạng file ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Lỗi tải ảnh lên Cloudinary:', err);
      return res.status(500).json({
        message: 'Lỗi tải ảnh lên Cloudinary',
        error: err.message
      });
    }
    next();
  });
};

const uploadMenuItemImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
  }

  // CloudinaryStorage tự động lưu URL đám mây tuyệt đối vào req.file.path
  const imageUrl = req.file.path;
  res.json({ image: imageUrl });
};

module.exports = { uploadImage, uploadMenuItemImage };
