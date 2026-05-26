const isMenuItemSellable = (item) => (
  item &&
  item.isActive !== false &&
  item.isDeleted !== true
);

const isMenuItemAvailable = (item, quantity = 1) => (
  isMenuItemSellable(item) &&
  (item.ingredients || []).every(ing => (
    ing.ingredient &&
    Number(ing.ingredient.stock || 0) >= Number(ing.quantity || 0) * Number(quantity || 1)
  ))
);

const getComboRequirements = (combo, quantity = 1) => {
  const requirements = new Map();

  for (const comboItem of combo.items || []) {
    const menuItem = comboItem.menuItem;
    if (!isMenuItemSellable(menuItem)) {
      return { sellable: false, requirements };
    }

    const menuQuantity = Number(comboItem.quantity || 0) * Number(quantity || 1);
    for (const ing of menuItem.ingredients || []) {
      if (!ing.ingredient || ing.ingredient.isActive === false || ing.ingredient.isDeleted === true) {
        return { sellable: false, requirements };
      }

      const key = ing.ingredient._id.toString();
      const current = requirements.get(key) || {
        ingredient: ing.ingredient,
        requiredQty: 0,
      };
      current.requiredQty += Number(ing.quantity || 0) * menuQuantity;
      requirements.set(key, current);
    }
  }

  return { sellable: true, requirements };
};

const isComboAvailable = (combo, quantity = 1) => {
  if (!combo || combo.isActive === false || combo.isDeleted === true || !(combo.items || []).length) return false;

  const { sellable, requirements } = getComboRequirements(combo, quantity);
  if (!sellable) return false;

  return Array.from(requirements.values()).every(req => (
    Number(req.ingredient.stock || 0) >= Number(req.requiredQty || 0)
  ));
};

const attachComboAvailability = (combo) => {
  const obj = typeof combo.toObject === 'function' ? combo.toObject() : combo;
  obj.isAvailable = isComboAvailable(combo);
  return obj;
};

module.exports = {
  isMenuItemSellable,
  isMenuItemAvailable,
  isComboAvailable,
  attachComboAvailability,
};
