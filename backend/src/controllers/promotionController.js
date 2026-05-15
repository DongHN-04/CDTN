const Promotion = require('../models/Promotion');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');

const getPromotions = asyncHandler(async (req, res) => {
  const promotions = await Promotion.find({}).sort({ createdAt: -1 });
  res.json(promotions);
});

const createPromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.create(req.body);
  res.status(201).json(promotion);
});

const updatePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) {
    throw new ApiError(404, 'Không tìm thấy khuyến mãi');
  }

  Object.assign(promotion, req.body);
  await promotion.save();

  res.json(promotion);
});

const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findByIdAndDelete(req.params.id);

  if (!promotion) {
    throw new ApiError(404, 'Không tìm thấy khuyến mãi');
  }

  res.json({ message: 'Đã xóa khuyến mãi' });
});

module.exports = { getPromotions, createPromotion, updatePromotion, deletePromotion };
