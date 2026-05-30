import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  ChevronDown,
  CreditCard,
  MapPin,
  MoveLeft,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import paymentService from '../../services/paymentService';
import publicService from '../../services/publicService';
import { getImageUrl } from '../../utils/imageUrl';
import { findUsablePromotion, normalizePromoCode } from '../../utils/promotionUtils';
import { normalizeCustomerAddresses, parseSavedAddress } from '../../utils/customerAddresses';

const defaultImages = {
  Burger: '/images/home/product-burger.png',
  'Gà Rán': '/images/home/product-chicken.png',
  Pizza: '/images/home/product-pizza.png',
  'Đồ Uống': '/images/home/product-sandwich.png',
  'Tráng Miệng': '/images/home/product-sandwich.png',
  'Khai Vị': '/images/home/product-chicken.png',
};

const districts = [
  'Quận 1',
  'Quận 3',
  'Quận 5',
  'Quận 7',
  'Quận 10',
  'Tân Bình',
  'Bình Thạnh',
  'Bình Tân',
  'Gò Vấp',
  'Thủ Đức',
];

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const getInitialCustomerInfo = (user) => {
  if (user?.role !== 'customer') {
    return { name: '', phone: '', address: '', district: '' };
  }

  const savedAddresses = normalizeCustomerAddresses(user?.addresses || []);
  const defaultAddress = savedAddresses.find(item => item.isDefault) || savedAddresses[0];
  const parsedAddress = defaultAddress
    ? defaultAddress
    : parseSavedAddress(user.address || '', districts);

  return {
    name: user.name || '',
    phone: user.phone || '',
    address: parsedAddress.address || '',
    district: parsedAddress.district || '',
  };
};

