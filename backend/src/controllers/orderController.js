const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const Combo = require('../models/Combo');
const Promotion = require('../models/Promotion');
const Shift = require('../models/Shift');
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

const getActiveShiftForUser = async (userId, at = new Date(), session = null) => {
  if (!userId) return null;
  return Shift.findOne({
    staff: userId,
    status: 'open',
    isDeleted: { $ne: true },
    startTime: { $lte: at },
    endTime: { $gte: at },
  }).session(session);
};

const requireActiveShiftForUser = async (user, session = null) => {
  const activeShift = await getActiveShiftForUser(user?._id, new Date(), session);
  if (!activeShift) {
    throw new Error('Bạn không nằm trong ca đang mở nên không thể xử lý đơn hàng');
  }
  return activeShift;
};

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
      if (!combo) throw new Error(`Combo không tồn tại: ${item.comboId}`);
      if (!allowUnavailable && (combo.isActive === false || combo.isDeleted === true)) throw new Error(`Combo da ngung ban: ${combo.name}`);

      for (const comboItem of combo.items) {
        if (!comboItem.menuItem) {
          throw new Error(`Combo ${combo.name} có món không tồn tại`);
        }

        const menuItem = await MenuItem.findById(comboItem.menuItem._id).populate('ingredients.ingredient').session(session);
        if (!menuItem) throw new Error(`Món trong combo không tồn tại: ${comboItem.menuItem._id}`);
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
      if (!menuItem) throw new Error(`Món ăn không tồn tại: ${item.menuItem}`);
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

    throw new Error('Dòng hàng không hợp lệ: thiếu món hoặc combo');
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
      throw new Error(`Nguyên liệu không tồn tại: ${requirement.ingredientId}`);
    }

    if (ingredient.isActive === false || ingredient.isDeleted === true) {
      throw new Error(`Nguyên liệu ${ingredient.name} da ngung su dung`);
    }

    if (ingredient.stock < requirement.requiredQty) {
      throw new Error(
        `Nguyên liệu ${ingredient.name} không đủ. Cần ${requirement.requiredQty} ${ingredient.unit}, hiện có ${ingredient.stock}`
      );
    }

    const result = await Ingredient.updateOne(
      { _id: requirement.ingredientId, isActive: { $ne: false }, isDeleted: { $ne: true }, stock: { $gte: requirement.requiredQty } },
      { $inc: { stock: -requirement.requiredQty } },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new Error(`Nguyên liệu ${ingredient.name} không đủ de tru kho`);
    }
  }
};

const checkStockAvailability = async (requirements, session = null) => {
  for (const requirement of requirements) {
    const ingredient = await Ingredient.findById(requirement.ingredientId).session(session);
    if (!ingredient) {
      throw new Error(`Nguyên liệu không tồn tại: ${requirement.ingredientId}`);
    }

    if (ingredient.isActive === false || ingredient.isDeleted === true) {
      throw new Error(`Nguyên liệu ${ingredient.name} da ngung su dung`);
    }

    if (ingredient.stock < requirement.requiredQty) {
      throw new Error(
        `Nguyên liệu ${ingredient.name} không đủ. Cần ${requirement.requiredQty} ${ingredient.unit}, hiện có ${ingredient.stock}`
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
    throw new Error('Khuyến mãi không hợp lệ hoặc không áp dụng được cho đơn hàng này');
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
    try {
      const items = order.items.map((item) => ({
        menuItem: item.menuItem,
        comboId: item.comboId,
        quantity: item.quantity,
      }));
      const details = await collectOrderDetails(items, session, { allowUnavailable: true });
      requirements = details.requirements;
    } catch (error) {
      console.warn(
        `Không thể dựng lại yêu cầu hoàn kho cho đơn ${order._id}; có thể món/combo đã bị xóa:`,
        error.message
      );
      requirements = [];
    }
  }

  if (requirements.length > 0) {
    await restoreStock(requirements, session);
  }

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
      console.warn(`Không thể tự động hoàn kho đơn thanh toán quá hạn ${staleOrder._id}:`, error.message);
    }
  }
};

