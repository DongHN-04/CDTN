const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Combo = require('../models/Combo');

// @desc    Lấy thực đơn công khai
// @route   GET /api/public/menu
// @access  Public
const getMenu = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({});
    // Chỉ trả về thông tin cơ bản, không cần populate nguyên liệu
    const publicMenu = menuItems.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      description: item.description,
      category: item.category,
      image: item.image,
    }));
    res.json(publicMenu);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Tạo đơn hàng từ khách (không cần token)
// @route   POST /api/public/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { customer, items, tableNumber, notes } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Có thể là món thường hoặc combo
      if (item.comboId) {
        const combo = await Combo.findById(item.comboId);
        if (!combo) throw new Error(`Combo không tồn tại: ${item.comboId}`);
        orderItems.push({
          comboId: combo._id,
          name: combo.name,
          quantity: item.quantity,
          price: combo.price,
        });
        subtotal += combo.price * item.quantity;
      } else if (item.menuItem) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem) throw new Error(`Món không tồn tại: ${item.menuItem}`);
        orderItems.push({
          menuItem: menuItem._id,
          quantity: item.quantity,
          price: menuItem.price,
        });
        subtotal += menuItem.price * item.quantity;
      } else {
        throw new Error('Item không hợp lệ');
      }
    }

    const order = await Order.create({
      customer: customer || { name: 'Khách lẻ', phone: '' },
      items: orderItems,
      subtotal,
      total: subtotal,
      tableNumber: tableNumber || '',
      notes: notes || '',
      isCustomerOrder: true,
      status: 'pending'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getMenu, createOrder };