const CheckoutPage = () => {
  const { items, getCartTotal, refreshCartProducts } = useCart();
  const { user, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialDiscount = 0;
  const initialPromo = location.state?.promoCode || localStorage.getItem('appliedPromo') || '';

  const initialCustomer = getInitialCustomerInfo(user);
  const [name, setName] = useState(initialCustomer.name);
  const [phone, setPhone] = useState(initialCustomer.phone);
  const [address, setAddress] = useState(initialCustomer.address);
  const [district, setDistrict] = useState(initialCustomer.district);
  const [city] = useState('Hồ Chí Minh');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState(initialPromo);
  const [discount, setDiscount] = useState(initialDiscount);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 15000 : 0;
  const discountBase = subtotal + deliveryFee;
  const total = Math.max(0, discountBase - discount);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  useEffect(() => {
    const nextCustomer = getInitialCustomerInfo(user);
    setName(nextCustomer.name);
    setPhone(nextCustomer.phone);
    setAddress(nextCustomer.address);
    setDistrict(nextCustomer.district);
  }, [user]);

  useEffect(() => {
    publicService.getPromotions()
      .then((data) => setPromotions(Array.isArray(data) ? data : []))
      .catch(() => setPromotions([]));
  }, []);

  useEffect(() => {
    Promise.all([publicService.getMenu(), publicService.getCombos()])
      .then(([menuItems, combos]) => refreshCartProducts({ menuItems, combos }))
      .catch(() => {});
  }, [refreshCartProducts]);

  useEffect(() => {
    const code = normalizePromoCode(promoCode);
    if (!code) {
      setDiscount(0);
      return;
    }
    if (promotions.length === 0) return;

    const result = findUsablePromotion(promotions, code, discountBase);
    if (result.error) {
      setPromoCode('');
      setDiscount(0);
      localStorage.removeItem('appliedPromo');
      localStorage.removeItem('discountAmount');
      return;
    }

    setPromoCode(result.promotion.name);
    setDiscount(result.discount);
    localStorage.setItem('appliedPromo', result.promotion.name);
    localStorage.setItem('discountAmount', String(result.discount));
  }, [promoCode, promotions, discountBase]);

  const orderItems = useMemo(() => (
    items
      .map((item) => ({
        menuItem: item.type === 'item' ? item.menuItem?._id : undefined,
        comboId: item.type === 'combo' ? item.comboId : undefined,
        quantity: Number(item.quantity || 0),
      }))
      .filter((item) => item.quantity > 0 && (item.menuItem || item.comboId))
  ), [items]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    window.setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const validateForm = () => {
    if (!name.trim()) return 'Vui lòng nhập họ và tên.';
    if (!phone.trim()) return 'Vui lòng nhập số điện thoại.';
    if (!/^(0|\+84)[0-9]{9,10}$/.test(phone.trim().replace(/\s/g, ''))) {
      return 'Số điện thoại không hợp lệ.';
    }
    if (!address.trim()) return 'Vui lòng nhập địa chỉ chi tiết.';
    if (!district) return 'Vui lòng chọn quận/huyện.';
    if (orderItems.length === 0) return 'Giỏ hàng không có món hợp lệ.';
    return '';
  };

  const handleSubmitOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    setLoading(true);

    const fullAddress = `${address.trim()}, ${district}, ${city}`;

    try {
      localStorage.setItem('customerName', name.trim());
      localStorage.setItem('customerPhone', phone.trim());
      localStorage.setItem('customerAddress', address.trim());

      const order = await publicService.createOrder({
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: user?.role === 'customer' ? user.email : '',
          address: fullAddress,
        },
        notes: notes.trim(),
        paymentMethod,
        promoCode: normalizePromoCode(promoCode),
        items: orderItems,
      });

      if (user?.role === 'customer' && promoCode) {
        publicService.getMyPromotions()
          .then(data => updateCurrentUser({ savedPromotions: data }))
          .catch(() => {});
      }

      if (paymentMethod === 'vnpay') {
        const { paymentUrl } = await paymentService.createPayment({ orderId: order._id });
        if (!paymentUrl) throw new Error('Không nhận được đường dẫn thanh toán VNPay.');
        window.location.assign(paymentUrl);
        return;
      }

      navigate(`/payment-result?status=order-pending&orderId=${order._id}`, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getResolvedImage = (item) => {
    const rawImage = item.type === 'combo' ? item.image : item.menuItem?.image;
    const category = item.type === 'combo' ? 'Burger' : item.menuItem?.category;
    const fallback = defaultImages[category] || '/images/home/product-burger.png';
    return rawImage ? getImageUrl(rawImage, fallback) : fallback;
  };

  const getItemName = (item) => (item.type === 'combo' ? item.name : item.menuItem?.name) || 'Món ăn';
  const getItemPrice = (item) => (item.type === 'combo' ? item.price : item.menuItem?.price) || 0;

  const handleBackToCart = () => {
    if (promoCode) localStorage.setItem('appliedPromo', promoCode);
    localStorage.setItem('discountAmount', String(discount || 0));
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16 font-sans">
      <main className="mx-auto mt-10 max-w-[1200px] px-5">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="m-0 text-[25px] font-black tracking-tight text-gray-800">
            Thông tin đơn hàng
          </h1>
          <button
            type="button"
            onClick={handleBackToCart}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-black text-gray-700 shadow-sm transition-colors hover:border-red-100 hover:bg-red-50 hover:text-[#c0392b]"
          >
            <MoveLeft size={17} />
            Quay lại giỏ hàng
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <section className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="m-0 flex items-center gap-2 border-b border-gray-50 pb-4 text-[17px] font-extrabold text-gray-800">
                <MapPin size={19} className="text-[#c0392b]" />
                Địa chỉ giao hàng
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    placeholder="Họ tên người nhận"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-[#c0392b] focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="Số điện thoại liên hệ"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-[#c0392b] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Địa chỉ chi tiết
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-[#c0392b] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Quận/Huyện
                  </label>
                  <div className="relative">
                    <select
                      value={district}
                      onChange={(event) => setDistrict(event.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-[#c0392b] focus:bg-white"
                    >
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Thành phố
                  </label>
                  <input
                    value={city}
                    readOnly
                    className="rounded-xl border border-gray-100 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Ghi chú cho tài xế
                </label>
                <textarea
                  placeholder="Ví dụ: Gọi trước khi đến 5 phút..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-[#c0392b] focus:bg-white"
                />
              </div>
            </section>

            <section className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="m-0 flex items-center gap-2 border-b border-gray-50 pb-4 text-[17px] font-extrabold text-gray-800">
                <CreditCard size={19} className="text-[#c0392b]" />
                Phương thức thanh toán
              </h2>

              <div className="flex flex-col gap-3.5">
                <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all ${
                  paymentMethod === 'cash' ? 'border-[#c0392b] bg-red-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[#c0392b]"
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-700">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <span className="block text-[14px] font-extrabold text-gray-800">
                      Thanh toán khi nhận hàng
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-400">
                      Cửa hàng xác nhận đơn trước khi giao.
                    </span>
                  </div>
                </label>

                <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all ${
                  paymentMethod === 'vnpay' ? 'border-[#c0392b] bg-red-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={() => setPaymentMethod('vnpay')}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[#c0392b]"
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sky-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className="block text-[14px] font-extrabold text-gray-800">
                      Thanh toán VNPay
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-400">
                      Chuyển sang cổng VNPay sau khi tạo đơn.
                    </span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-6 lg:col-span-5">
            <section className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="m-0 flex items-center gap-2 border-b border-gray-50 pb-4 text-[17px] font-extrabold text-gray-800">
                <ReceiptText size={19} className="text-[#c0392b]" />
                Tóm tắt đơn hàng
              </h2>

              <div className="flex max-h-[280px] flex-col gap-4 overflow-y-auto pr-1">
                {items.map((item, index) => {
                  const image = getResolvedImage(item);
                  const itemName = getItemName(item);
                  const price = getItemPrice(item);
                  const id = item.type === 'combo' ? item.comboId : item.menuItem?._id;

                  return (
                    <div key={`${id || index}-${index}`} className="flex items-center gap-3.5">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-50 bg-gray-50">
                        <img src={image} alt={itemName} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="mb-0.5 line-clamp-1 text-[13px] font-extrabold leading-snug text-gray-800">
                          {itemName}
                        </h4>
                        <span className="text-[11px] font-semibold text-gray-400">
                          Số lượng: {item.quantity}
                        </span>
                      </div>
                      <span className="shrink-0 text-[14px] font-bold text-gray-700">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {promoCode && discount > 0 && (
                <div className="mt-2 border-t border-gray-50 pt-5">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                    Đang áp dụng mã: <span className="font-black">{promoCode}</span>
                  </div>
                </div>
              )}

              <div className="my-1 flex flex-col gap-3 border-y border-gray-50 py-4">
                <div className="flex items-center justify-between text-sm font-semibold text-gray-500">
                  <span>Tạm tính</span>
                  <span className="text-gray-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-gray-500">
                  <span>Phí giao hàng</span>
                  <span className="text-gray-800">{formatPrice(deliveryFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm font-semibold text-[#c0392b]">
                    <span>Giảm giá</span>
                    <span className="font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between">
                <span className="text-sm font-black uppercase tracking-wide text-gray-800">
                  Tổng cộng
                </span>
                <span className="text-[24px] font-black leading-none text-[#c0392b]">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={loading || items.length === 0}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-none bg-[#c0392b] py-4 text-[15px] font-black text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#a93226] hover:shadow-lg focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? 'Đang xử lý...' : paymentMethod === 'vnpay' ? 'Thanh toán qua VNPay' : 'Đặt hàng ngay'}
                <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-gray-400">
                <ShoppingBag size={14} />
                <span>Đơn COD sẽ chờ cửa hàng xác nhận trước khi giao.</span>
              </div>
            </section>

          </aside>
        </div>
      </main>

      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce duration-300">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}>
            {toast.type === 'success' ? '✓' : '×'}
          </div>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
