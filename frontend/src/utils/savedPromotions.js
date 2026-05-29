export const normalizeSavedPromotions = (promotions = []) => {
  const now = new Date();
  return (Array.isArray(promotions) ? promotions : [])
    .filter(item => !item.usedAt && (!item.endDate || new Date(item.endDate) >= now))
    .map(item => ({
      _id: item._id || item.promotion,
      promotion: item.promotion || item._id,
      name: item.name || '',
      description: item.description || '',
      type: item.type,
      value: item.value,
      minOrderValue: item.minOrderValue || 0,
      startDate: item.startDate,
      endDate: item.endDate,
      claimedAt: item.claimedAt,
      usedAt: item.usedAt,
      isActive: item.isActive !== false,
    }));
};
