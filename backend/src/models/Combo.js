const mongoose = require('mongoose');

const comboItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: { type: Number, required: true, default: 1 }
});

const comboMenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    items: [comboItemSchema],         // Danh sách món trong combo
    price: { type: Number, required: true }, // Giá bán combo
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Combo', comboMenuSchema);
