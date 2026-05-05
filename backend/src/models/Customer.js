const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    type: { type: String, enum: ['VIP', 'Thường'], default: 'Thường' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);