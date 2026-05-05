const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const mongoose = require('mongoose');

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private (Admin, Staff)
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customer, items, discount, paymentMethod } = req.body;
    const staff = req.user._id;

    // 1. Duyệt từng món trong đơn để kiểm tra và trừ nguyên liệu
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem).populate('ingredients.ingredient');
      if (!menuItem) {
        throw new Error(`Món ăn không tồn tại: ${item.menuItem}`);
      }

      // Lấy danh sách nguyên liệu cần cho món này
      for (const ing of menuItem.ingredients) {
        const requiredQty = ing.quantity * item.quantity; // tổng lượng nguyên liệu cần
        const ingredient = await Ingredient.findById(ing.ingredient._id).session(session);
        if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${ing.ingredient._id}`);

        if (ingredient.stock < requiredQty) {
          throw new Error(`Nguyên liệu ${ingredient.name} không đủ. Cần ${requiredQty} ${ingredient.unit}, hiện có ${ingredient.stock}`);
        }
        ingredient.stock -= requiredQty;
        await ingredient.save({ session });
      }
    }

    // 2. Tính toán giá
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      const price = menuItem.price;
      const totalItem = price * item.quantity;
      subtotal += totalItem;
      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: price
      });
    }

    const discountAmount = discount || 0;
    const total = subtotal - discountAmount;

    // 3. Tạo order
    const order = await Order.create([{
      customer: customer || { name: 'Khách lẻ', phone: '' },
      staff,
      items: orderItems,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod: paymentMethod || 'cash'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Lấy order vừa tạo kèm thông tin liên quan
    const populatedOrder = await Order.findById(order[0]._id)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    res.status(201).json(populatedOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lấy danh sách hóa đơn
// @route   GET /api/orders
// @access  Private (Admin, Staff)
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
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

module.exports = { createOrder, getOrders, getOrderById };