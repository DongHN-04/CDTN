export const normalizePromoCode = (code = '') => code.trim().toUpperCase();

export const isPromotionActive = (promotion, now = new Date()) => {
  if (!promotion?.isActive) return false;
  return new Date(promotion.startDate) <= now && new Date(promotion.endDate) >= now;
};

export const calculatePromotionDiscount = (promotion, subtotal) => {
  if (!promotion || subtotal < (promotion.minOrderValue || 0)) return 0;

  // Chỉ hỗ trợ giảm phần trăm và giảm tiền cố định cho giỏ hàng khách.
  const rawDiscount = promotion.type === 'percent'
    ? Math.round(subtotal * (promotion.value / 100))
    : promotion.type === 'fixed'
      ? promotion.value
      : 0;

  return Math.min(Math.max(rawDiscount, 0), subtotal);
};

export const findUsablePromotion = (promotions, code, subtotal) => {
  const normalizedCode = normalizePromoCode(code);
  const promotion = promotions.find(item => normalizePromoCode(item.name) === normalizedCode);

  if (!promotion || !isPromotionActive(promotion)) {
    return { promotion: null, discount: 0, error: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.' };
  }

  if (subtotal < (promotion.minOrderValue || 0)) {
    return {
      promotion: null,
      discount: 0,
      error: `Đơn hàng cần tối thiểu ${(promotion.minOrderValue || 0).toLocaleString('vi-VN')} VNĐ để dùng mã này.`,
    };
  }

  return {
    promotion,
    discount: calculatePromotionDiscount(promotion, subtotal),
    error: '',
  };
};
