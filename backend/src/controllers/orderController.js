const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const Combo = require('../models/Combo');
const Promotion = require('../models/Promotion');

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private (Admin, Staff)
const createOrder = async (req, res) => {
  try {
    const { customer, items, discount, paymentMethod } = req.body;
    const staff = req.user._id;

    console.log('Nhận được items:', JSON.stringify(items));

    let subtotal = 0;
    const orderItems = [];

    // 1. Xử lý từng item trong đơn
    for (const item of items) {
      if (item.comboId) {
        // --- COMBO ---
        const combo = await Combo.findById(item.comboId).populate('items.menuItem');
        if (!combo) throw new Error(`Combo không tồn tại: ${item.comboId}`);

        // Kiểm tra & trừ kho từng món thành phần
        for (const comboItem of combo.items) {
          const menuItem = comboItem.menuItem;
          const quantityNeeded = comboItem.quantity * item.quantity;

          const fullMenuItem = await MenuItem.findById(menuItem._id).populate('ingredients.ingredient');
          if (!fullMenuItem) throw new Error(`Món trong combo không tồn tại: ${menuItem._id}`);

          for (const ing of fullMenuItem.ingredients) {
            if (!ing.ingredient) continue;
            const requiredQty = ing.quantity * quantityNeeded;
            const ingredient = await Ingredient.findById(ing.ingredient._id);
            if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${ing.ingredient._id}`);
            if (ingredient.stock < requiredQty) {
              throw new Error(
                `Nguyên liệu ${ingredient.name} không đủ cho combo ${combo.name}. Cần ${requiredQty} ${ingredient.unit}, hiện có ${ingredient.stock}`
              );
            }
            ingredient.stock -= requiredQty;
            await ingredient.save();
          }
        }

        // Thêm vào orderItems
        orderItems.push({
          comboId: combo._id,
          name: combo.name,
          price: combo.price,
          quantity: item.quantity,
        });
        subtotal += combo.price * item.quantity;
      } else if (item.menuItem) {
        // --- MÓN THƯỜNG ---
        const menuItem = await MenuItem.findById(item.menuItem).populate('ingredients.ingredient');
        if (!menuItem) throw new Error(`Món ăn không tồn tại: ${item.menuItem}`);

        for (const ing of menuItem.ingredients) {
          if (!ing.ingredient) continue;
          const requiredQty = ing.quantity * item.quantity;
          const ingredient = await Ingredient.findById(ing.ingredient._id);
          if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${ing.ingredient._id}`);
          if (ingredient.stock < requiredQty) {
            throw new Error(
              `Nguyên liệu ${ingredient.name} không đủ. Cần ${requiredQty} ${ingredient.unit}, hiện có ${ingredient.stock}`
            );
          }
          ingredient.stock -= requiredQty;
          await ingredient.save();
        }

        orderItems.push({
          menuItem: menuItem._id,
          quantity: item.quantity,
          price: menuItem.price,
        });
        subtotal += menuItem.price * item.quantity;
      } else {
        throw new Error('Item không hợp lệ: thiếu menuItem hoặc comboId');
      }
    }

    // 2. Áp dụng khuyến mãi tự động
    const activePromotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      minOrderValue: { $lte: subtotal }
    });

    let bestDiscount = 0;
    for (const promo of activePromotions) {
      if (promo.type === 'percent') {
        const temp = subtotal * (promo.value / 100);
        if (temp > bestDiscount) bestDiscount = temp;
      } else if (promo.type === 'fixed') {
        if (promo.value > bestDiscount) bestDiscount = promo.value;
      }
    }

    if (bestDiscount > subtotal) bestDiscount = subtotal;

    const clientDiscount = discount || 0;
    const finalDiscount = Math.max(clientDiscount, bestDiscount);
    const total = subtotal - finalDiscount;

    // 3. Tạo đơn hàng
    const order = await Order.create({
      customer: customer || { name: 'Khách lẻ', phone: '' },
      staff,
      items: orderItems,
      subtotal,
      discount: finalDiscount,
      total,
      paymentMethod: paymentMethod || 'cash',
    });

    // Populate để trả về đầy đủ (có thể populate cả comboId nếu cần, tạm thời populate menuItem)
    const populatedOrder = await Order.findById(order._id)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    console.log('Tạo đơn thành công:', order._id);
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Lỗi tạo đơn:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lấy danh sách hóa đơn
// @route   GET /api/orders
// @access  Private (Admin, Staff)
const getOrders = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
    const orders = await Order.find(filter)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy chi tiết một hóa đơn
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy danh sách đơn hàng từ khách đang chờ xác nhận
// @route   GET /api/orders/pending
// @access  Private (Admin, Staff)
const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isCustomerOrder: true, status: 'pending' })
      .populate('items.menuItem', 'name price')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Xác nhận đơn hàng từ khách (trừ kho)
// @route   PUT /api/orders/:id/confirm
// @access  Private (Admin, Staff)
const confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Đơn hàng không ở trạng thái chờ xác nhận' });

    // Trừ kho (giống logic createOrder)
    for (const item of order.items) {
      if (item.comboId) {
        const combo = await Combo.findById(item.comboId).populate('items.menuItem');
        if (!combo) throw new Error(`Combo không tồn tại: ${item.comboId}`);
        for (const comboItem of combo.items) {
          const menuItem = await MenuItem.findById(comboItem.menuItem._id).populate('ingredients.ingredient');
          if (!menuItem) throw new Error(`Món trong combo không tồn tại: ${comboItem.menuItem._id}`);
          for (const ing of menuItem.ingredients) {
            if (!ing.ingredient) continue;
            const requiredQty = ing.quantity * comboItem.quantity * item.quantity;
            const ingredient = await Ingredient.findById(ing.ingredient._id);
            if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${ing.ingredient._id}`);
            if (ingredient.stock < requiredQty) {
              throw new Error(`Nguyên liệu ${ingredient.name} không đủ. Cần ${requiredQty} ${ingredient.unit}, hiện có ${ingredient.stock}`);
            }
            ingredient.stock -= requiredQty;
            await ingredient.save();
          }
        }
      } else if (item.menuItem) {
        const menuItem = await MenuItem.findById(item.menuItem).populate('ingredients.ingredient');
        if (!menuItem) throw new Error(`Món không tồn tại: ${item.menuItem}`);
        for (const ing of menuItem.ingredients) {
          if (!ing.ingredient) continue;
          const requiredQty = ing.quantity * item.quantity;
          const ingredient = await Ingredient.findById(ing.ingredient._id);
          if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${ing.ingredient._id}`);
          if (ingredient.stock < requiredQty) {
            throw new Error(`Nguyên liệu ${ingredient.name} không đủ...`);
          }
          ingredient.stock -= requiredQty;
          await ingredient.save();
        }
      }
    }

    order.status = 'confirmed';
    order.staff = req.user._id;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrders, getOrderById, getPendingOrders, confirmOrder };