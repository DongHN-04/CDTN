import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const PaymentResultPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = params.get('status');
  const txnRef = params.get('txnRef');   // backend redirect về txnRef, không phải orderId
  const code = params.get('code');

  const getMessage = () => {
    switch (code) {
      case '24': return 'Bạn đã huỷ giao dịch.';
      case '51': return 'Tài khoản không đủ số dư.';
      case '65': return 'Tài khoản vượt hạn mức giao dịch.';
      case '75': return 'Ngân hàng đang bảo trì.';
      default: return 'Vui lòng thử lại hoặc chọn phương thức khác.';
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      {status === 'success' ? (
        <>
          <div style={{ fontSize: '60px' }}>✅</div>
          <h1 style={{ color: '#27ae60' }}>Thanh toán thành công!</h1>
          {txnRef && <p>Mã giao dịch: <strong>{txnRef}</strong></p>}
        </>
      ) : status === 'invalid' ? (
        <>
          <div style={{ fontSize: '60px' }}>⚠️</div>
          <h1 style={{ color: '#e67e22' }}>Chữ ký không hợp lệ</h1>
          <p>Giao dịch không được xác thực.</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: '60px' }}>❌</div>
          <h1 style={{ color: '#e74c3c' }}>Thanh toán thất bại</h1>
          <p>{getMessage()}</p>
          {code && <p style={{ color: '#999', fontSize: '13px' }}>Mã lỗi: {code}</p>}
        </>
      )}
      <Link
        to="/"
        style={{
          display: 'inline-block', marginTop: '20px',
          padding: '10px 20px', background: '#e74c3c',
          color: 'white', borderRadius: '8px', textDecoration: 'none'
        }}
      >
        Về trang chủ
      </Link>
    </div>
  );
};

export default PaymentResultPage;