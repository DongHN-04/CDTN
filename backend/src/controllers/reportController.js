const Order = require('../models/Order');
const Customer = require('../models/Customer');

// @desc    Lấy dữ liệu báo cáo tổng quan
// @route   GET /api/reports
// @access  Private (Admin, Staff)
const getReports = async (req, res) => {
    try {
        // Lấy tham số ngày (nếu có)
        const { startDate, endDate } = req.query;
        const matchFilter = {};

        if (startDate && endDate) {
            // Tạo ngày bắt đầu bằng 00:00:00 và ngày kết thúc bằng 23:59:59
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchFilter.createdAt = {
                $gte: start,
                $lte: end,
            };
        }

        // 1. Tổng doanh thu & số đơn hàng
        const orders = await Order.find(matchFilter);
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;

        // 2. Số khách hàng (tổng số customer trong hệ thống)
        const totalCustomers = await Customer.countDocuments();

        // 3. Top món bán chạy (dựa trên lịch sử đơn hàng)
        const topItems = await Order.aggregate([
            { $match: matchFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.menuItem',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'menuItem'
                }
            },
            { $unwind: '$menuItem' },
            {
                $project: {
                    _id: 0,
                    menuItemId: '$_id',
                    name: '$menuItem.name',
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // 4. Doanh thu theo ngày (cho biểu đồ)
        const dailyRevenue = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalRevenue,
            totalOrders,
            totalCustomers,
            topItems,
            dailyRevenue
        });
    } catch (error) {
        console.error('Lỗi báo cáo:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy báo cáo' });
    }
};

module.exports = { getReports };