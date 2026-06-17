const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Combo = require('../models/Combo');
const Promotion = require('../models/Promotion');
const Banner = require('../models/Banner');
const Customer = require('../models/Customer');
const User = require('../models/User');
const {
  isMenuItemAvailable,
  attachComboAvailability,
} = require('../utils/availability');
const {
  collectOrderDetails,
  checkStockAvailability,
} = require('./orderController');

const hasSellableComboItems = (combo) => (
  (combo.items || []).every(comboItem => (
    comboItem.menuItem &&
    comboItem.menuItem.isActive !== false &&
    comboItem.menuItem.isDeleted !== true
  ))
);

const buildInventoryRequirementSnapshot = (requirements = []) => requirements.map((requirement) => ({
  ingredient: requirement.ingredientId || requirement.ingredient,
  name: requirement.name || '',
  unit: requirement.unit || '',
  requiredQty: requirement.requiredQty,
}));

const getCustomerOrderMatchFilter = (user) => {
  const filters = [];
  if (user?._id) filters.push({ customerUser: user._id });
  if (user?.email) filters.push({ 'customer.email': user.email.toLowerCase() });
  if (user?.phone) filters.push({ 'customer.phone': user.phone });
  return filters.length ? { $or: filters } : null;
};

const normalizePromoCode = (value = '') => String(value).trim().toUpperCase();

const serializeSavedPromotion = (item = {}) => ({
  _id: item.promotion?._id || item.promotion || item._id,
  promotion: item.promotion?._id || item.promotion,
  name: item.promotion?.name || item.name || '',
  description: item.promotion?.description || item.description || '',
  type: item.promotion?.type || item.type || 'fixed',
  value: item.promotion?.value ?? item.value ?? 0,
  minOrderValue: item.promotion?.minOrderValue ?? item.minOrderValue ?? 0,
  startDate: item.promotion?.startDate || item.startDate,
  endDate: item.promotion?.endDate || item.endDate,
  claimedAt: item.claimedAt,
  usedAt: item.usedAt,
});

const getUsableSavedPromotions = (user) => {
  const now = new Date();
  return (user.savedPromotions || [])
    .filter(item => !item.usedAt)
    .filter(item => !item.endDate || new Date(item.endDate) >= now)
    .map(serializeSavedPromotion);
};


