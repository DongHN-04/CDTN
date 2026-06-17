import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Home, XCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const errorMessages = {
  24: 'Bạn đã huỷ giao dịch.',
  51: 'Tài khoản không đủ số dư.',
  65: 'Tài khoản vượt hạn mức giao dịch.',
  75: 'Ngân hàng đang bảo trì.',
};

const PaymentResultPage = () => {
  const location = useLocation();
  const { clearCart } = useCart();
  const { user, loading } = useAuth();
  const params = new URLSearchParams(location.search);
  const status = params.get('status');
  const txnRef = params.get('txnRef');
  // const orderId = params.get('orderId');
  const code = params.get('code');

  const isSuccess = status === 'success';
  const isPending = status === 'order-pending';
  const isInvalid = status === 'invalid' || status === 'invalid-amount';

  const title = isSuccess
    ? 'Thanh toán thành công!'
    : isPending
      ? 'Đặt hàng thành công!'
      : isInvalid
        ? 'Giao dịch không hợp lệ'
        : 'Thanh toán thất bại';

  const description = isSuccess
    ? 'Đơn hàng đã được thanh toán và chuyển sang bước chuẩn bị.'
    : isPending
      ? 'Đơn hàng đang chờ cửa hàng xác nhận trước khi giao.'
      : isInvalid
        ? 'Giao dịch không được xác thực hoặc số tiền không khớp.'
        : errorMessages[code] || 'Vui lòng thử lại hoặc chọn phương thức thanh toán khác.';

  const Icon = isSuccess || isPending ? CheckCircle2 : isInvalid ? AlertTriangle : XCircle;
  const colorClass = isSuccess || isPending ? 'text-emerald-600' : isInvalid ? 'text-amber-500' : 'text-rose-600';

  useEffect(() => {
    if (loading) return; // Chờ cho đến khi AuthContext tải xong thông tin User
    if (!isSuccess && !isPending) return;
    
    // Xóa sạch giỏ hàng trong state
    clearCart();

    // Xóa trực tiếp trong localStorage để tránh bất đồng bộ/race condition khi tải lại trang
    localStorage.removeItem('cart:guest');
    if (user?._id) {
      localStorage.removeItem(`cart:${user._id}`);
    }
    localStorage.removeItem('appliedPromo');
    localStorage.removeItem('discountAmount');
  }, [clearCart, isPending, isSuccess, loading, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-5 py-12 font-sans">
      <section className="w-full max-w-[520px] rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <Icon size={68} className={`mx-auto mb-5 ${colorClass}`} strokeWidth={1.8} />
        <h1 className={`mb-3 text-2xl font-black ${colorClass}`}>{title}</h1>
        <p className="mx-auto mb-5 max-w-[360px] text-sm font-semibold leading-6 text-gray-500">
          {description}
        </p>

        {txnRef && (
          <p className="mb-2 text-sm text-gray-500">
            Mã giao dịch: <strong className="text-gray-800">{txnRef}</strong>
          </p>
        )}
        {/* {orderId && (
          <p className="mb-2 text-sm text-gray-500">
            Mã đơn hàng: <strong className="text-gray-800">{orderId}</strong>
          </p>
        )} */}
        {code && (
          <p className="mb-2 text-xs font-semibold text-gray-400">
            Mã lỗi: {code}
          </p>
        )}

        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#c0392b] px-5 py-3 text-sm font-black text-white no-underline transition-colors hover:bg-[#a93226]"
        >
          <Home size={17} />
          Về trang chủ
        </Link>
      </section>
    </main>
  );
};

export default PaymentResultPage;
