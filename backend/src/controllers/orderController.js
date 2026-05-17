const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const Combo = require('../models/Combo');
const Promotion = require('../models/Promotion');

const addIngredientRequirement = (requirements, ingredientDoc, quantity) => {
  if (!ingredientDoc || quantity <= 0) return;

  const key = ingredientDoc._id.toString();
  const current = requirements.get(key);

  if (current) {
    current.requiredQty += quantity;
    return;
  }

  requirements.set(key, {
    ingredientId: ingredientDoc._id,
    name: ingredientDoc.name,
    unit: ingredientDoc.unit,
    requiredQty: quantity,
  });
};

const collectOrderDetails = async (items, session = null) => {
  let subtotal = 0;
  const orderItems = [];
  const requirements = new Map();

  for (const item of items) {
    if (item.comboId) {
      const combo = await Combo.findById(item.comboId).populate('items.menuItem').session(session);
      if (!combo) throw new Error(`Combo khong ton tai: ${item.comboId}`);

      for (const comboItem of combo.items) {
        if (!comboItem.menuItem) {
          throw new Error(`Combo ${combo.name} co mon khong ton tai`);
        }

        const menuItem = await MenuItem.findById(comboItem.menuItem._id).populate('ingredients.ingredient').session(session);
        if (!menuItem) throw new Error(`Mon trong combo khong ton tai: ${comboItem.menuItem._id}`);

        const menuQuantity = comboItem.quantity * item.quantity;
        for (const ing of menuItem.ingredients) {
          addIngredientRequirement(requirements, ing.ingredient, ing.quantity * menuQuantity);
        }
      }

      orderItems.push({
        comboId: combo._id,
        name: combo.name,
        price: combo.price,
        quantity: item.quantity,
      });
      subtotal += combo.price * item.quantity;
      continue;
    }

    if (item.menuItem) {
      const menuItem = await MenuItem.findById(item.menuItem).populate('ingredients.ingredient').session(session);
      if (!menuItem) throw new Error(`Mon an khong ton tai: ${item.menuItem}`);

      for (const ing of menuItem.ingredients) {
        addIngredientRequirement(requirements, ing.ingredient, ing.quantity * item.quantity);
      }

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
      });
      subtotal += menuItem.price * item.quantity;
      continue;
    }

    throw new Error('Item khong hop le: thieu menuItem hoac comboId');
  }

  return {
    subtotal,
    orderItems,
    requirements: Array.from(requirements.values()),
  };
};

const checkAndDecreaseStock = async (requirements, session = null) => {
  // Dung dieu kien stock >= requiredQty trong update de tranh 2 don cung tru qua ton kho.
  for (const requirement of requirements) {
    const ingredient = await Ingredient.findById(requirement.ingredientId).session(session);
    if (!ingredient) {
      throw new Error(`Nguyen lieu khong ton tai: ${requirement.ingredientId}`);
    }

    if (ingredient.stock < requirement.requiredQty) {
      throw new Error(
        `Nguyen lieu ${ingredient.name} khong du. Can ${requirement.requiredQty} ${ingredient.unit}, hien co ${ingredient.stock}`
      );
    }

    const result = await Ingredient.updateOne(
      { _id: requirement.ingredientId, stock: { $gte: requirement.requiredQty } },
      { $inc: { stock: -requirement.requiredQty } },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new Error(`Nguyen lieu ${ingredient.name} khong du de tru kho`);
    }
  }
};

const getBestPromotionDiscount = async (subtotal) => {
  const activePromotions = await Promotion.find({
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    minOrderValue: { $lte: subtotal },
  });

  let bestDiscount = 0;

  for (const promo of activePromotions) {
    if (promo.type === 'percent') {
      bestDiscount = Math.max(bestDiscount, subtotal * (promo.value / 100));
    } else if (promo.type === 'fixed') {
      bestDiscount = Math.max(bestDiscount, promo.value);
    }
  }

  return Math.min(bestDiscount, subtotal);
};

// @desc    Tao don hang moi
// @route   POST /api/orders
// @access  Private (Admin, Staff)
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let createdOrderId;

    await session.withTransaction(async () => {
      const { customer, items, discount, paymentMethod } = req.body;
      const staff = req.user._id;

      const { subtotal, orderItems, requirements } = await collectOrderDetails(items, session);
      await checkAndDecreaseStock(requirements, session);

      const bestDiscount = await getBestPromotionDiscount(subtotal);
      const clientDiscount = discount || 0;
      const finalDiscount = Math.min(Math.max(clientDiscount, bestDiscount), subtotal);
      const total = subtotal - finalDiscount;

      const [order] = await Order.create([{
        customer: customer || { name: 'Khach le', phone: '' },
        staff,
        items: orderItems,
        subtotal,
        discount: finalDiscount,
        total,
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: 'paid',
        status: 'confirmed',
      }], { session });

      createdOrderId = order._id;
    });

    const populatedOrder = await Order.findById(createdOrderId)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Loi tao don:', error.message);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Lay danh sach hoa don
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
    res.status(500).json({ message: 'Loi server' });
  }
};

// @desc    Lay chi tiet mot hoa don
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');
    if (!order) return res.status(404).json({ message: 'Khong tim thay hoa don' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Loi server' });
  }
};

// @desc    Lay danh sach don hang tu khach dang cho xac nhan
// @route   GET /api/orders/pending
// @access  Private (Admin, Staff)
const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isCustomerOrder: true, status: 'pending' })
      .populate('items.menuItem', 'name price')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Loi server' });
  }
};

// @desc    Xac nhan don hang tu khach va tru kho
// @route   PUT /api/orders/:id/confirm
// @access  Private (Admin, Staff)
const confirmOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let confirmedOrderId;

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new Error('Khong tim thay don hang');
      if (order.status !== 'pending') {
        throw new Error('Don hang khong o trang thai cho xac nhan');
      }

      const items = order.items.map((item) => ({
        menuItem: item.menuItem,
        comboId: item.comboId,
        quantity: item.quantity,
      }));
      const { requirements } = await collectOrderDetails(items, session);
      await checkAndDecreaseStock(requirements, session);

      order.status = 'confirmed';
      order.staff = req.user._id;
      if (order.paymentMethod === 'cash' || order.paymentMethod === 'card') {
        // Don tien mat/the duoc xem la da thu khi nhan vien xac nhan don.
        order.paymentStatus = 'paid';
      }
      await order.save({ session });
      confirmedOrderId = order._id;
    });

    const populatedOrder = await Order.findById(confirmedOrderId)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    res.json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = { createOrder, getOrders, getOrderById, getPendingOrders, confirmOrder };
