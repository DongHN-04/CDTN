const Combo = require('../models/Combo');

// @desc    Lấy tất cả combo
// @route   GET /api/combos
const getCombos = async (req, res) => {
  try {
    // populate để lấy tên và giá từng món trong combo
    const combos = await Combo.find({}).populate('items.menuItem', 'name price');
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Tạo combo mới
// @route   POST /api/combos
const createCombo = async (req, res) => {
  try {
    const combo = await Combo.create(req.body);
    const populated = await Combo.findById(combo._id).populate('items.menuItem', 'name price');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
};

// @desc    Cập nhật combo
// @route   PUT /api/combos/:id
const updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    }).populate('items.menuItem', 'name price');
    if (!combo) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại' });
  }
};

// @desc    Xóa combo
// @route   DELETE /api/combos/:id
const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id);
    if (!combo) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getCombos, createCombo, updateCombo, deleteCombo };