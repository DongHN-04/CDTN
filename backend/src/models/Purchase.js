const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity: { type: Number, required: true },          // Số lượng nhập
  unitPrice: { type: Number, required: true },         // Giá nhập mỗi đơn vị
  totalPrice: { type: Number, required: true }         // Thành tiền (quantity * unitPrice)
});

const purchaseSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [purchaseItemSchema],
    totalAmount: { type: Number, required: true },     // Tổng tiền nhập
    paidAmount: { type: Number, default: 0 },          // Số tiền đã trả
    debtAfterPurchase: { type: Number, default: 0 },   // Công nợ sau khi nhập
    purchaseDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);