const getAllowedNextStatuses = (order) => {
  if (!order) return [];
  if (order.status === 'pending') return ['confirmed', 'cancelled'];
  if (order.status === 'confirmed') {
    return order.isCustomerOrder ? ['delivering', 'cancelled'] : ['completed', 'cancelled'];
  }
  if (order.status === 'delivering') return ['completed', 'cancelled'];
  return [];
};

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private (Admin, Staff)
const buildOrderDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const createOrder = async (req, res) => {
  try {
    const createdOrderId = await runWithOptionalTransaction(async (session) => {
      const { customer, items, promotionId, paymentMethod } = req.body;
      await requireActiveShiftForUser(req.user, session);
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
        completedAt: new Date(),
      }], { session });

      return order._id;
    });

    const populatedOrder = await Order.findById(createdOrderId)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Lỗi tạo đơn:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lay danh sach hoa don
// @route   GET /api/orders
// @access  Private (Admin, Staff)
const getOrders = async (req, res) => {
  try {
    await releaseExpiredPaymentReservations();

    const { startDate, endDate, recent, limit } = req.query;
    if (recent === 'true') {
      const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const orders = await Order.find({})
        .populate('staff', 'name')
        .populate('items.menuItem', 'name price')
        .sort('-createdAt')
        .limit(safeLimit);
      return res.json(orders);
    }

    const { start, end } = buildOrderDateRange(startDate, endDate);
    const filter = { createdAt: { $gte: start, $lte: end } };
    const orders = await Order.find(filter)
      .populate('staff', 'name')
      .populate('items.menuItem', 'name price')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
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
    if (!order) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    res.json(order);
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng đang chờ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy danh sách đơn hàng từ khách đang chờ xác nhận
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
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const preparePendingOrder = async (order, user, session = null) => {
  if (order.status !== 'pending') return;

  if (order.paymentMethod === 'qr' && order.paymentStatus !== 'paid') {
    throw new Error('Đơn hàng QR chưa thanh toán thành công');
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

// @desc    Xác nhận đơn hàng từ khách và trừ kho
// @route   PUT /api/orders/:id/confirm
// @access  Private (Admin, Staff)
const confirmOrder = async (req, res) => {
  try {
    const confirmedOrderId = await runWithOptionalTransaction(async (session) => {
      await requireActiveShiftForUser(req.user, session);
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new Error('Không tìm thấy đơn hàng');
      if (order.status !== 'pending') {
        throw new Error('Đơn hàng không ở trạng thái chờ xác nhận');
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

// @desc    Cập nhật trạng thái đơn hàng
// @route   PUT /api/orders/:id/status
// @access  Private (Admin, Staff)
const updateOrderStatus = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'];
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
    }

    const updatedOrderId = await runWithOptionalTransaction(async (session) => {
      await requireActiveShiftForUser(req.user, session);
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new Error('Không tìm thấy đơn hàng');
      if (order.status === 'cancelled' || order.status === 'completed') {
        throw new Error('Đơn hàng đã kết thúc, không thể cập nhật');
      }

      if (status === 'pending') {
        throw new Error('Không thể đưa đơn hàng về trạng thái chờ xác nhận');
      }

      const allowedNextStatuses = getAllowedNextStatuses(order);
      if (!allowedNextStatuses.includes(status)) {
        throw new Error(`Không thể chuyển đơn hàng từ ${order.status} sang ${status}`);
      }

      if (status === 'cancelled') {
        if (order.paymentMethod === 'qr' && order.paymentStatus === 'paid') {
          throw new Error('Đơn hàng VNPay đã thanh toán cần xử lý hoàn tiền trước khi hủy');
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

      if (!order.staff || !order.staffSnapshot?.name || status === 'completed') {
        order.staff = req.user._id;
        order.staffSnapshot = buildStaffSnapshot(req.user);
      }

      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date();
      }
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
