export const ALL_MENU_CATEGORY = 'Tất cả';
export const COMBO_CATEGORY = 'Combo';

export const MENU_CATEGORIES = [
  'Burger',
  'Gà Rán',
  'Pizza',
  'Đồ Uống',
  'Tráng Miệng',
  'Khai Vị',
];

export const normalizeCategory = (value = '') => value.toString().trim().toLowerCase();

export const standardizeCategory = (cat = '') => {
  const norm = cat.toString().trim().toLowerCase();
  if (norm === 'burger') return 'Burger';
  if (norm === 'gà rán') return 'Gà Rán';
  if (norm === 'pizza') return 'Pizza';
  if (norm === 'đồ uống') return 'Đồ Uống';
  if (norm === 'tráng miệng') return 'Tráng Miệng';
  if (norm === 'khai vị') return 'Khai Vị';
  if (norm === 'combo') return 'Combo';
  return cat
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
