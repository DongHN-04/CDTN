import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../../services/orderService';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getOrderById(id)
      .then(data => setOrder(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ padding: '20px' }}>Đang tải...</p>;
  if (!order) return <p style={{ padding: '20px' }}>Không tìm thấy hóa đơn.</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <Link to="/admin/invoices" style={{ color: '#3498db', marginBottom: '15px', display: 'inline-block' }}>← Quay lại danh sách</Link>
      <h2>Hóa đơn #{order._id.slice(-6)}</h2>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        <p><strong>Khách hàng:</strong> {order.customer?.name || 'Khách lẻ'} {order.customer?.phone && `- ${order.customer.phone}`}</p>
        {order.customer?.address && <p><strong>Địa chỉ:</strong> {order.customer.address}</p>}
        <p><strong>Nhân viên:</strong> {order.staff?.name}</p>
        <p><strong>Phương thức:</strong> {order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'card' ? 'Thẻ' : 'QR'}</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={thStyle}>Món</th>
            <th style={thStyle}>SL</th>
            <th style={thStyle}>Đơn giá</th>
            <th style={thStyle}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}>{item.menuItem?.name || item.name || 'Combo'}</td>
              <td style={tdStyle}>{item.quantity}</td>
              <td style={tdStyle}>{item.price?.toLocaleString()}₫</td>
              <td style={tdStyle}>{(item.price * item.quantity).toLocaleString()}₫</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ background: '#fff', padding: '20px', marginTop: '20px', borderRadius: '8px', textAlign: 'right' }}>
        <p>Tạm tính: {order.subtotal?.toLocaleString()}₫</p>
        {(order.deliveryFee || 0) > 0 && <p>Phí giao hàng: {order.deliveryFee?.toLocaleString()}₫</p>}
        <p>Giảm giá{order.promoCode ? ` (${order.promoCode})` : ''}: {order.discount?.toLocaleString()}₫</p>
        <p style={{ fontWeight: 'bold', fontSize: '18px' }}>Tổng: {order.total?.toLocaleString()}₫</p>
      </div>
    </div>
  );
};

const thStyle = { padding: '12px 8px', textAlign: 'left' };
const tdStyle = { padding: '10px 8px' };

export default InvoiceDetailPage;
