const Ingredient = require('../models/Ingredient');

// Lấy tất cả nguyên liệu
const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({});
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo nguyên liệu mới
const createIngredient = async (req, res) => {
  try {
    const { name, stock, unit, pricePerUnit } = req.body;
    const ingredient = await Ingredient.create({ name, stock, unit, pricePerUnit });
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
    await ingredient.deleteOne();
    res.json({ message: 'Đã xóa nguyên liệu' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getIngredients, createIngredient, updateIngredient, deleteIngredient };