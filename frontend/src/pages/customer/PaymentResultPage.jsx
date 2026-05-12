import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const PaymentResultPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = params.get('status');
  const orderId = params.get('orderId');

  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      {status === 'success' ? (
        <>
          <div style={{ fontSize: '60px' }}>✅</div>
          <h1>Thanh toán thành công!</h1>
          <p>Đơn hàng #{orderId?.slice(-6)} đã được xác nhận.</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: '60px' }}>❌</div>
          <h1>Thanh toán thất bại</h1>
          <p>Vui lòng thử lại hoặc chọn phương thức khác.</p>
        </>
      )}
      <Link to="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: '#e74c3c', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
        Về trang chủ
      </Link>
    </div>
  );
};

export default PaymentResultPage;