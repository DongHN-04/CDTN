import React, { useState, useEffect } from 'react';
import orderService from '../../services/orderService';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);

  const fetchPending = async () => {
    try {
      const data = await orderService.getPendingOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleConfirm = async (id) => {
    if (window.confirm('Xác nhận đơn hàng này?')) {
      try {
        await orderService.confirmOrder(id);
        fetchPending(); // refresh
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi xác nhận');
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Đơn hàng từ khách</h2>
      {orders.length === 0 && <p>Không có đơn đang chờ.</p>}
      <div style={{ display: 'grid', gap: '15px' }}>
        {orders.map(order => (
          <div key={order._id} style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <p><strong>Khách:</strong> {order.customer?.name} - Bàn: {order.tableNumber || '?'}</p>
            <p><strong>Món:</strong> {order.items.map(i => `${i.menuItem?.name || i.name} x${i.quantity}`).join(', ')}</p>
            <p><strong>Tổng:</strong> {order.total.toLocaleString()}₫</p>
            <p><strong>Ghi chú:</strong> {order.notes || 'Không có'}</p>
            <button onClick={() => handleConfirm(order._id)}
              style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              Xác nhận
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerOrdersPage;