const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Ingredient = require('../models/Ingredient');

// @desc    Lấy tất cả nhà cung cấp
// @route   GET /api/suppliers
// @access  Private (Admin)
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({}).sort('-createdAt');
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Lấy một nhà cung cấp
// @route   GET /api/suppliers/:id
// @access  Private (Admin)
const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Tạo nhà cung cấp mới
// @route   POST /api/suppliers
// @access  Private (Admin)
const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
};

// @desc    Cập nhật thông tin nhà cung cấp
// @route   PUT /api/suppliers/:id
// @access  Private (Admin)
const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(supplier);
    } catch (error) {
        res.status(400).json({ message: 'Cập nhật thất bại' });
    }
};

// @desc    Xóa nhà cung cấp
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ message: 'Đã xóa nhà cung cấp' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Tạo phiếu nhập hàng (Purchase)
// @route   POST /api/suppliers/purchase
// @access  Private (Admin)
const createPurchase = async (req, res) => {
    try {
        const { supplierId, items, paidAmount, purchaseDate, notes } = req.body;
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });

        let totalAmount = 0;
        const purchaseItems = [];

        // Duyệt từng item, cập nhật tồn kho và giá nhập
        for (const item of items) {
            const ingredient = await Ingredient.findById(item.ingredient);
            if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${item.ingredient}`);

            const quantity = item.quantity;
            const unitPrice = item.unitPrice;
            const totalPrice = quantity * unitPrice;

            // Cập nhật tồn kho
            ingredient.stock += quantity;
            ingredient.pricePerUnit = unitPrice; // Cập nhật giá mới nhất
            await ingredient.save();

            purchaseItems.push({
                ingredient: ingredient._id,
                quantity,
                unitPrice,
                totalPrice
            });
            totalAmount += totalPrice;
        }

        // Tính công nợ mới
        const paid = paidAmount || 0;
        const newDebt = supplier.debt + totalAmount - paid;
        supplier.debt = newDebt;
        await supplier.save();

        const purchase = await Purchase.create({
            supplier: supplier._id,
            items: purchaseItems,
            totalAmount,
            paidAmount: paid,
            debtAfterPurchase: newDebt,
            purchaseDate: purchaseDate || new Date(),
            notes
        });

        // Populate để trả về
        const populated = await Purchase.findById(purchase._id)
            .populate('supplier', 'name')
            .populate('items.ingredient', 'name unit');

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Lấy lịch sử nhập hàng
// @route   GET /api/purchases
// @access  Private (Admin)
const getPurchases = async (req, res) => {
    try {
        const filter = {};
        if (req.query.supplier) filter.supplier = req.query.supplier;
        const purchases = await Purchase.find(filter)
            .populate('supplier', 'name')
            .populate('items.ingredient', 'name unit')
            .sort('-purchaseDate');
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 🆕 Thanh toán công nợ cho nhà cung cấp
// @desc    Thanh toán công nợ
// @route   PUT /api/suppliers/:id/pay-debt
// @access  Private (Admin)
const payDebt = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });

        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Số tiền thanh toán không hợp lệ' });

        if (amount > supplier.debt) {
            return res.status(400).json({ message: 'Số tiền thanh toán lớn hơn công nợ hiện tại' });
        }

        supplier.debt -= amount;
        await supplier.save();

        res.json({
            message: `Đã thanh toán ${amount.toLocaleString()}₫ cho ${supplier.name}`,
            debt: supplier.debt
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, createPurchase, getPurchases, payDebt };