import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, CalendarClock, ReceiptText, UserRound } from 'lucide-react';
import orderService from '../../services/orderService';
import { useToast } from '../../contexts/ToastContext';

const statusConfig = {
  pending: { label: 'Chờ xác nhận', className: 'bg-blue-50 text-blue-700' },
  confirmed: { label: 'Đang chuẩn bị', className: 'bg-amber-50 text-amber-700' },
  delivering: { label: 'Đang giao', className: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Hoàn thành', className: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700' },
};

const paymentMethodLabels = {
  cash: 'COD',
  card: 'Thẻ',
  qr: 'VNPay',
};

const paymentStatusLabels = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  failed: 'Thanh toán lỗi',
};

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
const formatOrderCode = (id = '') => `#SD-${id.slice(-6).toUpperCase()}`;
const formatDateTime = (value) => {
  if (!value) return 'Không có dữ liệu';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await orderService.getOrderById(id);
        if (mounted) setOrder(data);
      } catch (err) {
        if (mounted) {
          const message = err.response?.data?.message || 'Không thể tải chi tiết đơn hàng';
          setError(message);
      showToast(message, 'error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [id, showToast]);

  const status = statusConfig[order?.status] || statusConfig.pending;
  const items = order?.items || [];
  const staffName = order?.staffSnapshot?.name || order?.staff?.name || 'Chưa có nhân viên';
  const orderTypeLabel = order?.isCustomerOrder ? 'Đơn giao hàng' : 'Đơn tại quầy';
  const paymentStatusClass = order?.paymentStatus === 'paid'
    ? 'bg-emerald-50 text-emerald-700'
    : order?.paymentStatus === 'failed'
      ? 'bg-red-50 text-red-700'
      : 'bg-amber-50 text-amber-700';

  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-sm font-bold text-gray-500 shadow-sm ring-1 ring-gray-100">
        Đang tải chi tiết đơn hàng...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl">
        <Link to="/admin/invoices" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#c70d1a] no-underline">
          <ArrowLeft size={17} />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/admin/invoices" className="mb-3 inline-flex items-center gap-2 text-sm font-black text-[#c70d1a] no-underline">
            <ArrowLeft size={17} />
            Quay lại danh sách
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">
              Chi tiết đơn {formatOrderCode(order._id)}
            </h1>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Tạo lúc {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#c70d1a] px-6 py-4 text-right text-white shadow-sm">
          <div className="text-xs font-black uppercase tracking-widest text-red-100">Tổng thanh toán</div>
          <div className="mt-1 text-3xl font-black">{formatCurrency(order.total)}</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-4">
        <InfoCard
          icon={<UserRound size={20} />}
          label="Khách hàng"
          title={order.customer?.name || 'Khách lẻ'}
          detail={order.customer?.phone || 'Không có SĐT'}
        />
        <InfoCard
          icon={<CalendarClock size={20} />}
          label="Thời gian"
          title={formatDateTime(order.createdAt)}
          detail={order.tableNumber ? `Bàn ${order.tableNumber}` : orderTypeLabel}
        />
        <InfoCard
          icon={<Banknote size={20} />}
          label="Thanh toán"
          title={paymentMethodLabels[order.paymentMethod] || order.paymentMethod || 'Không rõ'}
          detail={paymentStatusLabels[order.paymentStatus] || order.paymentStatus || 'Chưa có trạng thái'}
          detailClassName={paymentStatusClass}
        />
        <InfoCard
          icon={<ReceiptText size={20} />}
          label="Nhân viên"
          title={staffName}
          detail={`${totalItems} sản phẩm`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-50 px-6 py-5">
            <h2 className="m-0 text-xl font-black text-gray-950">Sản phẩm trong đơn</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-[#fbf8f7] text-left text-[11px] font-black uppercase tracking-widest text-red-950">
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Phân loại</th>
                  <th className="px-6 py-4 text-center">SL</th>
                  <th className="px-6 py-4 text-right">Đơn giá</th>
                  <th className="px-6 py-4 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm font-bold text-gray-500">
                      Đơn hàng chưa có sản phẩm.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={`${item.menuItem || item.comboId || item.name}-${index}`} className="border-t border-gray-50 text-sm">
                      <td className="px-6 py-4">
                        <div className="font-black text-gray-950">{item.name || item.menuItem?.name || 'Sản phẩm đã xóa'}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-500">{item.category || (item.comboId ? 'Combo' : 'Món lẻ')}</td>
                      <td className="px-6 py-4 text-center font-black">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-4 text-right font-black text-[#c70d1a]">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="m-0 text-lg font-black text-gray-950">Thông tin giao hàng</h2>
            <div className="mt-4 space-y-3 text-sm">
              <InfoLine label="Người nhận" value={order.customer?.name || 'Khách lẻ'} />
              <InfoLine label="Số điện thoại" value={order.customer?.phone || 'Không có SĐT'} />
              <InfoLine
                label={order.isCustomerOrder ? 'Địa chỉ giao hàng' : 'Hình thức'}
                value={order.isCustomerOrder ? (order.customer?.address || 'Không có địa chỉ') : 'Thanh toán tại quầy POS'}
              />
              {order.notes && <InfoLine label="Ghi chú" value={order.notes} />}
              {order.status === 'cancelled' && order.cancelReason && (
                <InfoLine label="Lý do hủy" value={order.cancelReason} />
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="m-0 text-lg font-black text-gray-950">Tổng kết thanh toán</h2>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryLine label="Tạm tính" value={formatCurrency(order.subtotal)} />
              <SummaryLine label="Phí giao hàng" value={formatCurrency(order.deliveryFee)} />
              <SummaryLine
                label={order.promoCode ? `Giảm giá (${order.promoCode})` : 'Giảm giá'}
                value={`-${formatCurrency(order.discount)}`}
              />
              <div className="border-t border-gray-100 pt-4">
                <SummaryLine label="Tổng cộng" value={formatCurrency(order.total)} strong />
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, title, detail, detailClassName = 'text-gray-500' }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#c70d1a]">{icon}</div>
    <div className="text-[11px] font-black uppercase tracking-widest text-red-950">{label}</div>
    <div className="mt-2 line-clamp-2 text-base font-black text-gray-950">{title}</div>
    <div className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-bold ${detailClassName}`}>{detail}</div>
  </div>
);

const InfoLine = ({ label, value }) => (
  <div>
    <div className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</div>
    <div className="mt-1 font-bold text-gray-800">{value}</div>
  </div>
);

const SummaryLine = ({ label, value, strong = false }) => (
  <div className={`flex items-center justify-between gap-4 ${strong ? 'text-lg font-black text-gray-950' : 'font-bold text-gray-600'}`}>
    <span>{label}</span>
    <span className={strong ? 'text-[#c70d1a]' : 'text-gray-950'}>{value}</span>
  </div>
);

export default InvoiceDetailPage;
