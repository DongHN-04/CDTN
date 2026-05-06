const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },          // Tên chương trình
    description: { type: String, default: '' },      // Mô tả
    type: {
      type: String,
      enum: ['percent', 'fixed', 'buyXgetY'],        // Loại: giảm %, giảm tiền, mua X tặng Y
      required: true
    },
    value: { type: Number, default: 0 },             // Giá trị: số % hoặc số tiền
    minOrderValue: { type: Number, default: 0 },     // Đơn tối thiểu để áp dụng
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }       // Bật/tắt nhanh
  },
  { timestamps: true }
);

module.exports = mongoose.model('Promotion', promotionSchema);