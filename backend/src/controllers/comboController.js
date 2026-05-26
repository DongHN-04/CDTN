const Combo = require('../models/Combo');
const Order = require('../models/Order');
const { attachComboAvailability } = require('../utils/availability');

const comboPopulate = {
  path: 'items.menuItem',
  select: 'name price image isActive isDeleted ingredients',
  populate: { path: 'ingredients.ingredient', select: 'stock unit name isActive isDeleted' },
};

const attachSalesCount = async (combos) => {
  const sales = await Order.aggregate([
    { $match: { status: { $in: ['confirmed', 'delivering', 'completed'] }, paymentStatus: 'paid' } },
    { $unwind: '$items' },
    { $match: { 'items.comboId': { $ne: null } } },
    {
      $group: {
        _id: '$items.comboId',
        soldQuantity: { $sum: '$items.quantity' },
      },
    },
  ]);

  const salesMap = new Map(sales.map(item => [String(item._id), item.soldQuantity]));
  return combos.map(combo => {
    const data = combo.toObject ? combo.toObject() : combo;
    return {
      ...attachComboAvailability(data),
      soldQuantity: salesMap.get(String(data._id)) || 0,
    };
  });
};

// @desc    Lấy tất cả combo
// @route   GET /api/combos
const getCombos = async (req, res) => {
  try {
    // Populate thêm ảnh để frontend có đủ dữ liệu hiển thị thành phần combo.
    const combos = await Combo.find({ isDeleted: { $ne: true } }).populate(comboPopulate);
    res.json(await attachSalesCount(combos));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Tạo combo mới
// @route   POST /api/combos
const createCombo = async (req, res) => {
  try {
    const combo = await Combo.create(req.body);
    const populated = await Combo.findById(combo._id).populate(comboPopulate);
    res.status(201).json(attachComboAvailability(populated));
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
};

// @desc    Cập nhật combo
// @route   PUT /api/combos/:id
const updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    }).populate(comboPopulate);
    if (!combo) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(attachComboAvailability(combo));
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại' });
  }
};

// @desc    Xóa combo
// @route   DELETE /api/combos/:id
const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) return res.status(404).json({ message: 'Không tìm thấy' });

    const orderCount = await Order.countDocuments({ 'items.comboId': combo._id });
    if (orderCount > 0) {
      combo.isActive = false;
      combo.isDeleted = true;
      await combo.save();
      return res.json({
        message: 'Combo đã phát sinh đơn hàng nên đã được ngừng bán thay vì xóa vĩnh viễn',
        mode: 'soft-deleted',
      });
    }

    await combo.deleteOne();
    res.json({ message: 'Đã xóa', mode: 'hard-deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getCombos, createCombo, updateCombo, deleteCombo };
