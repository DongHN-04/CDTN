const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Ingredient = require('../models/Ingredient');

// @desc    Lay tat ca nha cung cap
// @route   GET /api/suppliers
// @access  Private (Admin)
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ isDeleted: { $ne: true } }).sort('-createdAt');
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Lay mot nha cung cap
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

// @desc    Tao nha cung cap moi
// @route   POST /api/suppliers
// @access  Private (Admin)
const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create({ ...req.body, isActive: true, isDeleted: false });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
};

// @desc    Cap nhat thong tin nha cung cap
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

// @desc    Xoa nha cung cap
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy' });

        const purchaseCount = await Purchase.countDocuments({ supplier: supplier._id });
        if (purchaseCount > 0 || Number(supplier.debt || 0) > 0) {
            supplier.isActive = false;
            supplier.isDeleted = true;
            await supplier.save();
            return res.json({
                message: 'Nhà cung cấp đã phát sinh phiếu nhập/công nợ nên đã được ngừng hoạt động thay vì xóa vĩnh viễn',
                mode: 'soft-deleted',
            });
        }

        await supplier.deleteOne();
        res.json({ message: 'Đã xóa nhà cung cấp', mode: 'hard-deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Tao phieu nhap hang
// @route   POST /api/suppliers/purchase
// @access  Private (Admin)
const createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { supplierId, items, paidAmount, purchaseDate, notes } = req.body;
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
        if (supplier.isActive === false || supplier.isDeleted === true) {
            return res.status(400).json({ message: 'Nha cung cap da ngung hoat dong' });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Danh sách nhập hàng không hợp lệ' });
        }

        let totalAmount = 0;
        const purchaseItems = [];
        const stockUpdates = [];

        // Kiem tra toan bo dong nhap truoc, sau do moi cap nhat kho/cong no.
        for (const item of items) {
            const ingredient = await Ingredient.findById(item.ingredient);
            if (!ingredient) throw new Error(`Nguyên liệu không tồn tại: ${item.ingredient}`);
            if (ingredient.isActive === false || ingredient.isDeleted === true) {
                throw new Error(`Nguyên liệu đã ngừng sử dụng: ${ingredient.name}`);
            }

            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error('Số lượng nhập phải lớn hơn 0');
            }
            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                throw new Error('Đơn giá nhập không hợp lệ');
            }

            const totalPrice = quantity * unitPrice;
            purchaseItems.push({
                ingredient: ingredient._id,
                quantity,
                unitPrice,
                totalPrice
            });
            stockUpdates.push({ ingredient, quantity, unitPrice });
            totalAmount += totalPrice;
        }

        const paid = Number(paidAmount || 0);
        if (!Number.isFinite(paid) || paid < 0 || paid > totalAmount) {
            return res.status(400).json({ message: 'Số tiền đã trả không hợp lệ' });
        }

        let purchaseId;

        await session.withTransaction(async () => {
            // Cap nhat kho, cong no va phieu nhap trong cung transaction de tranh lech du lieu.
            for (const { ingredient, quantity, unitPrice } of stockUpdates) {
                await Ingredient.updateOne(
                    { _id: ingredient._id },
                    { $inc: { stock: quantity }, $set: { pricePerUnit: unitPrice } },
                    { session }
                );
            }

            const supplierInTx = await Supplier.findById(supplierId).session(session);
            const newDebt = supplierInTx.debt + totalAmount - paid;
            supplierInTx.debt = newDebt;
            await supplierInTx.save({ session });

            const [purchase] = await Purchase.create([{
                supplier: supplierInTx._id,
                items: purchaseItems,
                totalAmount,
                paidAmount: paid,
                debtAfterPurchase: newDebt,
                purchaseDate: purchaseDate || new Date(),
                notes
            }], { session });

            purchaseId = purchase._id;
        });

        const populated = await Purchase.findById(purchaseId)
            .populate('supplier', 'name')
            .populate('items.ingredient', 'name unit');

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    Lay lich su nhap hang
// @route   GET /api/suppliers/purchases
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

// @desc    Thanh toan cong no
// @route   PUT /api/suppliers/:id/pay-debt
// @access  Private (Admin)
const payDebt = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });

        const amount = Number(req.body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Số tiền thanh toán không hợp lệ' });
        }

        if (amount > supplier.debt) {
            return res.status(400).json({ message: 'Số tiền thanh toán lớn hơn công nợ hiện tại' });
        }

        supplier.debt -= amount;
        await supplier.save();

        res.json({
            message: `Đã thanh toán ${amount.toLocaleString()} cho ${supplier.name}`,
            debt: supplier.debt
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, createPurchase, getPurchases, payDebt };
