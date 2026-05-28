const STORAGE_PREFIX = 'savedPromotions';

export const getPromotionStorageKey = (user) => {
  const userKey = user?._id || user?.id || user?.email || 'guest';
  return `${STORAGE_PREFIX}:${userKey}`;
};

export const getSavedPromotions = (user) => {
  try {
    const raw = localStorage.getItem(getPromotionStorageKey(user));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const savePromotionForUser = (user, promotion) => {
  if (!promotion?._id && !promotion?.name) return [];

  const key = getPromotionStorageKey(user);
  const current = getSavedPromotions(user);
  const normalizedName = String(promotion.name || '').trim().toUpperCase();
  const normalizedId = String(promotion._id || '');
  const exists = current.some(item => (
    String(item._id || '') === normalizedId ||
    String(item.name || '').trim().toUpperCase() === normalizedName
  ));

  if (exists) return current;

  const next = [
    ...current,
    {
      _id: promotion._id,
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      value: promotion.value,
      minOrderValue: promotion.minOrderValue || 0,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      isActive: promotion.isActive,
    },
  ];
  localStorage.setItem(key, JSON.stringify(next));
  return next;
};
