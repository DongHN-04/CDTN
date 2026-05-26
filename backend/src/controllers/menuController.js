const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const Order = require('../models/Order');
const Combo = require('../models/Combo');

const SOLD_ORDER_STATUSES = ['confirmed', 'delivering', 'completed'];

const isMenuItemAvailable = (item) => (
  item.isActive !== false &&
  item.isDeleted !== true &&
  (item.ingredients || []).every(ing => (
    ing.ingredient &&
    ing.ingredient.isActive !== false &&
    ing.ingredient.isDeleted !== true &&
    Number(ing.ingredient.stock || 0) >= Number(ing.quantity || 0)
  ))
);

const getSoldCountByMenuItem = async () => {
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

  return soldCounts;
};

const attachMenuBusinessFields = async (items) => {
  const soldCounts = await getSoldCountByMenuItem();
  return items.map(item => {
    const obj = item.toObject();
    obj.ingredients = (obj.ingredients || []).filter(ing => ing.ingredient != null);
    obj.isAvailable = isMenuItemAvailable(item);
    obj.soldCount = soldCounts.get(item._id.toString()) || 0;
    return obj;
  });
};

const getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isDeleted: { $ne: true } }).populate('ingredients.ingredient', 'name unit stock isActive isDeleted');
    const decoratedItems = await attachMenuBusinessFields(menuItems);
    res.json(decoratedItems);
  } catch (error) {
    res.status(500).json({ message: 'Loi server' });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, price, description, category, image, ingredients } = req.body;
    if (ingredients && ingredients.length > 0) {
      for (const item of ingredients) {
        const ing = await Ingredient.findById(item.ingredient);
        if (!ing) {
          return res.status(400).json({ message: `Nguyen lieu ID ${item.ingredient} khong ton tai` });
        }
      }
    }

    const menuItem = await MenuItem.create({
      name,
      price,
      description,
      category,
      image,
      ingredients,
      isActive: true,
      isDeleted: false,
    });
    const populated = await MenuItem.findById(menuItem._id).populate('ingredients.ingredient', 'name unit stock isActive isDeleted');
    const [decorated] = await attachMenuBusinessFields([populated]);
    res.status(201).json(decorated);
  } catch (error) {
    res.status(400).json({ message: 'Du lieu khong hop le' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Khong tim thay mon an' });
    }

    menuItem.name = req.body.name || menuItem.name;
    menuItem.price = req.body.price != null ? req.body.price : menuItem.price;
    menuItem.description = req.body.description || menuItem.description;
    menuItem.category = req.body.category || menuItem.category;
    menuItem.image = req.body.image || menuItem.image;

    if (req.body.ingredients) {
      for (const item of req.body.ingredients) {
        const ing = await Ingredient.findById(item.ingredient);
        if (!ing) {
          return res.status(400).json({ message: `Nguyen lieu ID ${item.ingredient} khong ton tai` });
        }
      }
      menuItem.ingredients = req.body.ingredients;
    }

    const updated = await menuItem.save();
    const populated = await MenuItem.findById(updated._id).populate('ingredients.ingredient', 'name unit stock isActive isDeleted');
    const [decorated] = await attachMenuBusinessFields([populated]);
    res.json(decorated);
  } catch (error) {
    res.status(400).json({ message: 'Cap nhat that bai' });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Khong tim thay mon an' });
    }

    const [orderCount, comboCount] = await Promise.all([
      Order.countDocuments({ 'items.menuItem': menuItem._id }),
      Combo.countDocuments({ 'items.menuItem': menuItem._id }),
    ]);

    const comboUpdate = comboCount > 0
      ? await Combo.updateMany(
          { 'items.menuItem': menuItem._id, isActive: { $ne: false } },
          { $set: { isActive: false } }
        )
      : { modifiedCount: 0 };

    if (orderCount > 0 || comboCount > 0) {
      menuItem.isActive = false;
      menuItem.isDeleted = true;
      await menuItem.save();

      return res.json({
        message: 'Mon an da phat sinh du lieu lien quan nen da duoc ngung ban thay vi xoa vinh vien',
        mode: 'soft-deleted',
        pausedCombos: comboUpdate.modifiedCount || 0,
      });
    }

    await menuItem.deleteOne();

    res.json({
      message: 'Da xoa mon an',
      mode: 'hard-deleted',
      pausedCombos: comboUpdate.modifiedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Loi server' });
  }
};

module.exports = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };
