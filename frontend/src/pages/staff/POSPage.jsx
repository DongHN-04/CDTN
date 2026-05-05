import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import menuService from '../../services/menuService';
import orderService from '../../services/orderService';

const POSPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const { items, addItem, removeItem, updateQuantity, clearCart, getCartTotal, getItemCount } = useCart();
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuService.getMenuItems();
        setMenuItems(data);
        const cats = ['Tất cả', ...new Set(data.map(item => item.category))];
        setCategories(cats);
      } catch (error) {
        console.error('Lỗi tải thực đơn:', error);
      }
    };
    fetchMenu();
  }, []);

  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddToCart = (menuItem) => {
    if (menuItem && menuItem._id) {
      addItem(menuItem, 1);
    }
  };

  const handleCheckout = async () => {
    if (!items || items.length === 0) return alert('Giỏ hàng trống');
    setLoading(true);
    setMessage('');
    try {
      // Lọc item an toàn
      const validItems = items.filter(item => item && item.menuItem && item.menuItem._id);
      if (validItems.length === 0) {
        alert('Giỏ hàng có món không hợp lệ, vui lòng thêm lại');
        setLoading(false);
        return;
      }

      const orderData = {
        customer,
        items: validItems.map(item => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
        })),
        discount: Number(discount) || 0,
        paymentMethod,
      };

      console.log('Dữ liệu thanh toán:', orderData); // thêm log
      const order = await orderService.createOrder(orderData);
      setMessage(`Đơn hàng #${order._id.slice(-6)} đã được tạo thành công. Tổng: ${order.total.toLocaleString()}₫`);
      clearCart();
      setCustomer({ name: '', phone: '' });
      setDiscount(0);
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Không thể tạo đơn';
      setMessage('Lỗi: ' + errMsg);
      alert('❌ ' + errMsg); // bắt buộc hiển thị
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = getCartTotal();
  const grandTotal = cartTotal - (discount || 0);

  // Style cho nút tăng/giảm số lượng (an toàn)
  const qtyBtnStyle = {
    background: '#ddd',
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: 'transparent',
    width: '25px',
    height: '25px',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      {/* Cột trái: Thực đơn */}
      <div style={{
        flex: 2,
        padding: '20px',
        overflowY: 'auto',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#ddd',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <input type="text" placeholder="Tìm món..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px', width: '60%', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
          {filteredMenu.map(item => (
            <div key={item._id} onClick={() => handleAddToCart(item)}
              style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '10px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={item.image ? (item.image.startsWith('data:image') ? item.image : `http://localhost:5000${item.image}`) : 'https://via.placeholder.com/150?text=No+Image'}
                alt={item.name}
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div style={{ marginTop: '8px', fontWeight: 'bold' }}>{item.name}</div>
              <div style={{ color: '#e74c3c', fontSize: '14px' }}>{item.price.toLocaleString()}₫</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cột phải: Giỏ hàng + Thanh toán */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <h2>Giỏ hàng ({getItemCount()})</h2>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
          {items.length === 0 ? (
            <p style={{ color: '#999' }}>Chưa có món nào</p>
          ) : (
            items
              .filter(item => item.menuItem)
              .map(item => (
                <div key={item.menuItem._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: '#eee',
                }}>
                  <div style={{ flex: 2 }}>{item.menuItem.name}</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)} style={qtyBtnStyle}>-</button>
                    <span style={{ margin: '0 8px' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)} style={qtyBtnStyle}>+</button>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    {(item.menuItem.price * item.quantity).toLocaleString()}₫
                  </div>
                  <button onClick={() => removeItem(item.menuItem._id)} style={{
                    background: 'none',
                    borderWidth: 0,
                    color: 'red',
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}>&times;</button>
                </div>
              ))
          )}
        </div>
        <div style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#333', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Tạm tính:</span><span>{cartTotal.toLocaleString()}₫</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
            <span>Giảm giá:</span>
            <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
              style={{ width: '80px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }} /> ₫
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold', fontSize: '18px' }}>
            <span>Tổng cộng:</span><span>{grandTotal.toLocaleString()}₫</span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Khách hàng</label>
            <input type="text" placeholder="Tên" value={customer.name}
              onChange={e => setCustomer({ ...customer, name: e.target.value })}
              style={{ width: '100%', padding: '6px', marginBottom: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="text" placeholder="SĐT" value={customer.phone}
              onChange={e => setCustomer({ ...customer, phone: e.target.value })}
              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Thanh toán:</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
              <option value="qr">QR</option>
            </select>
          </div>
          <button onClick={handleCheckout} disabled={loading || items.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              background: '#27ae60',
              color: 'white',
              borderWidth: 0,
              borderStyle: 'none',
              borderColor: 'transparent',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: (loading || items.length === 0) ? 0.7 : 1,
            }}>
            {loading ? 'Đang xử lý...' : `Thanh toán ${grandTotal.toLocaleString()}₫`}
          </button>
          {message && (
            <div style={{ marginTop: '10px', color: message.startsWith('Lỗi') ? 'red' : 'green' }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSPage;