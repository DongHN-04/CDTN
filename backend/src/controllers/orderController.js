const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const mongoose = require('mongoose');

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private (Admin, Staff)
const createOrder = async (req, res) => {
  try {
    const { customer, items, discount, paymentMethod } = req.body;
    const staff = req.user._id;

    console.log('Nhận được items:', JSON.stringify(items)); // debug

    // 1. Duyệt từng món, kiểm tra và trừ kho
    for (const item of items) {
      if (!item.menuItem) {
        throw new Error('Mỗi món phải có menuItem');
      }

      const menuItem = await MenuItem.findById(item.menuItem).populate('ingredients.ingredient');
      if (!menuItem) {
        throw new Error(`Món ăn không tồn tại: ${item.menuItem}`);
      }

      // Duyệt nguyên liệu
      for (const ing of menuItem.ingredients) {
        if (!ing.ingredient) continue; // bỏ qua nguyên liệu đã bị xóa
        const requiredQty = ing.quantity * item.quantity;
        const ingredient = await Ingredient.findById(ing.ingredient._id);
        if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${ing.ingredient._id}`);

        if (ingredient.stock < requiredQty) {
          throw new Error(
            `Nguyên liệu ${ingredient.name} không đủ. Cần ${requiredQty} ${ingredient.unit}, hiện có ${ingredient.stock}`
          );
        }

        ingredient.stock -= requiredQty;
        await ingredient.save(); // không dùng session
      }
    }

    // 2. Tính toán giá
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) throw new Error(`Món không tồn tại: ${item.menuItem}`);

      const price = menuItem.price;
      const totalItem = price * item.quantity;
      subtotal += totalItem;
      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: price,
      });
    }

    const discountAmount = discount || 0;
    const total = subtotal - discountAmount;

    // 3. Tạo đơn hàng
    const order = await Order.create({
      customer: customer || { name: 'Khách lẻ', phone: '' },
      staff,
      items: orderItems,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod: paymentMethod || 'cash',
    });

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
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
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

module.exports = { createOrder, getOrders, getOrderById };