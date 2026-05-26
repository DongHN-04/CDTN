const Promotion = require('../models/Promotion');
const Banner = require('../models/Banner');
const Order = require('../models/Order');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');

const getPromotions = asyncHandler(async (req, res) => {
  const promotions = await Promotion.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
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
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new ApiError(404, 'Không tìm thấy khuyến mãi');
  }

  const orderCount = await Order.countDocuments({ promoCode: promotion.name });
  if (orderCount > 0) {
    promotion.isActive = false;
    promotion.isDeleted = true;
    await promotion.save();
    return res.json({
      message: 'Khuyến mãi đã được dùng trong đơn hàng nên đã được tạm tắt thay vì xóa vĩnh viễn',
      mode: 'soft-deleted',
    });
  }

  await promotion.deleteOne();
  res.json({ message: 'Đã xóa khuyến mãi', mode: 'hard-deleted' });
});

// @desc    Lấy danh sách banner
// @route   GET /api/promotions/banners
// @access  Private (admin, staff)
const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({}).sort({ createdAt: -1 });
  res.json(banners);
});

// @desc    Tạo banner mới
// @route   POST /api/promotions/banners
// @access  Private (admin)
const createBanner = asyncHandler(async (req, res) => {
  const { image, title } = req.body;
  if (!image) {
    throw new ApiError(400, 'Hình ảnh banner là bắt buộc');
  }

  // Nếu đây là banner đầu tiên, tự động kích hoạt nó
  const count = await Banner.countDocuments({});
  const isActive = count === 0;

  const banner = await Banner.create({ image, title, isActive });
  res.status(201).json(banner);
});

// @desc    Xóa banner
// @route   DELETE /api/promotions/banners/:id
// @access  Private (admin)
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) {
    throw new ApiError(404, 'Không tìm thấy banner');
  }

  // Nếu xóa banner đang kích hoạt, kích hoạt banner khác nếu có
  if (banner.isActive) {
    const anotherBanner = await Banner.findOne({});
    if (anotherBanner) {
      anotherBanner.isActive = true;
      await anotherBanner.save();
    }
  }

  res.json({ message: 'Đã xóa banner thành công' });
});

// @desc    Đặt banner kích hoạt
// @route   PUT /api/promotions/banners/:id/active
// @access  Private (admin)
const setActiveBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    throw new ApiError(404, 'Không tìm thấy banner');
  }

  // Tắt tất cả các banner khác
  await Banner.updateMany({ _id: { $ne: banner._id } }, { isActive: false });

  // Bật banner này
  banner.isActive = true;
  await banner.save();

  res.json(banner);
});

module.exports = {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getBanners,
  createBanner,
  deleteBanner,
  setActiveBanner,
};
