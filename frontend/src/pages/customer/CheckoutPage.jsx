import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import publicService from '../../services/publicService';
import paymentService from '../../services/paymentService';
import { getImageUrl } from '../../utils/imageUrl';
import { findUsablePromotion, normalizePromoCode } from '../../utils/promotionUtils';

// Định nghĩa defaultImages
const defaultImages = {
  'Burger': '/images/home/product-burger.png',
  'Gà Rán': '/images/home/product-chicken.png',
  'Pizza': '/images/home/product-pizza.png',
  'Đồ Uống': '/images/home/product-sandwich.png',
  'Tráng Miệng': '/images/home/product-sandwich.png',
  'Khai Vị': '/images/home/product-chicken.png',
};

const formatPrice = (val) => val.toLocaleString('vi-VN') + 'đ';

const CheckoutPage = () => {
  const { items, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận thông tin giảm giá từ giỏ hàng chuyển sang
  const initialDiscount = location.state?.discount || Number(localStorage.getItem('discountAmount')) || 0;
  const initialPromo = location.state?.promoCode || localStorage.getItem('appliedPromo') || '';

  // Form states
  const [name, setName] = useState(localStorage.getItem('customerName') || 'Nguyễn Văn A');
  const [phone, setPhone] = useState(localStorage.getItem('customerPhone') || '0901234567');
  const [address, setAddress] = useState(localStorage.getItem('customerAddress') || '');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('Hồ Chí Minh');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' (COD), 'vnpay', 'momo'
  const [promoCode, setPromoCode] = useState(initialPromo);
  const [discount, setDiscount] = useState(initialDiscount);
  const [promotions, setPromotions] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showMoMoModal, setShowMoMoModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Danh sách Quận Huyện ở TP.HCM
  const districts = [
    'Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 
    'Tân Bình', 'Bình Thạnh', 'Bình Tân', 'Gò Vấp', 'Thủ Đức'
  ];

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  useEffect(() => {
    publicService.getPromotions()
      .then(data => setPromotions(data || []))
      .catch(() => setPromotions([]));
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleApplyPromo = () => {
    const code = normalizePromoCode(promoCode);
    if (!code) return;

    const { promotion, discount: promoDiscount, error } = findUsablePromotion(promotions, code, getCartTotal());
    if (error) {
      showToast(error, 'error');
      return;
    }

    setPromoCode(promotion.name);
    setDiscount(promoDiscount);
    localStorage.setItem('appliedPromo', promotion.name);
    localStorage.setItem('discountAmount', String(promoDiscount));
    showToast(`Áp dụng mã "${promotion.name}" thành công.`, 'success');
  };

  // Nộp đơn hàng
  const handleSubmitOrder = async () => {
    if (!name.trim()) return setError('Vui lòng nhập họ và tên');
    if (!phone.trim()) return setError('Vui lòng nhập số điện thoại');
    if (!address.trim()) return setError('Vui lòng nhập địa chỉ chi tiết');
    if (!district) return setError('Vui lòng chọn Quận/Huyện');

    setLoading(true);
    setError('');

    // Ghép địa chỉ hoàn chỉnh
    const fullAddress = `${address}, ${district}, ${city}`;

    // Lưu thông tin khách hàng vào local storage
    localStorage.setItem('customerName', name);
    localStorage.setItem('customerPhone', phone);
    localStorage.setItem('customerAddress', address);

    try {
      // 1. Tạo đơn hàng trên backend
      const orderData = {
        customer: { name, phone, address: fullAddress },
        notes: notes || '',
        paymentMethod,
        promoCode: normalizePromoCode(promoCode),
        items: items.map(item => ({
          menuItem: item.menuItem?._id,
          comboId: item.comboId,
          quantity: item.quantity,
        })).filter(i => i.menuItem || i.comboId),
      };

      const order = await publicService.createOrder(orderData);

      // Xóa thông tin giảm giá lưu trữ
      localStorage.removeItem('appliedPromo');
      localStorage.removeItem('discountAmount');

      // 2. Xử lý theo từng phương thức thanh toán
      if (paymentMethod === 'vnpay') {
        // Thanh toán online qua VNPay
        const { paymentUrl } = await paymentService.createPayment({
          orderId: order._id,
          amount: order.total,
        });
        clearCart();
        window.location.href = paymentUrl; // Chuyển hướng tới cổng VNPay thật
      } else if (paymentMethod === 'momo') {
        // Ví MoMo: Hiển thị giao diện QR Code thanh toán giả lập siêu sang chảnh!
        setCreatedOrder(order);
        setShowMoMoModal(true);
      } else {
        // COD (Tiền mặt)
        clearCart();
        navigate(`/payment-result?status=success&txnRef=${order._id}`);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMoMoPaid = () => {
    setShowMoMoModal(false);
    clearCart();
    if (createdOrder) {
      navigate(`/payment-result?status=success&txnRef=${createdOrder._id}`);
    } else {
      navigate('/');
    }
  };

  // Chuẩn hóa URL ảnh để chạy được cả local và khi deploy.
  const getResolvedImage = (item) => {
    const rawImg = item.type === 'combo' ? item.image : item.menuItem?.image;
    if (!rawImg) {
      const cat = item.type === 'combo' ? 'Burger' : (item.menuItem?.category || 'Burger');
      return defaultImages[cat] || '/images/home/product-burger.png';
    }
    return getImageUrl(rawImg, defaultImages[item.menuItem?.category] || '/images/home/product-burger.png');
  };

  const getItemName = (item) => {
    return item.type === 'combo' ? item.name : item.menuItem?.name;
  };

  const getItemPrice = (item) => {
    return item.type === 'combo' ? item.price : (item.menuItem?.price || 0);
  };

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 15000 : 0; // Phí ship 15k như trong hình mẫu
  const total = Math.max(0, subtotal + deliveryFee - discount);

  return (
    <div className="bg-[#f9fafb] min-h-screen font-sans pb-16">
      
      {/* ===== HEADER TỐI GIẢN (🔒 Thanh toán an toàn) ===== */}
      <header className="bg-white border-b border-gray-100 py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between">
          <Link to="/" className="no-underline flex items-center gap-2">
            <div className="w-9 h-9 bg-[#c0392b] rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
              </svg>
            </div>
            <span className="text-[#c0392b] text-base font-black italic tracking-tight">Sơn Đông FastFood</span>
          </Link>

          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 shadow-inner">
            <span>🔒</span>
            <span>Thanh toán an toàn</span>
          </div>
        </div>
      </header>

      {/* ===== CHÍNH ===== */}
      <main className="max-w-[1200px] mx-auto px-5 mt-10">
        <h1 className="text-[25px] font-black text-gray-800 mb-8 tracking-tight">
          Thông tin đơn hàng
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC THANH TOÁN */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* 1. ĐỊA CHỈ GIAO HÀNG */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
              <h2 className="text-[17px] font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-4 m-0">
                <span className="text-lg">📍</span>
                Địa chỉ giao hàng
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    Họ và Tên
                  </label>
                  <input 
                    type="text" 
                    placeholder="Họ tên người nhận" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    Số điện thoại
                  </label>
                  <input 
                    type="text" 
                    placeholder="Số điện thoại liên hệ" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Địa chỉ chi tiết
                </label>
                <input 
                  type="text" 
                  placeholder="Số nhà, Tên đường, Phường/Xã..." 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    Quận/Huyện
                  </label>
                  <select 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Chọn Quận/Huyện</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    Thành phố
                  </label>
                  <select 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Ghi chú cho tài xế (Tuỳ chọn)
                </label>
                <textarea 
                  placeholder="Ví dụ: Gọi trước khi đến 5 phút..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white transition-all resize-none"
                />
              </div>

            </div>

            {/* 2. PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
              <h2 className="text-[17px] font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-4 m-0">
                <span className="text-lg">💳</span>
                Phương thức thanh toán
              </h2>

              <div className="flex flex-col gap-3.5">
                
                {/* Option 1: COD */}
                <label 
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-[#c0392b] bg-red-50/20' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="accent-[#c0392b] w-4.5 h-4.5 cursor-pointer shrink-0"
                  />
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg text-gray-600 shrink-0">
                    🚚
                  </div>
                  <div>
                    <span className="block text-[14px] font-extrabold text-gray-800">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="block text-gray-400 text-xs mt-0.5">
                      Thanh toán bằng tiền mặt khi tài xế giao hàng
                    </span>
                  </div>
                </label>

                {/* Option 2: VNPay */}
                <label 
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                    paymentMethod === 'vnpay' 
                      ? 'border-[#c0392b] bg-red-50/20' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={() => setPaymentMethod('vnpay')}
                    className="accent-[#c0392b] w-4.5 h-4.5 cursor-pointer shrink-0"
                  />
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg text-gray-600 shrink-0 font-bold text-sky-600">
                    🏛️
                  </div>
                  <div>
                    <span className="block text-[14px] font-extrabold text-gray-800">
                      Thanh toán VNPay
                    </span>
                    <span className="block text-gray-400 text-xs mt-0.5">
                      Quét mã QR qua ứng dụng ngân hàng
                    </span>
                  </div>
                </label>

                {/* Option 3: MoMo */}
                <label 
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                    paymentMethod === 'momo' 
                      ? 'border-[#c0392b] bg-red-50/20' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={() => setPaymentMethod('momo')}
                    className="accent-[#c0392b] w-4.5 h-4.5 cursor-pointer shrink-0"
                  />
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg text-gray-600 shrink-0">
                    💳
                  </div>
                  <div>
                    <span className="block text-[14px] font-extrabold text-gray-800">
                      Ví MoMo
                    </span>
                    <span className="block text-gray-400 text-xs mt-0.5">
                      Thanh toán nhanh chóng qua ví điện tử MoMo
                    </span>
                  </div>
                </label>

              </div>
            </div>

          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* ORDER SUMMARY CARD */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
              <h2 className="text-[17px] font-extrabold text-gray-800 border-b border-gray-50 pb-4 m-0">
                Tóm tắt đơn hàng
              </h2>

              {/* Items List */}
              <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const image = getResolvedImage(item);
                  const name = getItemName(item);
                  const price = getItemPrice(item);
                  const id = item.type === 'combo' ? item.comboId : item.menuItem?._id;

                  return (
                    <div key={`${id}-${idx}`} className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-50">
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[13px] font-extrabold text-gray-800 leading-snug line-clamp-1 mb-0.5">
                          {name}
                        </h4>
                        <span className="text-gray-400 text-[11px] font-semibold">
                          Số lượng: {item.quantity}
                        </span>
                      </div>
                      <span className="text-[14px] font-bold text-gray-700 shrink-0">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Promo input */}
              <div className="flex gap-2 border-t border-gray-50 pt-5 mt-2">
                <input 
                  type="text" 
                  placeholder="Mã khuyến mãi" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white transition-all"
                />
                <button 
                  onClick={handleApplyPromo}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-5 py-2.5 rounded-xl border-none cursor-pointer transition-colors shrink-0"
                >
                  Áp dụng
                </button>
              </div>

              {/* Price calculations */}
              <div className="flex flex-col gap-3 border-t border-b border-gray-50 py-4 my-1">
                <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                  <span>Tạm tính</span>
                  <span className="text-gray-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                  <span>Phí giao hàng</span>
                  <span className="text-gray-800">{formatPrice(deliveryFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm font-semibold text-[#c0392b]">
                    <span>Giảm giá</span>
                    <span className="font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-end">
                <span className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Tổng cộng
                </span>
                <span className="text-[#c0392b] text-[24px] font-black leading-none">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Error boundary */}
              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-rose-600 text-xs font-semibold">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit Order Button */}
              <button 
                onClick={handleSubmitOrder}
                disabled={loading}
                className="w-full py-4 bg-[#c0392b] hover:bg-[#a93226] text-white font-black text-[15px] rounded-2xl flex items-center justify-center gap-2 border-none cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <span className="block text-center text-gray-400 text-[11px] font-semibold">
                Bằng việc đặt hàng, bạn đồng ý với{' '}
                <Link to="/about" className="text-[#c0392b] hover:underline no-underline font-bold">
                  Điều khoản dịch vụ
                </Link>{' '}
                của chúng tôi.
              </span>

            </div>

          </div>

        </div>
      </main>

      {/* ===== FOOTER TỐI GIẢN TƯƠNG ĐỒNG 100% ẢNH MẪU ===== */}
      <footer className="mt-20 border-t border-gray-100 pt-10 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6 pb-10">
          <div className="leading-tight shrink-0 text-center md:text-left">
            <span className="block text-[#c0392b] text-base font-black italic tracking-tight">Sơn Đông FastFood</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-gray-400 font-semibold">
            <Link to="/about" className="hover:text-gray-600 no-underline transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-gray-600 no-underline transition-colors">Terms of Service</Link>
            <Link to="/about" className="hover:text-gray-600 no-underline transition-colors">FAQ</Link>
            <Link to="/about" className="hover:text-gray-600 no-underline transition-colors">Careers</Link>
          </div>

          <span className="text-gray-400 text-xs font-semibold text-center md:text-right shrink-0">
            © 2026 Sơn Đông FastFood. All rights reserved.
          </span>
        </div>
      </footer>

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce duration-300">
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500 text-white text-[11px] font-bold">
            ✓
          </div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ===== MOMO QR PAY MODAL ===== */}
      {showMoMoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-3xl max-w-[420px] w-full p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl border border-gray-50 relative animate-fade-in duration-300">
            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-2xl mb-4 shrink-0">
              💳
            </div>
            
            <h3 className="text-lg font-black text-gray-800 m-0 mb-1">
              Quét mã MoMo để thanh toán
            </h3>
            <p className="text-gray-400 text-xs mb-6 max-w-[280px]">
              Vui lòng mở ứng dụng ví MoMo để quét mã thanh toán đơn hàng.
            </p>

            {/* QR Code Placeholder/Generated Box */}
            <div className="w-48 h-48 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center p-3.5 mb-6 shadow-inner relative">
              {/* Fake QR design elements */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-4 border-l-4 border-pink-500 rounded-tl-sm" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-4 border-r-4 border-pink-500 rounded-tr-sm" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-4 border-l-4 border-pink-500 rounded-bl-sm" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-4 border-r-4 border-pink-500 rounded-br-sm" />
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MoMoPay_Order_${createdOrder?._id}_Amount_${total}`} 
                alt="MoMo QR Code" 
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>

            <div className="flex flex-col gap-1.5 mb-8">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Số tiền cần thanh toán
              </span>
              <span className="text-xl font-black text-pink-600 leading-none">
                {formatPrice(total)}
              </span>
            </div>

            <button 
              onClick={handleConfirmMoMoPaid}
              className="w-full py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-sm rounded-xl border-none cursor-pointer shadow-md hover:shadow-lg transition-all focus:outline-none"
            >
              Xác nhận đã thanh toán
            </button>
            
            <button 
              onClick={() => {
                setShowMoMoModal(false);
                clearCart();
                navigate('/');
              }}
              className="w-full py-3 mt-2 bg-transparent text-gray-400 font-bold text-xs rounded-xl border-none cursor-pointer hover:text-gray-600 transition-colors focus:outline-none"
            >
              Thanh toán sau (COD)
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default CheckoutPage;
