import React, { useEffect, useMemo, useState } from 'react';
import reportService from '../../services/reportService';
import { useToast } from '../../contexts/ToastContext';

const formatCurrency = (value = 0, compact = false) => {
  const number = Number(value || 0);
  if (compact && Math.abs(number) >= 1000000) {
    return `${(number / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Mđ`;
  }
  return `${number.toLocaleString('vi-VN')}đ`;
};
const formatGrowth = (value) => {
  const number = Number(value || 0);
  const sign = number > 0 ? '+' : '';
  return `${sign}${number.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
};
const getPercentChange = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

const groupByWeek = (source) => {
  const groups = new Map();
  source.forEach(item => {
    const date = new Date(item._id);
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    const key = `Tuần ${week}`;
    const current = groups.get(key) || { label: key, revenue: 0, orders: 0 };
    current.revenue += Number(item.revenue || 0);
    current.orders += Number(item.orders || 0);
    groups.set(key, current);
  });
  return Array.from(groups.values());
};

const groupByMonth = (source) => {
  const groups = new Map();
  source.forEach(item => {
    const date = new Date(item._id);
    const key = `Tháng ${date.getMonth() + 1}`;
    const current = groups.get(key) || { label: key, revenue: 0, orders: 0 };
    current.revenue += Number(item.revenue || 0);
    current.orders += Number(item.orders || 0);
    groups.set(key, current);
  });
  return Array.from(groups.values());
};

const RevenueReportPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [chartMode, setChartMode] = useState('day');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const monthStart = String(selectedMonth).padStart(2, '0');
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const monthEnd = String(lastDay).padStart(2, '0');
        const params = {
          startDate: `${selectedYear}-${monthStart}-01`,
          endDate: `${selectedYear}-${monthStart}-${monthEnd}`,
        };
        const result = await reportService.getReports(params);
        setData(result);
      } catch (err) {
        const message = err.response?.data?.message || 'Không thể tải báo cáo doanh thu';
        setError(message);
      showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedYear, selectedMonth, showToast]);

  const chartData = useMemo(() => {
    const dailySource = data?.dailyRevenue || [];
    const source = chartMode === 'week'
      ? groupByWeek(dailySource)
      : chartMode === 'month'
        ? groupByMonth(dailySource)
        : dailySource.map(item => ({
            label: new Date(item._id).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            revenue: item.revenue,
            orders: item.orders,
          }));

    const maxRevenue = Math.max(...source.map(item => item.revenue), 1);
    return source.slice(chartMode === 'day' ? -10 : -12).map(item => ({
      ...item,
      height: Math.max(14, Math.round((item.revenue / maxRevenue) * 180)),
    }));
  }, [data, chartMode]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2022 + 1 }, (_, index) => currentYear - index);
  }, []);

  const monthOptions = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => index + 1)
  ), []);

  const revenueStructure = useMemo(() => {
    const total = Number(data?.totalRevenue || 0);
    const categories = data?.categoryRevenue || [];
    return categories.slice(0, 4).map((item, index) => ({
      key: `${item.category || 'category'}-${index}`,
      name: item.category || 'Chưa phân loại',
      value: item.revenue || 0,
      percent: total > 0 ? Math.round((Number(item.revenue || 0) / total) * 100) : 0,
      color: ['bg-[#c70d1a]', 'bg-[#0089a8]', 'bg-[#ff8b82]', 'bg-gray-300'][index],
    }));
  }, [data]);

  const averageOrderValue = data?.totalOrders ? Math.round(data.totalRevenue / data.totalOrders) : 0;
  const previousAverageOrderValue = data?.previous?.totalOrders
    ? Math.round(Number(data.previous.totalRevenue || 0) / Number(data.previous.totalOrders || 1))
    : 0;
  const averageOrderGrowth = getPercentChange(averageOrderValue, previousAverageOrderValue);
  const operatingCost = Number(data?.operatingCost || 0);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Báo cáo Doanh thu</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Tổng quan hiệu suất tài chính nhà hàng.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={selectedMonth}
            onChange={event => setSelectedMonth(Number(event.target.value))}
            className="rounded-xl border border-red-100 bg-white px-4 py-3 text-xs font-black text-gray-700 shadow-sm outline-none"
          >
            {monthOptions.map(month => (
              <option key={month} value={month}>Tháng {month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={event => setSelectedYear(Number(event.target.value))}
            className="rounded-xl border border-red-100 bg-white px-4 py-3 text-xs font-black text-gray-700 shadow-sm outline-none"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>Năm {year}</option>
            ))}
          </select>
        </div>
      </div>


      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm font-bold text-gray-500 shadow-sm">Đang tải báo cáo...</div>
      ) : (
        <>
          <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Tổng doanh thu" value={formatCurrency(data?.totalRevenue)} hint={`${formatGrowth(data?.growth?.revenue)} so với kỳ trước`} icon="▣" />
            <MetricCard title="Tổng đơn hàng" value={data?.totalOrders || 0} hint={`${formatGrowth(data?.growth?.orders)} so với kỳ trước`} icon="▤" />
            <MetricCard title="Giá trị TB / đơn" value={formatCurrency(averageOrderValue)} hint={`${formatGrowth(averageOrderGrowth)} so với kỳ trước`} icon="◈" />
            <MetricCard title="Chi phí vận hành" value={formatCurrency(operatingCost)} hint={`${formatGrowth(data?.growth?.operatingCost)} so với kỳ trước`} icon="⌁" danger={Number(data?.growth?.operatingCost || 0) > 0} />
          </div>

          <section className="mb-7 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="m-0 text-xl font-black text-gray-950">Tăng trưởng Doanh thu (VNĐ)</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">Thống kê theo các ngày trong khoảng đã chọn.</p>
              </div>
              <div className="flex rounded-xl bg-[#fbf8f7] p-1 text-xs font-black">
                {[
                  { label: 'Ngày', value: 'day' },
                  { label: 'Tuần', value: 'week' },
                  { label: 'Tháng', value: 'month' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setChartMode(item.value)}
                    className={`rounded-lg px-3 py-2 ${chartMode === item.value ? 'bg-white text-[#c70d1a] shadow-sm' : 'text-gray-500'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex h-[250px] items-end gap-5 border-b border-gray-100 px-3">
              {chartData.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">Chưa có dữ liệu doanh thu.</div>
              ) : (
                chartData.map((item, index) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center justify-end gap-3">
                    <div
                      className={`w-full max-w-[78px] rounded-t-lg ${index === chartData.length - 1 ? 'bg-[#0089a8]' : 'bg-[#bd2731]'}`}
                      style={{ height: item.height }}
                      title={`${item.label}: ${formatCurrency(item.revenue)}`}
                    />
                    <span className="text-xs font-black text-gray-400">{item.label}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="m-0 text-xl font-black text-gray-950">Sản phẩm Doanh thu Cao nhất</h2>
                <span className="text-xs font-black text-[#c70d1a]">{(data?.topItems || []).length} sản phẩm</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-widest text-red-950">
                    <th className="py-3">Sản phẩm</th>
                    <th className="py-3">Đã bán</th>
                    <th className="py-3">Doanh thu</th>
                    <th className="py-3">Xu hướng</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topItems || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="border-t border-gray-50 py-8 text-center text-sm font-bold text-gray-400">
                        Chưa có dữ liệu doanh thu sản phẩm.
                      </td>
                    </tr>
                  ) : (
                    (data?.topItems || []).slice(0, 5).map(item => {
                      const trend = Number(item.revenueGrowthPercent || 0);
                      return (
                        <tr key={`${item.type}-${item.itemId || item.name}`} className="border-t border-gray-50 text-sm">
                          <td className="py-4 font-black text-gray-950">{item.name || 'Sản phẩm'}</td>
                          <td className="py-4 font-bold">{item.totalQuantity}</td>
                          <td className="py-4 font-black text-[#c70d1a]">{formatCurrency(item.totalRevenue)}</td>
                          <td className="py-4">
                            <span className={`rounded-full px-2 py-1 text-xs font-black ${trend < 0 ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-700'}`}>
                              {formatGrowth(trend)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="m-0 text-xl font-black text-gray-950">Cơ cấu Doanh thu</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">Theo danh mục sản phẩm.</p>
              <div className="mt-8 flex flex-col gap-4">
                {revenueStructure.length === 0 ? (
                  <p className="text-sm font-bold text-gray-400">Chưa có dữ liệu.</p>
                ) : (
                  revenueStructure.map(item => (
                    <div key={item.key}>
                      <div className="mb-1 flex justify-between text-xs font-black text-gray-600">
                        <span>{item.name}</span>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, hint, icon, danger = false }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
    <div className="mb-4 flex items-center justify-between">
      <div className="text-[11px] font-black uppercase tracking-widest text-red-950">{title}</div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-700'}`}>{icon}</div>
    </div>
    <div className="text-2xl font-black text-gray-950">{value}</div>
    <div className={`mt-3 text-xs font-bold ${danger ? 'text-red-500' : 'text-sky-600'}`}>{hint}</div>
  </div>
);

export default RevenueReportPage;
