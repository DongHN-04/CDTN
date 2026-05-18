const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },                 // tên món
  price: { type: Number, required: true },                // giá bán
  description: String,                                    // mô tả món
  category: { type: String, required: true },             // danh mục (Khai vị, Món chính...)
  image: String,                                          // URL ảnh (có thể để tạm)
  isActive: {
    type: Boolean,
    default: true,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
  ingredients: [                                          // danh sách nguyên liệu cần cho 1 món
    {
      ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
      },
      quantity: { type: Number, required: true }          // số lượng nguyên liệu (vd: 0.2 kg)
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
