import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import publicService from '../../services/publicService';

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart, getCartTotal, getItemCount } = useCart();
  const [name, setName] = useState(localStorage.getItem('customerName') || '');
  const [phone, setPhone] = useState(localStorage.getItem('customerPhone') || '');
  const [address, setAddress] = useState(localStorage.getItem('customerAddress') || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Vui lòng nhập tên');
    if (items.length === 0) return setError('Giỏ hàng trống');

    localStorage.setItem('customerName', name);
    localStorage.setItem('customerPhone', phone);
    localStorage.setItem('customerAddress', address);

    setLoading(true);
    setError('');
    try {
      await publicService.createOrder({
        customer: { name, phone, address },
        notes,
        items: items.map(item => ({
          menuItem: item.menuItem?._id,
          comboId: item.comboId,
          quantity: item.quantity,
        })).filter(i => i.menuItem || i.comboId),
        tableNumber: '',
      });
      clearCart();
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Đặt món thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy giá hiển thị của item
  const getItemPrice = (item) => {
    if (item.type === 'combo') return item.price || 0;
    return item.menuItem?.price || 0;
  };

  const getItemName = (item) => {
    if (item.type === 'combo') return item.name || 'Combo';
    return item.menuItem?.name || 'Món';
  };

  const getItemImage = (item) => {
    if (item.type === 'combo') return item.image || null;
    return item.menuItem?.image || null;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>🛒 Giỏ hàng ({getItemCount()} món)</h2>

      {items.length === 0 ? (
        <p>Chưa có món nào. <Link to="/menu">Xem thực đơn</Link></p>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            {items.map(item => {
              const price = getItemPrice(item);
              return (
                <div key={item.type === 'combo' ? `combo-${item.comboId}` : `item-${item.menuItem?._id}`}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '15px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                  <img
                    src={getItemImage(item) ? `http://localhost:5000${getItemImage(item)}` : 'https://via.placeholder.com/80'}
                    alt={getItemName(item)}
                    style={{ width: '80px', height: '80px', borderRadius: '8px', marginRight: '15px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4>{getItemName(item)}</h4>
                    <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                      {price.toLocaleString()}₫
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => updateQuantity(
                      item.type === 'combo' ? item.comboId : item.menuItem?._id,
                      item.quantity - 1
                    )} style={qtyBtnStyle}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(
                      item.type === 'combo' ? item.comboId : item.menuItem?._id,
                      item.quantity + 1
                    )} style={qtyBtnStyle}>+</button>
                  </div>
                  <button onClick={() => removeItem(
                    item.type === 'combo' ? item.comboId : item.menuItem?._id
                  )}
                    style={{
                      background: 'none', border: 'none', color: 'red',
                      fontSize: '20px', marginLeft: '15px', cursor: 'pointer'
                    }}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Thông tin đặt món</h3>
            <input type="text" placeholder="Họ tên *" value={name} onChange={e => setName(e.target.value)}
              style={inputStyle} required />
            <input type="text" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)}
              style={inputStyle} />
            <input type="text" placeholder="Địa chỉ giao hàng (nếu có)" value={address} onChange={e => setAddress(e.target.value)}
              style={inputStyle} />
            <textarea placeholder="Ghi chú" value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} style={inputStyle} />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <h3>Tạm tính: {getCartTotal().toLocaleString()}₫</h3>
            <h2>Tổng cộng: {getCartTotal().toLocaleString()}₫</h2>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '15px', background: '#e74c3c', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold',
              cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>
            {loading ? 'Đang đặt...' : 'Đặt món'}
          </button>
        </>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const qtyBtnStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '4px',
  border: 'none',
  background: '#ddd',
  cursor: 'pointer',
  fontWeight: 'bold',
};

export default CartPage;