import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import publicService from '../../services/publicService';
import { getImageUrl } from '../../utils/imageUrl';
import { findUsablePromotion, normalizePromoCode } from '../../utils/promotionUtils';
import { getSavedPromotions } from '../../utils/savedPromotions';

// Định nghĩa defaultImages
const defaultImages = {
  'Burger': '/images/home/product-burger.png',
  'Gà Rán': '/images/home/product-chicken.png',
  'Pizza': '/images/home/product-pizza.png',
  'Đồ Uống': '/images/home/product-sandwich.png',
  'Tráng Miệng': '/images/home/product-sandwich.png',
  'Khai Vị': '/images/home/product-chicken.png',
};

const formatPrice = (val) => val.toLocaleString('vi-VN') + ' VNĐ';

const CartPage = () => {
  const { items, removeItem, updateQuantity, getCartTotal, refreshCartProducts } = useCart();
  const { user } = useAuth();
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const [savedPromotions, setSavedPromotions] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  // Load promo code from local storage if exists
  useEffect(() => {
    const savedPromo = localStorage.getItem('appliedPromo');
    const savedDiscount = localStorage.getItem('discountAmount');
    if (savedPromo) {
      setAppliedPromo(savedPromo);
      setPromoInput(savedPromo);
      setDiscountAmount(Number(savedDiscount || 0));
    }
  }, []);

  useEffect(() => {
    publicService.getPromotions()
      .then(data => setPromotions(data || []))
      .catch(() => setPromotions([]));
  }, []);

  useEffect(() => {
    setSavedPromotions(getSavedPromotions(user));
  }, [user]);

  useEffect(() => {
    Promise.all([publicService.getMenu(), publicService.getCombos()])
      .then(([menuItems, combos]) => refreshCartProducts({ menuItems, combos }))
      .catch(() => {});
  }, [refreshCartProducts]);

  useEffect(() => {
    if (!appliedPromo) return;

    const currentSubtotal = getCartTotal();
    const currentDiscountBase = currentSubtotal + (currentSubtotal > 0 ? 15000 : 0);
    const { discount, error } = findUsablePromotion(promotions, appliedPromo, currentDiscountBase);
    if (error || discount <= 0) {
      setPromoInput('');
      setAppliedPromo('');
      setDiscountAmount(0);
      localStorage.removeItem('appliedPromo');
      localStorage.removeItem('discountAmount');
      return;
    }

    setPromoInput(appliedPromo);
    setDiscountAmount(discount);
    localStorage.setItem('discountAmount', String(discount));
  }, [items, promotions, appliedPromo, getCartTotal]);

  const handleApplyPromo = (selectedCode = promoInput) => {
    const code = normalizePromoCode(selectedCode);
    if (!code) {
      setAppliedPromo('');
      setDiscountAmount(0);
      localStorage.removeItem('appliedPromo');
      localStorage.removeItem('discountAmount');
      return;
    }

    const currentSubtotal = getCartTotal();
    const currentDiscountBase = currentSubtotal + (currentSubtotal > 0 ? 15000 : 0);
    const { promotion, discount, error } = findUsablePromotion(promotions, code, currentDiscountBase);
    if (error) {
      setPromoInput('');
      setAppliedPromo('');
      setDiscountAmount(0);
      localStorage.removeItem('appliedPromo');
      localStorage.removeItem('discountAmount');
      showToast(error, 'error');
      return;
    }

    setDiscountAmount(discount);
    setAppliedPromo(promotion.name);
    localStorage.setItem('appliedPromo', promotion.name);
    localStorage.setItem('discountAmount', String(discount));
    showToast(`Áp dụng mã "${promotion.name}" thành công.`, 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleCheckoutRedirect = () => {
    if (items.length === 0) {
      showToast('Giỏ hàng đang trống.', 'error');
      return;
    }
    // Chuyển mã khuyến mãi sang checkout; backend sẽ tự tính lại số tiền giảm để chống sửa dữ liệu.
    navigate('/checkout', { 
      state: { 
        discount: discountAmount, 
        promoCode: appliedPromo 
      } 
    });
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

  const getItemId = (item) => {
    return item.type === 'combo' ? item.comboId : item.menuItem?._id;
  };

  // Tính toán các thông số tiền tệ
  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 15000 : 0; // Đồng bộ với phí giao hàng backend đang tính cho đơn giao tận nơi.
  const discountBase = subtotal + deliveryFee;
  const total = Math.max(0, discountBase - discountAmount);
  const savedUsablePromotions = useMemo(() => {
    const savedCodes = new Set(savedPromotions.map(promo => normalizePromoCode(promo.name)));
    return promotions.filter(promo => savedCodes.has(normalizePromoCode(promo.name)));
  }, [promotions, savedPromotions]);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-12 font-sans">
      {/* Title */}
      <h1 className="text-3xl font-black text-gray-800 mb-10 tracking-tight">
        Giỏ Hàng Của Bạn
      </h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <span className="text-6xl block mb-6">🛒</span>
          <h3 className="text-xl font-black text-gray-800 mb-2">Giỏ hàng của bạn đang trống</h3>
          <p className="text-gray-400 text-[15px] mb-8">
            Hãy khám phá các món ăn tuyệt hảo của Sơn Đông FastFood và thêm vào giỏ hàng ngay nhé!
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#c0392b] text-white font-bold text-[15px] hover:bg-[#a93226] hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg no-underline cursor-pointer"
          >
            Khám phá Thực đơn
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: DANH SÁCH MÓN ĂN */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {items.map((item) => {
              const price = getItemPrice(item);
              const itemId = getItemId(item);
              const name = getItemName(item);
              const image = getResolvedImage(item);
              
              // Tạo nhãn mô tả phụ giả lập theo ảnh mẫu
              const subDescription = item.type === 'combo' 
                ? 'Combo đầy đủ nước và khoai tây chiên' 
                : item.menuItem?.category === 'Burger' 
                  ? 'Thêm dưa chua, không hành' 
                  : 'Ăn kèm sốt tương cà đặc trưng';

              // Tính giá cũ giả lập (strike-through) cao hơn 10%
              const fakeOldPrice = Math.round(price * 1.1);

              return (
                <div 
                  key={itemId}
                  className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col sm:flex-row items-center gap-5 shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-50">
                    <img 
                      src={image} 
                      alt={name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-[17px] font-extrabold text-gray-800 leading-snug mb-1">
                      {name}
                    </h3>
                    <p className="text-gray-400 text-xs mb-4 sm:mb-3">
                      {subDescription}
                    </p>

                    {/* Quantity Selector */}
                    <div className="inline-flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-1.5 shrink-0">
                      <button 
                        onClick={() => updateQuantity(itemId, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800 font-extrabold text-lg bg-transparent border-none cursor-pointer select-none"
                      >
                        −
                      </button>
                      <span className="text-[14px] font-black text-gray-700 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(itemId, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800 font-extrabold text-lg bg-transparent border-none cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price info & Delete button */}
                  <div className="flex flex-col items-center sm:items-end justify-between self-stretch shrink-0 pt-2 sm:pt-0">
                    {/* Delete button (trash bin) */}
                    <button 
                      onClick={() => removeItem(itemId)}
                      className="sm:absolute sm:top-5 sm:right-5 text-gray-300 hover:text-[#c0392b] bg-transparent border-none cursor-pointer p-1 transition-colors"
                      title="Xóa khỏi giỏ hàng"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>

                    {/* Price displays */}
                    <div className="text-center sm:text-right mt-2 sm:mt-auto">
                      <span className="block text-gray-300 line-through text-[13px] font-semibold mb-0.5">
                        {formatPrice(fakeOldPrice)}
                      </span>
                      <span className="block text-[#c0392b] text-[18px] font-black">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-6">
            <h2 className="text-[19px] font-black text-gray-800 border-b border-gray-50 pb-4 m-0">
              Tóm Tắt Đơn Hàng
            </h2>

            {/* Mã giảm giá */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Mã giảm giá
              </label>
              <select
                  value={promoInput}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    setPromoInput(selectedCode);
                    handleApplyPromo(selectedCode);
                  }}
                  className="w-full rounded-xl border border-red-100 bg-red-50/40 px-4 py-2.5 text-[13px] font-bold text-gray-700 outline-none focus:border-[#c0392b] focus:bg-white"
                >
                  <option value="">Chọn mã giảm giá</option>
                  {savedUsablePromotions.map(promo => (
                    <option key={promo._id || promo.name} value={promo.name}>
                      {promo.name} - đơn từ {Number(promo.minOrderValue || 0).toLocaleString('vi-VN')}đ
                    </option>
                  ))}
              </select>
              {appliedPromo && (
                <span className="text-emerald-600 text-xs font-bold mt-1 block">
                  ✓ Đang áp dụng mã: <strong className="font-extrabold">{appliedPromo}</strong>
                </span>
              )}
            </div>

            {/* Dòng tính toán */}
            <div className="flex flex-col gap-3.5 border-t border-b border-gray-50 py-4 my-2">
              <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                <span>Tạm tính</span>
                <span className="text-gray-800">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                <span>Phí giao hàng</span>
                <span className="text-gray-800">{formatPrice(deliveryFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm font-semibold text-red-500">
                  <span>Giảm giá</span>
                  <span className="font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Tổng cộng */}
            <div className="flex justify-between items-end mb-4">
              <span className="text-[15px] font-black text-gray-800 uppercase tracking-wide">
                Tổng cộng
              </span>
              <div className="text-right">
                <span className="block text-[#c0392b] text-[24px] font-black leading-none">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button 
              onClick={handleCheckoutRedirect}
              className="w-full py-4 bg-[#c0392b] hover:bg-[#a93226] text-white font-black text-[15px] rounded-2xl flex items-center justify-center gap-2 border-none cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none"
            >
              Tiến Hành Thanh Toán
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

        </div>
      )}

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce duration-300">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}>
            {toast.type === 'success' ? '✓' : '✕'}
          </div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default CartPage;
