const Ingredient = require('../models/Ingredient');
const MenuItem = require('../models/MenuItem');
const Purchase = require('../models/Purchase');
const Order = require('../models/Order');

// Lấy tất cả nguyên liệu
const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ isDeleted: { $ne: true } });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo nguyên liệu mới
const createIngredient = async (req, res) => {
  try {
    const { name, stock, unit, pricePerUnit } = req.body;
    const ingredient = await Ingredient.create({ name, stock, unit, pricePerUnit, isActive: true, isDeleted: false });
    res.status(201).json(ingredient);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Tên nguyên liệu đã tồn tại' });
    } else {
      res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
  }
};

// Cập nhật nguyên liệu
const updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }
    ingredient.name = req.body.name || ingredient.name;
    ingredient.stock = req.body.stock != null ? req.body.stock : ingredient.stock;
    ingredient.unit = req.body.unit || ingredient.unit;
    ingredient.pricePerUnit = req.body.pricePerUnit != null ? req.body.pricePerUnit : ingredient.pricePerUnit;
    if (req.body.isActive !== undefined) ingredient.isActive = req.body.isActive;
    const updated = await ingredient.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại' });
  }
};

// Xóa nguyên liệu
const deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }
    const [menuItemCount, purchaseCount, orderCount] = await Promise.all([
      MenuItem.countDocuments({ 'ingredients.ingredient': ingredient._id }),
      Purchase.countDocuments({ 'items.ingredient': ingredient._id }),
      Order.countDocuments({ 'inventoryRequirements.ingredient': ingredient._id }),
    ]);

    if (menuItemCount > 0 || purchaseCount > 0 || orderCount > 0) {
      ingredient.isActive = false;
      ingredient.isDeleted = true;
      await ingredient.save();
      return res.json({
        message: 'Nguyên liệu đã phát sinh dữ liệu liên quan nên đã được ngừng sử dụng thay vì xóa vĩnh viễn',
        mode: 'soft-deleted',
      });
    }

    await ingredient.deleteOne();
    res.json({ message: 'Đã xóa nguyên liệu', mode: 'hard-deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getIngredients, createIngredient, updateIngredient, deleteIngredient };
