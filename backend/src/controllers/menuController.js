const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');

// Lấy tất cả món ăn (có kèm thông tin nguyên liệu)
const getMenuItems = async (req, res) => {
    try {
        const menuItems = await MenuItem.find({}).populate('ingredients.ingredient', 'name unit');
        // Lọc bỏ các nguyên liệu đã bị xóa (null) trước khi trả về
        menuItems.forEach(item => {
            item.ingredients = item.ingredients.filter(ing => ing.ingredient != null);
        });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Tạo món mới
const createMenuItem = async (req, res) => {
    try {
        const { name, price, description, category, image, ingredients } = req.body;
        // Kiểm tra xem tất cả ingredient id có tồn tại không
        if (ingredients && ingredients.length > 0) {
            for (let item of ingredients) {
                const ing = await Ingredient.findById(item.ingredient);
                if (!ing) {
                    return res.status(400).json({ message: `Nguyên liệu ID ${item.ingredient} không tồn tại` });
                }
            }
        }
        const menuItem = await MenuItem.create({
            name, price, description, category, image, ingredients
        });
        const populated = await MenuItem.findById(menuItem._id).populate('ingredients.ingredient', 'name unit');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
};

// Cập nhật món
const updateMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn' });
        }
        menuItem.name = req.body.name || menuItem.name;
        menuItem.price = req.body.price != null ? req.body.price : menuItem.price;
        menuItem.description = req.body.description || menuItem.description;
        menuItem.category = req.body.category || menuItem.category;
        menuItem.image = req.body.image || menuItem.image;

        if (req.body.ingredients) {
            for (let item of req.body.ingredients) {
                const ing = await Ingredient.findById(item.ingredient);
                if (!ing) {
                    return res.status(400).json({ message: `Nguyên liệu ID ${item.ingredient} không tồn tại` });
                }
            }
            menuItem.ingredients = req.body.ingredients;
        }
        const updated = await menuItem.save();
        const populated = await MenuItem.findById(updated._id).populate('ingredients.ingredient', 'name unit');
        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Cập nhật thất bại' });
    }
};

// Xóa món
const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn' });
        }
        await menuItem.deleteOne();
        res.json({ message: 'Đã xóa món ăn' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };
