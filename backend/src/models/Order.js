const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }, // không còn required
  comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo' },
  name: String,   // lưu tên combo nếu là combo
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, default: 'Khách lẻ' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // không bắt buộc (vì khách tự đặt)
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  promoCode: { type: String, default: '' },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'qr'], default: 'cash' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed'], default: 'unpaid' },
  txnRef: { type: String, default: '' },
  inventoryDeducted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'],
    default: 'pending' // mặc định là chờ xác nhận khi khách đặt
  },
  // Dành cho đơn từ khách:
  tableNumber: { type: String, default: '' },  // số bàn (khách nhập)
  notes: { type: String, default: '' },        // ghi chú
  isCustomerOrder: { type: Boolean, default: false } // đánh dấu đơn từ khách
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
