const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },   // Bắt buộc
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    totalCash: { type: Number, default: 0 },   // Tổng tiền mặt hệ thống tính được
    actualCash: { type: Number, default: 0 },  // Tiền mặt thực tế nhập vào
    difference: { type: Number, default: 0 },  // Chênh lệch
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', shiftSchema);