// @desc    Lấy thực đơn công khai
// @route   GET /api/public/menu
// @access  Public
const getMenu = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isActive: { $ne: false }, isDeleted: { $ne: true } })
      .populate('ingredients.ingredient', 'stock isActive isDeleted');

    // Tính toán lượt bán động từ đơn hàng đã thanh toán
    const SOLD_ORDER_STATUSES = ['confirmed', 'delivering', 'completed'];
    const soldCounts = new Map();
    const orders = await Order.find({
      status: { $in: SOLD_ORDER_STATUSES },
      paymentStatus: 'paid',
    }).populate('items.comboId', 'items');

    orders.forEach(order => {
      (order.items || []).forEach(orderItem => {
        if (orderItem.menuItem) {
          const key = orderItem.menuItem.toString();
          soldCounts.set(key, (soldCounts.get(key) || 0) + Number(orderItem.quantity || 0));
          return;
        }

        (orderItem.comboId?.items || []).forEach(comboItem => {
          if (!comboItem.menuItem) return;
          const key = comboItem.menuItem.toString();
          const quantity = Number(comboItem.quantity || 0) * Number(orderItem.quantity || 0);
          soldCounts.set(key, (soldCounts.get(key) || 0) + quantity);
        });
      });
    });

    const publicMenu = menuItems.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      description: item.description,
      category: item.category,
      image: item.image,
      isActive: item.isActive,
      // Frontend dung co nay de khoa nut dat mon thay vi hard-code theo ten mon.
      isAvailable: isMenuItemAvailable(item),
      soldCount: soldCounts.get(item._id.toString()) || 0,
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
    const { customer, items, tableNumber, notes, paymentMethod, promoCode } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    const { subtotal, orderItems, requirements } = await collectOrderDetails(items);
    // Khach dat hang chua tru kho ngay, nhung van phai chan neu tong nguyen lieu hien tai không đủ.
    await checkStockAvailability(requirements);


    // Don VNPay phai luu la qr ngay tu dau de staff khong the xac nhan nhu don the chua thanh toan.
    let dbPaymentMethod = 'cash';
    if (paymentMethod === 'vnpay') dbPaymentMethod = 'qr';

    let orderDiscount = 0;
    let appliedPromoCode = '';
    let savedPromotionIndex = -1;
    const deliveryFee = customer?.address ? 15000 : 0;
    const discountBase = subtotal + deliveryFee;
    const loggedInCustomer = req.user?.role === 'customer' ? req.user : null;

    // Luôn tính lại khuyến mãi ở backend để khách không thể tự sửa số tiền giảm trên trình duyệt.
    if (promoCode) {
      if (!loggedInCustomer) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập tài khoản khách hàng để dùng mã đã lưu' });
      }

      const now = new Date();
      const promotion = await Promotion.findOne({
        name: new RegExp(`^${promoCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        type: { $in: ['percent', 'fixed'] },
        isDeleted: { $ne: true },
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      if (!promotion) {
        return res.status(400).json({ message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' });
      }

      savedPromotionIndex = (loggedInCustomer.savedPromotions || []).findIndex(item => (
        !item.usedAt &&
        (
          String(item.promotion || '') === String(promotion._id) ||
          normalizePromoCode(item.name) === normalizePromoCode(promotion.name)
        )
      ));

      if (savedPromotionIndex < 0) {
        return res.status(400).json({ message: 'Mã khuyến mãi chưa được lưu trong hồ sơ hoặc đã được sử dụng' });
      }

      if (discountBase < promotion.minOrderValue) {
        return res.status(400).json({
          message: `Đơn hàng cần tối thiểu ${promotion.minOrderValue.toLocaleString('vi-VN')}VNĐ để dùng mã này`,
        });
      }

      if (promotion.type === 'percent') {
        orderDiscount = Math.round(discountBase * (promotion.value / 100));
      } else if (promotion.type === 'fixed') {
        orderDiscount = promotion.value;
      }

      orderDiscount = Math.min(orderDiscount, discountBase);
      appliedPromoCode = promotion.name;
    }

    const orderCustomer = {
      ...(customer || { name: 'Khách lẻ', phone: '', address: '' }),
      email: loggedInCustomer?.email || customer?.email || '',
    };

    const finalTotal = Math.max(0, discountBase - orderDiscount);

    const order = await Order.create({
      customer: orderCustomer,
      customerUser: loggedInCustomer?._id,
      items: orderItems,
      inventoryRequirements: buildInventoryRequirementSnapshot(requirements),
      subtotal,
      deliveryFee,
      discount: orderDiscount,
      promoCode: appliedPromoCode,
      total: finalTotal,
      paymentMethod: dbPaymentMethod,
      tableNumber: tableNumber || '',
      notes: notes || '',
      isCustomerOrder: true,
      status: 'pending'
    });

    if (loggedInCustomer && savedPromotionIndex >= 0) {
      loggedInCustomer.savedPromotions[savedPromotionIndex].usedAt = new Date();
      loggedInCustomer.savedPromotions[savedPromotionIndex].order = order._id;
      await loggedInCustomer.save();
    }

    const customerPhone = orderCustomer?.phone?.trim();
    const customerEmail = orderCustomer?.email?.trim().toLowerCase();
    if (orderCustomer?.name && (customerPhone || customerEmail)) {
      const existingCustomer = await Customer.findOne({
        isDeleted: { $ne: true },
        $or: [
          ...(customerEmail ? [{ email: customerEmail }] : []),
          ...(customerPhone ? [{ phone: customerPhone }] : []),
        ],
      });

      if (!existingCustomer) {
        await Customer.create({
          name: orderCustomer.name,
          phone: customerPhone || '',
          email: customerEmail || '',
          type: 'Thường',
          notes: '',
          isActive: true,
          isDeleted: false,
        });
      } else if (loggedInCustomer && customerEmail && existingCustomer.email?.toLowerCase() === customerEmail) {
        existingCustomer.name = orderCustomer.name || existingCustomer.name;
        existingCustomer.phone = customerPhone || existingCustomer.phone;
        await existingCustomer.save();
      }
    }

    if (false && customer?.name && (customerPhone || customerEmail)) {
      const filter = customerEmail ? { email: customerEmail } : { phone: customerPhone };
      await Customer.findOneAndUpdate(
        filter,
        {
          $set: {
            name: customer.name,
            phone: customerPhone || '',
            email: customerEmail || '',
          },
          $setOnInsert: {
            type: 'Thường',
            notes: '',
          },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lấy danh sách combo công khai
// @route   GET /api/public/combos
// @access  Public
const getMyOrders = async (req, res) => {
  try {
    const filter = getCustomerOrderMatchFilter(req.user);
    if (!filter) return res.json([]);

    const orders = await Order.find({
      ...filter,
      isCustomerOrder: true,
    }).sort('-createdAt').limit(20);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đơn hàng của bạn' });
  }
};

const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find({ isActive: true, isDeleted: { $ne: true } }).populate({
      path: 'items.menuItem',
      select: 'name price image isActive isDeleted ingredients',
      populate: { path: 'ingredients.ingredient', select: 'stock unit name isActive isDeleted' },
    });
    res.json(combos.filter(hasSellableComboItems).map(attachComboAvailability));
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
      type: { $in: ['percent', 'fixed'] },
      isDeleted: { $ne: true },
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy mã khuyến mãi khách đã lưu (tất cả các mã bao gồm đã dùng/hết hạn)
// @route   GET /api/public/my-promotions
// @access  Customer
const getMyPromotions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedPromotions.promotion');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json((user.savedPromotions || []).map(serializeSavedPromotion));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy mã đã lưu' });
  }
};

// @desc    Lưu mã khuyến mãi vào hồ sơ khách hàng
// @route   POST /api/public/promotions/:id/claim
// @access  Customer
const claimPromotion = async (req, res) => {
  try {
    const now = new Date();
    const promotion = await Promotion.findOne({
      _id: req.params.id,
      type: { $in: ['percent', 'fixed'] },
      isDeleted: { $ne: true },
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Mã khuyến mãi không tồn tại hoặc đã hết hạn' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const alreadyClaimed = (user.savedPromotions || []).some(item => (
      String(item.promotion || '') === String(promotion._id) ||
      normalizePromoCode(item.name) === normalizePromoCode(promotion.name)
    ));

    if (alreadyClaimed) {
      return res.status(400).json({ message: 'Bạn đã lấy mã khuyến mãi này rồi' });
    }

    user.savedPromotions.push({
      promotion: promotion._id,
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      value: promotion.value,
      minOrderValue: promotion.minOrderValue || 0,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      claimedAt: new Date(),
    });
    await user.save();

    const updatedUser = await User.findById(req.user._id).populate('savedPromotions.promotion');
    res.status(201).json((updatedUser.savedPromotions || []).map(serializeSavedPromotion));
  } catch (error) {
    res.status(500).json({ message: 'Không thể lưu mã khuyến mãi' });
  }
};

// @desc    Lấy dữ liệu trang chủ (menu + combos + promotions gộp)
// @route   GET /api/public/homepage
// @access  Public
const getHomepageData = async (req, res) => {
  try {
    const now = new Date();

    const [menuItems, combos, promotions, banners] = await Promise.all([
      MenuItem.find({ isActive: { $ne: false }, isDeleted: { $ne: true } }),
      Combo.find({ isActive: true, isDeleted: { $ne: true } }).populate({
        path: 'items.menuItem',
        select: 'name price image isActive isDeleted ingredients',
        populate: { path: 'ingredients.ingredient', select: 'stock unit name isActive isDeleted' },
      }),
      Promotion.find({
        type: { $in: ['percent', 'fixed'] },
        isDeleted: { $ne: true },
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
      Banner.find({}),
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
      combos: combos.filter(hasSellableComboItems).map(attachComboAvailability),
      promotions,
      banners,
      totalMenuItems: menuItems.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getMenu,
  createOrder,
  getMyOrders,
  getCombos,
  getPromotions,
  getMyPromotions,
  claimPromotion,
  getHomepageData,
};
