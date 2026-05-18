const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    totalCash: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    actualCash: { type: Number, default: 0 },
    difference: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', shiftSchema);
