import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../contexts/CartContext';
import menuService from '../../services/menuService';
import orderService from '../../services/orderService';
import comboService from '../../services/comboService';
import promotionService from '../../services/promotionService';

const POSPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const { items, addItem, addCombo, removeItem, updateQuantity, clearCart, getCartTotal, getItemCount } = useCart();
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [combos, setCombos] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromoId, setSelectedPromoId] = useState('auto');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuData, comboData, promoData] = await Promise.all([
          menuService.getMenuItems(),
          comboService.getCombos(),
          promotionService.getPromotions()
        ]);
        setMenuItems(menuData);
        setCombos(comboData.filter(c => c.isActive));
        setPromotions(promoData.filter(p => p.isActive));
        const cats = ['Tất cả', ...new Set(menuData.map(item => item.category))];
        setCategories(cats);
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
      }
    };
    fetchData();
  }, []);

  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Danh sách khuyến mãi khả dụng cho giỏ hàng hiện tại
  const applicablePromotions = useMemo(() => {
    // Tính subtotal trực tiếp từ items (không dùng getCartTotal để tránh dependency sai)
    const subtotal = items.reduce((total, item) => {
      if (item.type === 'combo') {
        return total + (item.price * item.quantity);
      }
      if (item.menuItem?.price) {
        return total + (item.menuItem.price * item.quantity);
      }
      return total;
    }, 0);

    const now = new Date();
    const validPromos = promotions.filter(p => {
      if (!p.isActive) return false;
      if (new Date(p.startDate) > now || new Date(p.endDate) < now) return false;
      if (subtotal < p.minOrderValue) return false;
      return true;
    });

    const promoWithDiscount = validPromos.map(p => {
      let discountValue = 0;
      if (p.type === 'percent') {
        discountValue = subtotal * (p.value / 100);
      } else if (p.type === 'fixed') {
        discountValue = p.value;
      }
      if (discountValue > subtotal) discountValue = subtotal;
      return { ...p, discountValue };
    });

    // Sắp xếp giảm dần, mã giảm nhiều nhất lên đầu
    return promoWithDiscount.sort((a, b) => b.discountValue - a.discountValue);
  }, [items, promotions]); // ✅ Đúng dependency, không còn cảnh báo

  // Tự động cập nhật discount dựa trên lựa chọn
  useEffect(() => {
    if (selectedPromoId === 'auto') {
      if (applicablePromotions.length > 0) {
        setDiscount(applicablePromotions[0].discountValue);
      } else {
        setDiscount(0);
      }
    } else {
      const promo = applicablePromotions.find(p => p._id === selectedPromoId);
      if (promo) {
        setDiscount(promo.discountValue);
      } else {
        setSelectedPromoId('auto'); // Mã đã chọn không còn khả dụng
      }
    }
  }, [selectedPromoId, applicablePromotions]);

  const handleAddToCart = (menuItem) => {
    if (menuItem && menuItem._id) addItem(menuItem, 1);
  };

  const handleAddComboToCart = (combo) => {
    if (!combo.items || combo.items.length === 0) {
      alert('Combo này chưa có món nào.');
      return;
    }
    addCombo(combo, 1);
  };

  const handleCheckout = async () => {
    if (!items || items.length === 0) return alert('Giỏ hàng trống');
    setLoading(true);
    setMessage('');
    try {
      const orderItems = items.map(item => {
        if (item.type === 'combo') {
          return { comboId: item.comboId, quantity: item.quantity };
        } else {
          return { menuItem: item.menuItem._id, quantity: item.quantity };
        }
      });

      const orderData = {
        customer,
        items: orderItems,
        discount: discount,
        paymentMethod,
        promotionId: selectedPromoId !== 'auto' ? selectedPromoId : null
      };

      console.log('Dữ liệu thanh toán:', orderData);
      const order = await orderService.createOrder(orderData);
      setMessage(`Đơn hàng #${order._id.slice(-6)} đã được tạo thành công. Tổng: ${order.total.toLocaleString()}₫`);
      clearCart();
      setCustomer({ name: '', phone: '' });
      setSelectedPromoId('auto');
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Không thể tạo đơn';
      setMessage('Lỗi: ' + errMsg);
      alert('❌ ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = getCartTotal();
  const grandTotal = cartTotal - discount;

  const qtyBtnStyle = {
    background: '#ddd', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent',
    width: '25px', height: '25px', borderRadius: '4px', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      {/* Cột trái: Thực đơn + Combo */}
      <div style={{
        flex: 2, padding: '20px', overflowY: 'auto',
        borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: '#ddd',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <input type="text" placeholder="Tìm món..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px', width: '60%', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Combo */}
        {selectedCategory === 'Tất cả' && combos.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#e67e22', marginBottom: '10px' }}>🎁 Combo Ưu Đãi</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {combos.map(combo => (
                <div key={combo._id} onClick={() => handleAddComboToCart(combo)}
                  style={{
                    background: '#fff7e6', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '10px', cursor: 'pointer', transition: 'transform 0.2s', textAlign: 'center',
                    border: '1px solid #f39c12'
                  }}>
                  {combo.image ? (
                    <img src={combo.image} alt={combo.name}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: '100%', height: '120px', backgroundColor: '#f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>COMBO</div>
                  )}
                  <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#c0392b' }}>{combo.name}</div>
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    {combo.items?.map(i => `${i.menuItem?.name || 'Món'} x${i.quantity}`).join(', ')}
                  </div>
                  <div style={{ color: '#e74c3c', fontSize: '16px', fontWeight: 'bold' }}>
                    {combo.price.toLocaleString()}₫
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Món thường */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
          {filteredMenu.map(item => (
            <div key={item._id} onClick={() => handleAddToCart(item)}
              style={{
                background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '10px', cursor: 'pointer', transition: 'transform 0.2s', textAlign: 'center',
              }}>
              {item.image ? (
                <img src={item.image.startsWith('data:image') ? item.image : `http://localhost:5000${item.image}`}
                  alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div style={{ width: '100%', height: '120px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: '#999' }}>No Image</div>
              )}
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
            items.map(item => {
              if (item.type === 'combo') {
                return (
                  <div key={`combo-${item.comboId}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#eee',
                  }}>
                    <div style={{ flex: 2 }}><strong>{item.name}</strong> (Combo)</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => updateQuantity(item.comboId, item.quantity - 1)} style={qtyBtnStyle}>-</button>
                      <span style={{ margin: '0 8px' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.comboId, item.quantity + 1)} style={qtyBtnStyle}>+</button>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString()}₫</div>
                    <button onClick={() => removeItem(item.comboId)} style={{
                      background: 'none', borderWidth: 0, color: 'red', fontSize: '16px', cursor: 'pointer',
                    }}>×</button>
                  </div>
                );
              } else {
                return (
                  <div key={`item-${item.menuItem._id}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#eee',
                  }}>
                    <div style={{ flex: 2 }}>{item.menuItem.name}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)} style={qtyBtnStyle}>-</button>
                      <span style={{ margin: '0 8px' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)} style={qtyBtnStyle}>+</button>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>{(item.menuItem.price * item.quantity).toLocaleString()}₫</div>
                    <button onClick={() => removeItem(item.menuItem._id)} style={{
                      background: 'none', borderWidth: 0, color: 'red', fontSize: '16px', cursor: 'pointer',
                    }}>×</button>
                  </div>
                );
              }
            })
          )}
        </div>

        {/* Khu vực mã giảm giá và thanh toán */}
        <div style={{ borderTopWidth: 2, borderTopStyle: 'solid', borderTopColor: '#333', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Tạm tính:</span><span>{cartTotal.toLocaleString()}₫</span>
          </div>

          {/* Dropdown chọn mã giảm giá */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Mã giảm giá:</label>
            <select
              value={selectedPromoId}
              onChange={e => setSelectedPromoId(e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="auto">Tự động (chọn tốt nhất)</option>
              {applicablePromotions.map(promo => (
                <option key={promo._id} value={promo._id}>
                  {promo.name} - Giảm {promo.discountValue.toLocaleString()}₫ ({promo.type === 'percent' ? promo.value + '%' : promo.value + '₫'})
                </option>
              ))}
              {applicablePromotions.length === 0 && (
                <option disabled>Không có mã phù hợp</option>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Giảm giá:</span>
            <span>- {discount.toLocaleString()}₫</span>
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
              width: '100%', padding: '12px', background: '#27ae60', color: 'white',
              borderWidth: 0, borderStyle: 'none', borderColor: 'transparent', borderRadius: '6px',
              fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
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