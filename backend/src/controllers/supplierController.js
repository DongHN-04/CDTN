const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Ingredient = require('../models/Ingredient');

// @desc    Lay tat ca nha cung cap
// @route   GET /api/suppliers
// @access  Private (Admin)
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({}).sort('-createdAt');
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Loi server' });
    }
};

// @desc    Lay mot nha cung cap
// @route   GET /api/suppliers/:id
// @access  Private (Admin)
const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Khong tim thay nha cung cap' });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Loi server' });
    }
};

// @desc    Tao nha cung cap moi
// @route   POST /api/suppliers
// @access  Private (Admin)
const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ message: 'Du lieu khong hop le' });
    }
};

// @desc    Cap nhat thong tin nha cung cap
// @route   PUT /api/suppliers/:id
// @access  Private (Admin)
const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) return res.status(404).json({ message: 'Khong tim thay' });
        res.json(supplier);
    } catch (error) {
        res.status(400).json({ message: 'Cap nhat that bai' });
    }
};

// @desc    Xoa nha cung cap
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Khong tim thay' });
        res.json({ message: 'Da xoa nha cung cap' });
    } catch (error) {
        res.status(500).json({ message: 'Loi server' });
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
        if (!supplier) return res.status(404).json({ message: 'Khong tim thay nha cung cap' });
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Danh sach nhap hang khong hop le' });
        }

        let totalAmount = 0;
        const purchaseItems = [];
        const stockUpdates = [];

        // Kiem tra toan bo dong nhap truoc, sau do moi cap nhat kho/cong no.
        for (const item of items) {
            const ingredient = await Ingredient.findById(item.ingredient);
            if (!ingredient) throw new Error(`Nguyen lieu khong ton tai: ${item.ingredient}`);

            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error('So luong nhap phai lon hon 0');
            }
            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                throw new Error('Don gia nhap khong hop le');
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
            return res.status(400).json({ message: 'So tien da tra khong hop le' });
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
        res.status(500).json({ message: 'Loi server' });
    }
};

// @desc    Thanh toan cong no
// @route   PUT /api/suppliers/:id/pay-debt
// @access  Private (Admin)
const payDebt = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Khong tim thay nha cung cap' });

        const amount = Number(req.body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'So tien thanh toan khong hop le' });
        }

        if (amount > supplier.debt) {
            return res.status(400).json({ message: 'So tien thanh toan lon hon cong no hien tai' });
        }

        supplier.debt -= amount;
        await supplier.save();

        res.json({
            message: `Da thanh toan ${amount.toLocaleString()} cho ${supplier.name}`,
            debt: supplier.debt
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, createPurchase, getPurchases, payDebt };
