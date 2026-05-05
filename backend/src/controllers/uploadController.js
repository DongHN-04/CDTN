const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Xác định đường dẫn tuyệt đối đến thư mục uploads (cùng cấp với src)
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// Tự động tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadImage = upload.single('image');

const uploadMenuItemImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ image: imageUrl });
};

module.exports = { uploadImage, uploadMenuItemImage };