const Shift = require('../models/Shift');
const Order = require('../models/Order');
const User = require('../models/User');

// Helper format time
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// @desc    Lấy tất cả ca làm việc (Admin)
// @route   GET /api/shifts
// @access  Private (Admin)
const getShifts = async (req, res) => {
    try {
        const shifts = await Shift.find({})
            .populate('staff', 'name email')
            .sort('-createdAt');
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Lấy ca làm việc của nhân viên hiện tại (tất cả status)
// @route   GET /api/shifts/mine
// @access  Private (Admin, Staff)
const getMyShifts = async (req, res) => {
    try {
        const filter = { staff: req.user._id };
        const shifts = await Shift.find(filter)
            .populate('staff', 'name email')
            .sort('-createdAt');
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Tạo ca mới
// @route   POST /api/shifts
// @access  Private (Admin)
const createShift = async (req, res) => {
    try {
        const { name, startTime, endTime, staff } = req.body;

        if (!name || !startTime || !endTime) {
            return res.status(400).json({ message: 'Tên, thời gian bắt đầu và kết thúc là bắt buộc' });
        }
        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
        }

        const shift = await Shift.create({
            name,
            startTime,
            endTime,
            staff: staff || [],
            status: 'open',
        });
        const populated = await Shift.findById(shift._id).populate('staff', 'name email');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
};

// @desc    Cập nhật thông tin ca (chỉ khi ca đang mở)
// @route   PUT /api/shifts/:id
// @access  Private (Admin)
const updateShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: 'Không tìm thấy ca' });
        if (shift.status === 'closed') return res.status(400).json({ message: 'Ca đã đóng, không thể sửa' });

        const { name, startTime, endTime, staff } = req.body;
        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
        }

        shift.name = name || shift.name;
        shift.startTime = startTime || shift.startTime;
        shift.endTime = endTime || shift.endTime;
        if (staff) shift.staff = staff;

        await shift.save();
        const populated = await Shift.findById(shift._id).populate('staff', 'name email');
        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Cập nhật thất bại' });
    }
};

// @desc    Phân ca (gán nhân viên vào ca) - có kiểm tra trùng lịch
// @route   PUT /api/shifts/:id/assign
// @access  Private (Admin)
const assignStaff = async (req, res) => {
    try {
        const { userId } = req.body;
        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: 'Không tìm thấy ca' });
        if (shift.status === 'closed') return res.status(400).json({ message: 'Ca đã đóng' });

        if (!userId) return res.status(400).json({ message: 'Thiếu ID nhân viên' });

        const user = await User.findById(userId);
        if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
            return res.status(400).json({ message: 'Nhân viên không hợp lệ' });
        }

        // Kiểm tra trùng lịch: nhân viên đã có ca mở nào khác có khoảng thời gian giao với ca hiện tại?
        const overlappingShift = await Shift.findOne({
            _id: { $ne: shift._id },
            staff: userId,
            status: 'open',
            startTime: { $lt: shift.endTime },
            endTime: { $gt: shift.startTime }
        });

        if (overlappingShift) {
            return res.status(400).json({
                message: `Nhân viên ${user.name} đã có ca "${overlappingShift.name}" (${formatTime(overlappingShift.startTime)} - ${formatTime(overlappingShift.endTime)}) trùng với khoảng thời gian này.`
            });
        }

        if (!shift.staff.includes(userId)) {
            shift.staff.push(userId);
            await shift.save();
        }

        const populated = await Shift.findById(shift._id).populate('staff', 'name email');
        res.json(populated);
    } catch (error) {
        console.error('Lỗi assignStaff:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Đóng ca (Nhân viên trong ca hoặc Admin)
// @route   PUT /api/shifts/:id/close
// @access  Private (Admin hoặc Staff thuộc ca)
const closeShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: 'Không tìm thấy ca' });
        if (shift.status === 'closed') return res.status(400).json({ message: 'Ca đã được đóng' });

        // Kiểm tra quyền: Admin hoặc nhân viên có trong ca
        const isAdmin = req.user.role === 'admin';
        const isStaffInShift = shift.staff.some(
            staffId => staffId.toString() === req.user._id.toString()
        );

        if (!isAdmin && !isStaffInShift) {
            return res.status(403).json({ message: 'Bạn không có quyền đóng ca này' });
        }

        // Tính tổng tiền mặt từ các đơn hàng trong khoảng thời gian ca
        const orders = await Order.find({
            paymentMethod: 'cash',
            status: { $in: 'cancelled' },
            createdAt: { $gte: shift.startTime, $lte: req.body.endTime || new Date() },
        });

        const totalCash = orders.reduce((sum, order) => sum + order.total, 0);

        shift.endTime = req.body.endTime || new Date();
        shift.totalCash = totalCash;
        shift.actualCash = req.body.actualCash || 0;
        shift.difference = shift.actualCash - totalCash;
        shift.status = 'closed';
        shift.notes = req.body.notes || '';
        await shift.save();

        const populated = await Shift.findById(shift._id).populate('staff', 'name email');
        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Xóa ca (chỉ khi ca chưa có nhân viên hoặc admin)
// @route   DELETE /api/shifts/:id
// @access  Private (Admin)
const deleteShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: 'Không tìm thấy ca' });

        await Shift.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa ca' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { getShifts, getMyShifts, createShift, updateShift, assignStaff, closeShift, deleteShift };