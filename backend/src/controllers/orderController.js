const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const Combo = require('../models/Combo');
const Promotion = require('../models/Promotion');
const { runWithOptionalTransaction } = require('../utils/transaction');

const PAYMENT_RESERVATION_MINUTES = Number(process.env.PAYMENT_RESERVATION_MINUTES || 30);

const buildStaffSnapshot = (user) => ({
  name: user?.name || '',
  email: user?.email || '',
  role: user?.role || '',
  position: user?.position || '',
  phone: user?.phone || '',
});

const buildInventoryRequirementSnapshot = (requirements = []) => requirements.map((requirement) => ({
  ingredient: requirement.ingredientId || requirement.ingredient,
  name: requirement.name || '',
  unit: requirement.unit || '',
  requiredQty: requirement.requiredQty,
}));

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

const collectOrderDetails = async (items, session = null, options = {}) => {
  const { allowUnavailable = false } = options;
  let subtotal = 0;
  const orderItems = [];
  const requirements = new Map();

  for (const item of items) {
    if (item.comboId) {
      const combo = await Combo.findById(item.comboId).populate('items.menuItem').session(session);
      if (!combo) throw new Error(`Combo khong ton tai: ${item.comboId}`);
      if (!allowUnavailable && (combo.isActive === false || combo.isDeleted === true)) throw new Error(`Combo da ngung ban: ${combo.name}`);

      for (const comboItem of combo.items) {
        if (!comboItem.menuItem) {
          throw new Error(`Combo ${combo.name} co mon khong ton tai`);
        }

        const menuItem = await MenuItem.findById(comboItem.menuItem._id).populate('ingredients.ingredient').session(session);
        if (!menuItem) throw new Error(`Mon trong combo khong ton tai: ${comboItem.menuItem._id}`);
        if (!allowUnavailable && (menuItem.isActive === false || menuItem.isDeleted === true)) {
          throw new Error(`Mon trong combo da ngung ban: ${menuItem.name}`);
        }

        const menuQuantity = comboItem.quantity * item.quantity;
        for (const ing of menuItem.ingredients) {
          addIngredientRequirement(requirements, ing.ingredient, ing.quantity * menuQuantity);
        }
      }

      orderItems.push({
        comboId: combo._id,
        name: combo.name,
        image: combo.image || '',
        category: 'Combo',
        price: combo.price,
        quantity: item.quantity,
      });
      subtotal += combo.price * item.quantity;
      continue;
    }

    if (item.menuItem) {
      const menuItem = await MenuItem.findById(item.menuItem).populate('ingredients.ingredient').session(session);
      if (!menuItem) throw new Error(`Mon an khong ton tai: ${item.menuItem}`);
      if (!allowUnavailable && (menuItem.isActive === false || menuItem.isDeleted === true)) {
        throw new Error(`Mon an da ngung ban: ${menuItem.name}`);
      }

      for (const ing of menuItem.ingredients) {
        addIngredientRequirement(requirements, ing.ingredient, ing.quantity * item.quantity);
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        image: menuItem.image || '',
        category: menuItem.category || '',
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

    if (ingredient.isActive === false || ingredient.isDeleted === true) {
      throw new Error(`Nguyen lieu ${ingredient.name} da ngung su dung`);
    }

    if (ingredient.stock < requirement.requiredQty) {
      throw new Error(
        `Nguyen lieu ${ingredient.name} khong du. Can ${requirement.requiredQty} ${ingredient.unit}, hien co ${ingredient.stock}`
      );
    }

    const result = await Ingredient.updateOne(
      { _id: requirement.ingredientId, isActive: { $ne: false }, isDeleted: { $ne: true }, stock: { $gte: requirement.requiredQty } },
      { $inc: { stock: -requirement.requiredQty } },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new Error(`Nguyen lieu ${ingredient.name} khong du de tru kho`);
    }
  }
};

const checkStockAvailability = async (requirements, session = null) => {
  for (const requirement of requirements) {
    const ingredient = await Ingredient.findById(requirement.ingredientId).session(session);
    if (!ingredient) {
      throw new Error(`Nguyen lieu khong ton tai: ${requirement.ingredientId}`);
    }

    if (ingredient.isActive === false || ingredient.isDeleted === true) {
      throw new Error(`Nguyen lieu ${ingredient.name} da ngung su dung`);
    }

    if (ingredient.stock < requirement.requiredQty) {
      throw new Error(
        `Nguyen lieu ${ingredient.name} khong du. Can ${requirement.requiredQty} ${ingredient.unit}, hien co ${ingredient.stock}`
      );
    }
  }
};

const restoreStock = async (requirements, session = null) => {
  for (const requirement of requirements) {
    await Ingredient.updateOne(
      { _id: requirement.ingredientId },
      { $inc: { stock: requirement.requiredQty } },
      { session }
    );
  }
};

const calculatePromotionDiscount = (promotion, subtotal) => {
  if (!promotion || subtotal < (promotion.minOrderValue || 0)) return 0;

  if (promotion.type === 'percent') {
    return Math.round(subtotal * (promotion.value / 100));
  }

  if (promotion.type === 'fixed') {
    return promotion.value;
  }

  return 0;
};

const getBestPromotionDiscount = async (subtotal, session = null) => {
  const activePromotions = await Promotion.find({
    type: { $in: ['percent', 'fixed'] },
    isDeleted: { $ne: true },
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    minOrderValue: { $lte: subtotal },
  }).session(session);

  let bestDiscount = 0;

  for (const promo of activePromotions) {
    bestDiscount = Math.max(bestDiscount, calculatePromotionDiscount(promo, subtotal));
  }

  return Math.min(bestDiscount, subtotal);
};

const getPromotionDiscount = async (subtotal, promotionId, session = null) => {
  if (!promotionId) return getBestPromotionDiscount(subtotal, session);

  const promotion = await Promotion.findOne({
    _id: promotionId,
    type: { $in: ['percent', 'fixed'] },
    isDeleted: { $ne: true },
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    minOrderValue: { $lte: subtotal },
  }).session(session);

  if (!promotion) {
    throw new Error('Khuyen mai khong hop le hoac khong ap dung duoc cho don hang nay');
  }

  return Math.min(calculatePromotionDiscount(promotion, subtotal), subtotal);
};

const releaseReservedStockForOrder = async (order, session = null) => {
  if (!order || !order.inventoryDeducted || order.status !== 'pending') return;

  let requirements = (order.inventoryRequirements || []).map((requirement) => ({
    ingredientId: requirement.ingredient,
    name: requirement.name,
    unit: requirement.unit,
    requiredQty: requirement.requiredQty,
  })).filter(requirement => requirement.ingredientId && requirement.requiredQty > 0);

  if (requirements.length === 0) {
    const items = order.items.map((item) => ({
      menuItem: item.menuItem,
      comboId: item.comboId,
      quantity: item.quantity,
    }));
    const details = await collectOrderDetails(items, session, { allowUnavailable: true });
    requirements = details.requirements;
  }

  await restoreStock(requirements, session);

  order.inventoryDeducted = false;
};

const releaseExpiredPaymentReservations = async () => {
  const cutoff = new Date(Date.now() - PAYMENT_RESERVATION_MINUTES * 60 * 1000);
  const staleOrders = await Order.find({
    status: 'pending',
    paymentMethod: 'qr',
    paymentStatus: 'unpaid',
    inventoryDeducted: true,
    txnRef: { $ne: '' },
    updatedAt: { $lte: cutoff },
  });

  for (const staleOrder of staleOrders) {
    try {
      await runWithOptionalTransaction(async (session) => {
        const order = await Order.findById(staleOrder._id).session(session);
        if (
          !order ||
          order.status !== 'pending' ||
          order.paymentMethod !== 'qr' ||
          order.paymentStatus !== 'unpaid' ||
          !order.inventoryDeducted ||
          order.updatedAt > cutoff
        ) {
          return;
        }

        await releaseReservedStockForOrder(order, session);
        order.status = 'cancelled';
        order.paymentStatus = 'failed';
        order.txnRef = '';
        await order.save({ session });
      });
    } catch (error) {
      console.warn(`Khong the tu dong hoan kho don thanh toan qua han ${staleOrder._id}:`, error.message);
    }
  }
};

// @desc    Tao don hang moi
// @route   POST /api/orders
// @access  Private (Admin, Staff)
const createOrder = async (req, res) => {
  try {
    const createdOrderId = await runWithOptionalTransaction(async (session) => {
      const { customer, items, promotionId, paymentMethod } = req.body;
      const staff = req.user._id;

      const { subtotal, orderItems, requirements } = await collectOrderDetails(items, session);
      await checkAndDecreaseStock(requirements, session);

      const finalDiscount = await getPromotionDiscount(subtotal, promotionId, session);
      const total = subtotal - finalDiscount;

      const [order] = await Order.create([{
        customer: customer || { name: 'Khach le', phone: '' },
        staff,
        staffSnapshot: buildStaffSnapshot(req.user),
        items: orderItems,
        inventoryRequirements: buildInventoryRequirementSnapshot(requirements),
        subtotal,
        discount: finalDiscount,
        total,
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: 'paid',
        inventoryDeducted: true,
        status: 'completed',
      }], { session });

      return order._id;
    });

    const populatedOrder = await Order.findById(createdOrderId)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Loi tao don:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lay danh sach hoa don
// @route   GET /api/orders
// @access  Private (Admin, Staff)
const getOrders = async (req, res) => {
  try {
    await releaseExpiredPaymentReservations();

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
    console.error('Loi lay danh sach don hang:', error);
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
    console.error('Loi lay danh sach don hang dang cho:', error);
    res.status(500).json({ message: 'Loi server' });
  }
};

// @desc    Lay danh sach don hang tu khach dang cho xac nhan
// @route   GET /api/orders/pending
// @access  Private (Admin, Staff)
const getPendingOrders = async (req, res) => {
  try {
    await releaseExpiredPaymentReservations();

    const orders = await Order.find({ isCustomerOrder: true, status: 'pending' })
      .populate('items.menuItem', 'name price')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Loi server' });
  }
};

const preparePendingOrder = async (order, user, session = null) => {
  if (order.status !== 'pending') return;

  if (order.paymentMethod === 'qr' && order.paymentStatus !== 'paid') {
    throw new Error('Don hang QR chua thanh toan thanh cong');
  }

  if (!order.inventoryDeducted) {
    const items = order.items.map((item) => ({
      menuItem: item.menuItem,
      comboId: item.comboId,
      quantity: item.quantity,
    }));
    const { requirements } = await collectOrderDetails(items, session, { allowUnavailable: true });
    await checkAndDecreaseStock(requirements, session);
    order.inventoryDeducted = true;
    order.inventoryRequirements = buildInventoryRequirementSnapshot(requirements);
  }

  order.staff = user?._id || user;
  order.staffSnapshot = buildStaffSnapshot(user);
};

// @desc    Xac nhan don hang tu khach va tru kho
// @route   PUT /api/orders/:id/confirm
// @access  Private (Admin, Staff)
const confirmOrder = async (req, res) => {
  try {
    const confirmedOrderId = await runWithOptionalTransaction(async (session) => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new Error('Khong tim thay don hang');
      if (order.status !== 'pending') {
        throw new Error('Don hang khong o trang thai cho xac nhan');
      }

      await preparePendingOrder(order, req.user, session);
      order.status = 'confirmed';
      await order.save({ session });
      return order._id;
    });

    const populatedOrder = await Order.findById(confirmedOrderId)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    res.json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cap nhat trang thai don hang
// @route   PUT /api/orders/:id/status
// @access  Private (Admin, Staff)
const updateOrderStatus = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'];
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trang thai don hang khong hop le' });
    }

    const updatedOrderId = await runWithOptionalTransaction(async (session) => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new Error('Khong tim thay don hang');
      if (order.status === 'cancelled' || order.status === 'completed') {
        throw new Error('Don hang da ket thuc, khong the cap nhat');
      }

      if (status === 'pending') {
        throw new Error('Khong the dua don hang ve trang thai cho xac nhan');
      }

      if (status === 'cancelled') {
        if (order.paymentMethod === 'qr' && order.paymentStatus === 'paid') {
          throw new Error('Don hang VNPay da thanh toan can xu ly hoan tien truoc khi huy');
        }

        if (order.inventoryDeducted) {
          await releaseReservedStockForOrder(order, session);
        }
        order.status = 'cancelled';
        await order.save({ session });
        return order._id;
      }

      if (order.status === 'pending') {
        await preparePendingOrder(order, req.user, session);
      }

      if (!order.staff || !order.staffSnapshot?.name) {
        order.staff = req.user._id;
        order.staffSnapshot = buildStaffSnapshot(req.user);
      }

      order.status = status;
      if (status === 'completed' && (order.paymentMethod === 'cash' || order.paymentMethod === 'card')) {
        order.paymentStatus = 'paid';
      }
      await order.save({ session });
      return order._id;
    });

    const populatedOrder = await Order.findById(updatedOrderId)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    res.json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getPendingOrders,
  confirmOrder,
  updateOrderStatus,
  releaseExpiredPaymentReservations,
  collectOrderDetails,
  checkStockAvailability,
  checkAndDecreaseStock,
  restoreStock,
};
