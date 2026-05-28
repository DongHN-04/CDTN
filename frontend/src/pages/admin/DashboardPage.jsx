import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, Search, ShoppingCart, TrendingUp, Users, WalletCards } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import reportService from '../../services/reportService';
import orderService from '../../services/orderService';
import { useToast } from '../../contexts/ToastContext';

const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const statusLabels = {
  pending: 'Đang xử lý',
  confirmed: 'Đang xử lý',
  delivering: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const statusClasses = {
  pending: 'bg-sky-50 text-sky-700',
  confirmed: 'bg-sky-50 text-sky-700',
  delivering: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};
const donutColors = ['#c70d1a', '#e5e7eb', '#0086a8'];
const REVENUE_TICK_STEP = 500000;

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
const formatGrowth = (value) => {
  const number = Number(value || 0);
  const sign = number > 0 ? '+' : '';
  return `${sign}${number.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
};
const formatShortCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1000000) {
    return `${(amount / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Tr`;
  }
  if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString('vi-VN')}K`;
  return amount.toLocaleString('vi-VN');
};
const formatOrderCode = (order) => `#SD-${String(order?._id || '').slice(-4).toUpperCase()}`;
const formatDateParam = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getOrderDateKey = (order) => {
  const rawDate = order?.createdAt || order?.updatedAt;
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '';
  return formatDateParam(date);
};

const DashboardPage = () => {
  const { showToast } = useToast();
  const [report, setReport] = useState(null);
  const [weekReport, setWeekReport] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      const todayText = formatDateParam(today);
      const weekStartText = formatDateParam(weekStart);

      const [reportData, weekReportData, orderData] = await Promise.all([
        reportService.getReports({ startDate: todayText, endDate: todayText }),
        reportService.getReports({ startDate: weekStartText, endDate: todayText }),
        orderService.getOrders({ recent: true, limit: 20 }),
      ]);
      setReport(reportData);
      setWeekReport(weekReportData);
      setOrders(orderData || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải dữ liệu tổng quan';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const recentOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return orders
      .filter(order => {
        if (!keyword) return true;
        const text = [
          formatOrderCode(order),
          order.customer?.name,
          order.customer?.phone,
          order.status,
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes(keyword);
      })
      .slice(0, 5);
  }, [orders, search]);

  const todayOrders = useMemo(() => {
    const todayKey = formatDateParam(new Date());
    return orders.filter(order => getOrderDateKey(order) === todayKey);
  }, [orders]);

  const statusSummary = useMemo(() => {
    const completed = todayOrders.filter(order => order.status === 'completed').length;
    const processing = todayOrders.filter(order => ['pending', 'confirmed', 'delivering'].includes(order.status)).length;
    const cancelled = todayOrders.filter(order => order.status === 'cancelled').length;
    const total = todayOrders.length || 1;

    return [
      { name: 'Hoàn thành', value: completed, percent: Math.round((completed / total) * 100) },
      { name: 'Đang xử lý', value: processing, percent: Math.round((processing / total) * 100) },
      { name: 'Đã hủy', value: cancelled, percent: Math.round((cancelled / total) * 100) },
    ];
  }, [todayOrders]);

  const weeklyRevenue = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return {
        key: formatDateParam(date),
        label: dayLabels[date.getDay()],
        revenue: 0,
      };
    });

    (weekReport?.dailyRevenue || []).forEach(item => {
      const bucket = buckets.find(day => day.key === item._id);
      if (bucket) bucket.revenue = item.revenue || 0;
    });

    return buckets;
  }, [weekReport]);

  const weeklyRevenueTicks = useMemo(() => {
    const maxRevenue = Math.max(...weeklyRevenue.map(item => Number(item.revenue || 0)), 0);
    const maxTick = Math.max(REVENUE_TICK_STEP, Math.ceil(maxRevenue / REVENUE_TICK_STEP) * REVENUE_TICK_STEP);
    return Array.from(
      { length: Math.floor(maxTick / REVENUE_TICK_STEP) + 1 },
      (_, index) => index * REVENUE_TICK_STEP
    );
  }, [weeklyRevenue]);

  const topItem = report?.allTimeTopItems?.[0];
  const newCustomers = report?.totalCustomers || 0;
  const totalOrders = report?.totalOrders ?? todayOrders.length;
  const totalRevenue = report?.totalRevenue || 0;

  if (loading) {
    return <div className="rounded-2xl bg-white p-8 text-sm font-bold text-gray-500 shadow-sm">Đang tải dữ liệu tổng quan...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Tổng quan</h1>

        <div className="flex flex-1 items-center gap-5 xl:max-w-3xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm đơn hàng, khách hàng..."
              className="w-full rounded-xl border border-red-100 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-gray-700 shadow-sm outline-none focus:border-[#c70d1a] focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>
      </div>


      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Tổng doanh thu" value={formatCurrency(totalRevenue)} trend={formatGrowth(report?.growth?.revenue)} icon={<WalletCards size={22} />} tone="bg-red-50 text-[#c70d1a]" />
        <MetricCard title="Đơn đã thanh toán" value={Number(totalOrders).toLocaleString('vi-VN')} trend={formatGrowth(report?.growth?.orders)} icon={<ShoppingCart size={22} />} tone="bg-red-50 text-[#c70d1a]" />
        <MetricCard title="Khách hàng mới" value={Number(newCustomers).toLocaleString('vi-VN')} trend={formatGrowth(report?.growth?.customers)} icon={<Users size={22} />} tone="bg-sky-50 text-sky-700" />
        <MetricCard title="Món bán chạy" value={topItem?.name || 'Chưa có'} subText={topItem ? `Đã bán ${topItem.totalQuantity} suất` : 'Chưa có dữ liệu'} icon={<Flame size={22} />} tone="bg-red-50 text-[#c70d1a]" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_350px]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="m-0 text-xl font-black text-gray-950">Tổng quan Doanh Thu</h2>
            <span className="rounded-lg bg-[#f5eeee] px-3 py-1.5 text-xs font-black text-red-950">Tuần này</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenue} barSize={48}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 800 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatShortCurrency}
                  ticks={weeklyRevenueTicks}
                  domain={[0, weeklyRevenueTicks[weeklyRevenueTicks.length - 1]]}
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 800 }}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#f9eeee' }} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {weeklyRevenue.map((entry, index) => (
                    <Cell key={entry.key} fill={index === 3 ? '#c70d1a' : index % 2 ? '#d77b85' : '#efcfd2'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="m-0 text-xl font-black text-gray-950">Trạng thái Đơn Hàng</h2>
          <div className="mt-5 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusSummary} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3}>
                  {statusSummary.map((entry, index) => (
                    <Cell key={entry.name} fill={donutColors[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-24 mb-12 text-center">
            <div className="text-3xl font-black text-gray-950">{Number(todayOrders.length).toLocaleString('vi-VN')}</div>
            <div className="text-xs font-black text-gray-500">Tổng số</div>
          </div>
          <div className="space-y-3">
            {statusSummary.map((status, index) => (
              <div key={status.name} className="flex items-center justify-between text-sm font-bold text-gray-700">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: donutColors[index] }} />
                  {status.name}
                </span>
                <span>{status.percent}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="m-0 text-xl font-black text-gray-950">Đơn Hàng Gần Đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-[#fbf8f7] text-left text-[11px] font-black uppercase tracking-widest text-red-950">
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm font-bold text-gray-500">Không có đơn hàng phù hợp.</td>
                </tr>
              ) : (
                recentOrders.map(order => <OrderRow key={order._id} order={order} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ title, value, trend, subText, icon, tone }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[11px] font-black uppercase tracking-widest text-red-950">{title}</div>
        <div className="mt-2 min-h-[52px] text-2xl font-black leading-tight text-gray-950">{value}</div>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>{icon}</div>
    </div>
    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-gray-500">
      {trend ? (
        <>
          <TrendingUp size={15} className="text-sky-700" />
          <span className="text-sky-700">{trend}</span>
          <span>so với kỳ trước</span>
        </>
      ) : (
        <span>{subText}</span>
      )}
    </div>
  </div>
);

const OrderRow = ({ order }) => {
  const status = statusLabels[order.status] || order.status || 'Đang xử lý';
  const initials = (order.customer?.name || 'Khách').slice(0, 2).toUpperCase();

  return (
    <tr className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/70">
      <td className="px-6 py-5 font-black text-gray-950">{formatOrderCode(order)}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-500">{initials}</div>
          <div>
            <div className="font-bold text-gray-900">{order.customer?.name || 'Khách lẻ'}</div>
            <div className="text-xs font-semibold text-gray-400">{order.customer?.phone || 'Không có SĐT'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 font-bold">{formatCurrency(order.total)}</td>
      <td className="px-6 py-5">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClasses[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-5 text-right text-xl font-black text-red-950">...</td>
    </tr>
  );
};

export default DashboardPage;
