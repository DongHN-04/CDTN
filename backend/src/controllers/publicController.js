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
    const { customer, items, tableNumber, notes, paymentMethod, discount } = req.body;
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

    // Ánh xạ paymentMethod gửi lên sang enum trong DB: ['cash', 'card', 'qr']
    let dbPaymentMethod = 'cash';
    if (paymentMethod === 'vnpay') dbPaymentMethod = 'card';
    else if (paymentMethod === 'momo') dbPaymentMethod = 'qr';

    const orderDiscount = Number(discount) || 0;
    const finalTotal = Math.max(0, subtotal - orderDiscount);

    const order = await Order.create({
      customer: customer || { name: 'Khách lẻ', phone: '', address: '' },
      items: orderItems,
      subtotal,
      discount: orderDiscount,
      total: finalTotal,
      paymentMethod: dbPaymentMethod,
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

// @desc    Lấy danh sách combo công khai
// @route   GET /api/public/combos
// @access  Public
const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find({ isActive: true }).populate('items.menuItem', 'name price image');
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy khuyến mãi đang hoạt động
// @route   GET /api/public/promotions
// @access  Public
const getPromotions = async (req, res) => {
  try {
    const Promotion = require('../models/Promotion');
    const now = new Date();
    const promotions = await Promotion.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy dữ liệu trang chủ (menu + combos + promotions gộp)
// @route   GET /api/public/homepage
// @access  Public
const getHomepageData = async (req, res) => {
  try {
    const Promotion = require('../models/Promotion');
    const now = new Date();

    const [menuItems, combos, promotions] = await Promise.all([
      MenuItem.find({}),
      Combo.find({ isActive: true }).populate('items.menuItem', 'name price image'),
      Promotion.find({
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
    ]);

    // Lấy danh sách category duy nhất
    const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];

    // Chọn món nổi bật (featured) - lấy tối đa 8 món
    const featured = menuItems.slice(0, 8).map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      description: item.description,
      category: item.category,
      image: item.image,
    }));

    res.json({
      featured,
      categories,
      combos,
      promotions,
      totalMenuItems: menuItems.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getMenu, createOrder, getCombos, getPromotions, getHomepageData };