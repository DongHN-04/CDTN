const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');

const REPORT_TIMEZONE = '+07:00';

const getVietnamDateString = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const parseVietnamDateRange = (startDate, endDate) => {
  const startText = startDate || getVietnamDateString();
  const endText = endDate || startText;
  const [startYear, startMonth, startDay] = startText.split('-').map(Number);
  const [endYear, endMonth, endDay] = endText.split('-').map(Number);

  return {
    // 00:00:00 Vietnam time is 17:00:00 UTC of the previous day.
    start: new Date(Date.UTC(startYear, startMonth - 1, startDay, -7, 0, 0, 0)),
    // 23:59:59.999 Vietnam time is 16:59:59.999 UTC.
    end: new Date(Date.UTC(endYear, endMonth - 1, endDay, 16, 59, 59, 999)),
  };
};

const getPreviousRange = (start, end) => {
  const periodMs = end.getTime() - start.getTime() + 1;
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - periodMs + 1);
  return { start: previousStart, end: previousEnd };
};

const getPercentChange = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
};

const buildOrderFilter = (start, end) => ({
  status: 'completed',
  paymentStatus: 'paid',
  $or: [
    { completedAt: { $gte: start, $lte: end } },
    { completedAt: { $exists: false }, createdAt: { $gte: start, $lte: end } },
  ],
});

const getTopItems = async (matchFilter, options = {}) => {
  const sortStage = options.sortBy === 'quantity'
    ? { totalQuantity: -1, totalRevenue: -1 }
    : { totalRevenue: -1, totalQuantity: -1 };

  return Order.aggregate([
  { $match: matchFilter },
  { $unwind: '$items' },
  {
    $group: {
      _id: {
        id: { $ifNull: ['$items.menuItem', '$items.comboId'] },
        type: {
          $cond: [{ $ifNull: ['$items.menuItem', false] }, 'menuItem', 'combo'],
        },
      },
      itemName: { $first: '$items.name' },
      totalQuantity: { $sum: '$items.quantity' },
      totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
    },
  },
  { $sort: sortStage },
  { $limit: 10 },
  {
    $lookup: {
      from: 'menuitems',
      localField: '_id.id',
      foreignField: '_id',
      as: 'menuItem',
    },
  },
  {
    $lookup: {
      from: 'combos',
      localField: '_id.id',
      foreignField: '_id',
      as: 'combo',
    },
  },
  { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
  { $unwind: { path: '$combo', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      itemId: '$_id.id',
      type: '$_id.type',
      key: {
        $concat: [
          '$_id.type',
          ':',
          { $toString: '$_id.id' },
        ],
      },
      name: {
        $ifNull: [
          '$menuItem.name',
          { $ifNull: ['$combo.name', { $ifNull: ['$itemName', 'Món đã xóa'] }] },
        ],
      },
      totalQuantity: 1,
      totalRevenue: 1,
    },
  },
  ]);
};

const getCategoryRevenue = async (matchFilter) => Order.aggregate([
  { $match: matchFilter },
  { $unwind: '$items' },
  {
    $group: {
      _id: { $ifNull: ['$items.category', 'Khac'] },
      revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      quantity: { $sum: '$items.quantity' },
    },
  },
  { $sort: { revenue: -1 } },
  {
    $project: {
      _id: 0,
      category: '$_id',
      revenue: 1,
      quantity: 1,
    },
  },
]);

const getOperatingCost = async (start, end) => {
  const result = await Purchase.aggregate([
    { $match: { purchaseDate: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  return result[0]?.total || 0;
};

const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = parseVietnamDateRange(startDate, endDate);
    const { start: previousStart, end: previousEnd } = getPreviousRange(start, end);
    const matchFilter = buildOrderFilter(start, end);
    const previousFilter = buildOrderFilter(previousStart, previousEnd);
    const allTimeCompletedFilter = {
      status: 'completed',
      paymentStatus: 'paid',
    };

    const orders = await Order.find(matchFilter);
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    const previousOrders = await Order.find(previousFilter);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const previousTotalOrders = previousOrders.length;

    const totalCustomers = await Customer.countDocuments({
      createdAt: { $gte: start, $lte: end },
      isDeleted: { $ne: true },
    });
    const previousCustomers = await Customer.countDocuments({
      createdAt: { $gte: previousStart, $lte: previousEnd },
      isDeleted: { $ne: true },
    });

    const [topItems, previousTopItems, allTimeTopItems, categoryRevenue, operatingCost, previousOperatingCost] = await Promise.all([
      getTopItems(matchFilter),
      getTopItems(previousFilter),
      // Mon ban chay tren trang tong quan can tinh theo toan bo lich su va sap xep theo so luong ban.
      getTopItems(allTimeCompletedFilter, { sortBy: 'quantity' }),
      getCategoryRevenue(matchFilter),
      getOperatingCost(start, end),
      getOperatingCost(previousStart, previousEnd),
    ]);

    const previousItemMap = new Map(previousTopItems.map(item => [item.key, item]));
    const enrichedTopItems = topItems.map(item => {
      const previous = previousItemMap.get(item.key) || {};
      return {
        ...item,
        previousQuantity: previous.totalQuantity || 0,
        previousRevenue: previous.totalRevenue || 0,
        quantityGrowthPercent: getPercentChange(item.totalQuantity, previous.totalQuantity),
        revenueGrowthPercent: getPercentChange(item.totalRevenue, previous.totalRevenue),
      };
    });

    const dailyRevenue = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$completedAt', '$createdAt'] },
              timezone: REPORT_TIMEZONE,
            },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      operatingCost,
      topItems: enrichedTopItems,
      allTimeTopItems,
      categoryRevenue,
      dailyRevenue,
      previous: {
        totalRevenue: previousRevenue,
        totalOrders: previousTotalOrders,
        totalCustomers: previousCustomers,
        operatingCost: previousOperatingCost,
      },
      growth: {
        revenue: getPercentChange(totalRevenue, previousRevenue),
        orders: getPercentChange(totalOrders, previousTotalOrders),
        customers: getPercentChange(totalCustomers, previousCustomers),
        operatingCost: getPercentChange(operatingCost, previousOperatingCost),
      },
      range: {
        start,
        end,
        previousStart,
        previousEnd,
        timezone: REPORT_TIMEZONE,
      },
    });
  } catch (error) {
    console.error('Loi bao cao:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy báo cáo' });
  }
};

module.exports = { getReports };
