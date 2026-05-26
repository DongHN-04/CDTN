const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },  // tên nguyên liệu, không trùng
  stock: { type: Number, required: true, min: 0 },       // số lượng tồn kho
  unit: { type: String, required: true },                 // đơn vị tính (kg, g, cái,...)
  pricePerUnit: { type: Number, default: 0 },             // giá nhập mỗi đơn vị
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);
