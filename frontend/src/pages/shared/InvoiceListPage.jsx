import React, { useState, useEffect } from 'react';
import orderService from '../../services/orderService';
import { Link } from 'react-router-dom';

const InvoiceListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const data = await orderService.getOrders(params);
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilter = () => {
    fetchOrders({ startDate, endDate });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Quản lý Hóa đơn</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>Từ:</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
        <label>Đến:</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
        <button onClick={handleFilter} style={buttonStyle}>Lọc</button>
        <button onClick={() => { setStartDate(''); setEndDate(''); fetchOrders(); }} style={resetButtonStyle}>Xóa lọc</button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={thStyle}>Mã hóa đơn</th>
              <th style={thStyle}>Khách hàng</th>
              <th style={thStyle}>Nhân viên</th>
              <th style={thStyle}>Ngày tạo</th>
              <th style={thStyle}>Tổng tiền</th>
              <th style={thStyle}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>#{order._id.slice(-6)}</td>
                <td style={tdStyle}>{order.customer?.name || 'Khách lẻ'}</td>
                <td style={tdStyle}>{order.staff?.name}</td>
                <td style={tdStyle}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                <td style={tdStyle}>{order.total.toLocaleString()}₫</td>
                <td style={tdStyle}>
                  <Link to={`/admin/invoices/${order._id}`} style={{ color: '#3498db' }}>Xem</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const inputStyle = { padding: '6px', borderRadius: '4px', border: '1px solid #ccc' };
const buttonStyle = { padding: '8px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const resetButtonStyle = { padding: '8px 15px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const thStyle = { padding: '12px 8px', textAlign: 'left' };
const tdStyle = { padding: '10px 8px' };

export default InvoiceListPage;