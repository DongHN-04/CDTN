import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';

const statusConfig = {
  pending: { label: 'Chờ xác nhận', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  confirmed: { label: 'Đang chuẩn bị', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  delivering: { label: 'Đang giao', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  completed: { label: 'Hoàn thành', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
  cancelled: { label: 'Đã hủy', badge: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

const nextStatus = {
  pending: 'confirmed',
  confirmed: 'delivering',
  delivering: 'completed',
};

const paymentLabel = {
  cash: 'COD',
  card: 'Thẻ',
  qr: 'VNPay',
};

const formatCurrency = (value = 0) => `${Number(value).toLocaleString('vi-VN')} ₫`;
const formatOrderCode = (id = '') => `#SD-${id.slice(-4).toUpperCase()}`;
const formatTime = (value) => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const formatDate = (value) => new Date(value).toLocaleDateString('vi-VN');

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      pending: orders.filter(order => order.status === 'pending').length,
      confirmed: orders.filter(order => order.status === 'confirmed').length,
      delivering: orders.filter(order => order.status === 'delivering').length,
      completedToday: orders.filter(order => (
        order.status === 'completed' && new Date(order.updatedAt || order.createdAt).toDateString() === today
      )).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const haystack = [
        order._id,
        formatOrderCode(order._id),
        order.customer?.name,
        order.customer?.phone,
        order.tableNumber,
        order.staff?.name,
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [orders, search, statusFilter]);

  const updateStatus = async (order, status) => {
    setUpdatingId(order._id);
    setError('');
    try {
      const updated = await orderService.updateOrderStatus(order._id, status);
      setOrders(current => current.map(item => item._id === updated._id ? updated : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật đơn hàng');
    } finally {
      setUpdatingId('');
    }
  };

  const handlePrimaryAction = (order) => {
    const target = nextStatus[order.status];
    if (target) updateStatus(order, target);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="m-0 text-3xl font-black text-gray-950 tracking-tight">Quản lý Đơn hàng</h1>
          <p className="mt-2 text-sm text-gray-500">Theo dõi và xử lý đơn hàng theo thời gian thực.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm mã đơn, SĐT..."
              className="w-64 rounded-xl border border-red-100 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c0392b] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#c0392b]"
          >
            <option value="all">Bộ lọc</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đang chuẩn bị</option>
            <option value="delivering">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Chờ xác nhận" value={stats.pending} tone="bg-blue-50" />
        <StatCard title="Đang chuẩn bị" value={stats.confirmed} tone="bg-amber-50" />
        <StatCard title="Đang giao" value={stats.delivering} tone="bg-emerald-50" />
        <StatCard title="Hoàn thành" value={stats.completedToday} suffix="hôm nay" tone="bg-red-50" />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full min-w-[880px] border-collapse">
          <thead>
            <tr className="text-left text-[11px] font-black uppercase tracking-widest text-red-950">
              <th className="px-5 py-4">Mã đơn</th>
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Thời gian</th>
              <th className="px-5 py-4">Tổng tiền</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Thanh toán</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-gray-500">Đang tải đơn hàng...</td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-gray-500">Không có đơn hàng phù hợp.</td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const actionStatus = nextStatus[order.status];

                return (
                  <tr key={order._id} className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/60">
                    <td className="px-5 py-4 font-black leading-tight text-gray-950">{formatOrderCode(order._id)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {(order.customer?.name || 'NA').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold">{order.customer?.name || 'Khách lẻ'}</div>
                          <div className="text-xs text-gray-500">{order.customer?.phone || 'Không có SĐT'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{formatTime(order.createdAt)}</div>
                      <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-5 py-4 font-black">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${config.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{paymentLabel[order.paymentMethod] || order.paymentMethod}</div>
                      <div className={order.paymentStatus === 'paid' ? 'text-xs text-emerald-600' : 'text-xs text-amber-600'}>
                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : order.paymentStatus === 'failed' ? 'Thất bại' : 'Chưa thanh toán'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {actionStatus && (
                          <button
                            onClick={() => handlePrimaryAction(order)}
                            disabled={updatingId === order._id}
                            className="rounded-lg bg-[#c0392b] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                          >
                            {actionStatus === 'confirmed' ? 'Xác nhận' : actionStatus === 'delivering' ? 'Giao hàng' : 'Hoàn thành'}
                          </button>
                        )}
                        {!['completed', 'cancelled'].includes(order.status) && (
                          <button
                            onClick={() => updateStatus(order, 'cancelled')}
                            disabled={updatingId === order._id}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 disabled:opacity-60"
                          >
                            Hủy
                          </button>
                        )}
                        <Link
                          to={`/admin/invoices/${order._id}`}
                          className="rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-[#c0392b] no-underline"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, suffix = 'đơn', tone }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
    <div className={`absolute right-0 top-0 h-16 w-16 rounded-bl-[32px] ${tone}`} />
    <div className="relative">
      <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-red-950">{title}</div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-black text-gray-950">{String(value).padStart(2, '0')}</span>
        <span className="pb-1 text-sm font-semibold text-gray-600">{suffix}</span>
      </div>
    </div>
  </div>
);

export default CustomerOrdersPage;
