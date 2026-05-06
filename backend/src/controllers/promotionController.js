const Promotion = require('../models/Promotion');

// @desc    Lấy tất cả khuyến mãi
// @route   GET /api/promotions
const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({});
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Tạo khuyến mãi mới
// @route   POST /api/promotions
const createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json(promotion);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
};

// @desc    Cập nhật khuyến mãi
// @route   PUT /api/promotions/:id
const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!promotion) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(promotion);
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại' });
  }
};

// @desc    Xóa khuyến mãi
// @route   DELETE /api/promotions/:id
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getPromotions, createPromotion, updatePromotion, deletePromotion };