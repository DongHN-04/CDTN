import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import publicService from '../../services/publicService';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUrl';

/* ───────── SVG Icon Components ───────── */
const BurgerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11h18M3 11c0-4 4-7 9-7s9 3 9 7M3 11v1a1 1 0 001 1h16a1 1 0 001-1v-1"/>
    <path d="M3 15h18a1 1 0 011 1v1c0 2-3 4-10 4S2 19 2 17v-1a1 1 0 011-1z"/>
    <line x1="4" y1="13" x2="20" y2="13"/>
  </svg>
);
const ChickenIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 11.5c0-2.5-1.5-4.5-4-5.5 1-3 4-4 6-3s3 4 2 7c-.5 1.5-2 2.5-4 1.5z"/>
    <path d="M11 6C8 4 5 5 4 8s1 6 4 7l1 4h6l1-4c2-1 3-3 3-5"/>
    <line x1="9" y1="19" x2="9" y2="22"/><line x1="15" y1="19" x2="15" y2="22"/>
  </svg>
);
const PizzaIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 19.5h20L12 2z"/><circle cx="10" cy="13" r="1"/><circle cx="14" cy="13" r="1"/><circle cx="12" cy="9" r="1"/>
  </svg>
);
const ComboIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const DrinkIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l-2 18h16L18 2H6z"/><path d="M6 6h12"/><path d="M10 10v4"/><path d="M14 10v4"/>
  </svg>
);
const DessertIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 00-5 5c0 1 .5 2 1 3h8c.5-1 1-2 1-3a5 5 0 00-5-5z"/>
    <path d="M8 10l-1 8h10l-1-8"/><path d="M9 18l-1 4h8l-1-4"/><line x1="12" y1="2" x2="12" y2="0"/>
  </svg>
);

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill={i < fullStars ? '#f59e0b' : (i === fullStars && hasHalf ? 'url(#half)' : '#e5e7eb')} xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="half"><stop offset="50%" stopColor="#f59e0b"/><stop offset="50%" stopColor="#e5e7eb"/></linearGradient></defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating}</span>
    </div>
  );
};

/* ───────── Static Data ───────── */
const categories = [
  { name: 'Burger', icon: BurgerIcon, color: '#ef4444' },
  { name: 'Gà Rán', icon: ChickenIcon, color: '#f97316' },
  { name: 'Pizza', icon: PizzaIcon, color: '#ec4899' },
  { name: 'Combo', icon: ComboIcon, color: '#8b5cf6' },
  { name: 'Đồ Uống', icon: DrinkIcon, color: '#06b6d4' },
  { name: 'Tráng Miệng', icon: DessertIcon, color: '#10b981' },
];

// Ảnh mặc định theo category
const defaultImages = {
  'Burger': '/images/home/product-burger.png',
  'Gà Rán': '/images/home/product-chicken.png',
  'Pizza': '/images/home/product-pizza.png',
  'Đồ Uống': '/images/home/product-sandwich.png',
  'Tráng Miệng': '/images/home/product-sandwich.png',
  'Khai Vị': '/images/home/product-chicken.png',
};

// Badge tự động theo index / category
const autoBadges = [
  { text: 'Hot', color: '#ef4444' },
  null,
  { text: '-20%', color: '#22c55e' },
  { text: 'Cay', color: '#f97316' },
];

const formatPrice = (val) => val.toLocaleString('vi-VN') + ' VNĐ';

const getHomeBannerImage = () => {
  try {
    const banners = JSON.parse(localStorage.getItem('promotionBanners')) || [];
    const activeIndex = Number(localStorage.getItem('activePromotionBannerIndex') || 0);
    return banners[activeIndex]?.image || banners[0]?.image || '/images/home/hero-burger.png';
  } catch (err) {
    return '/images/home/hero-burger.png';
  }
};

/* ═══════════════════════════════════════════════
   HOMEPAGE COMPONENT
   ═══════════════════════════════════════════════ */
const HomePage = () => {
  const { addItem } = useCart();
  const [featured, setFeatured] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [homeBanner, setHomeBanner] = useState(getHomeBannerImage);

  useEffect(() => {
    publicService.getHomepageData()
      .then(data => {
        setFeatured(data.featured || []);
        if (data.banners && data.banners.length > 0) {
          const activeBanner = data.banners.find(b => b.isActive) || data.banners[0];
          setHomeBanner(activeBanner.image);

          // Update local cache to match the database
          localStorage.setItem('promotionBanners', JSON.stringify(data.banners));
          const activeIndex = data.banners.findIndex(b => b.isActive);
          localStorage.setItem('activePromotionBannerIndex', String(activeIndex !== -1 ? activeIndex : 0));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const syncBanner = () => setHomeBanner(getHomeBannerImage());

    window.addEventListener('storage', syncBanner);
    window.addEventListener('promotion-banner-updated', syncBanner);

    return () => {
      window.removeEventListener('storage', syncBanner);
      window.removeEventListener('promotion-banner-updated', syncBanner);
    };
  }, []);

  const bestSellers = featured.slice(0, 4).map((item, idx) => ({
    ...item,
    image: item.image 
      ? getImageUrl(item.image, defaultImages[item.category] || '/images/home/product-burger.png') 
      : defaultImages[item.category] || '/images/home/product-burger.png',
    badge: autoBadges[idx] || null,
    rating: [4.8, 4.9, 4.7, 4.6][idx] || 4.5,
    oldPrice: idx === 2 ? Math.round(item.price * 1.25) : null,
  }));

  const handleAddToCart = (item) => {
    addItem(item, 1);
    setToast({ show: true, message: `Đã thêm "${item.name}" vào giỏ hàng!` });
    
    // Tự động tắt sau 2.5 giây
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500);
  };

  return (
    <div className="w-full">

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '480px' }}>
        {/* Background split */}
        <div className="absolute inset-0 flex">
          <div className="w-[48%] bg-gradient-to-br from-[#b91c1c] via-[#c0392b] to-[#991b1b]" />
          <div className="w-[52%] bg-[#f5f0ec]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[1200px] mx-auto flex items-center h-full" style={{ minHeight: '480px' }}>
          {/* Left Text */}
          <div className="w-[48%] pr-8 py-16 pl-5">
            <h1 className="text-white text-[42px] leading-[1.15] font-black mb-5 tracking-tight">
              Nhanh Chóng. Tươi Ngon.<br/>
              <span className="text-yellow-300">Vô Cùng Hấp Dẫn.</span>
            </h1>
            <p className="text-white/80 text-[15px] leading-relaxed mb-8 max-w-md">
              Trải nghiệm những món ăn tuyệt hảo với bánh mì kẹp thịt hảo hạng, gà rán giòn và pizza nướng tay. 
              Sẵn sàng trong vài phút.
            </p>
            <div className="flex gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-white/80 text-white font-bold text-[15px] hover:bg-white hover:text-[#c0392b] transition-all duration-300 no-underline"
              >
                Đặt Hàng Ngay
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#c0392b] border-2 border-[#c0392b] text-white font-bold text-[15px] hover:bg-white hover:text-[#c0392b] transition-all duration-300 shadow-lg no-underline"
                style={{ backgroundColor: '#e74c3c' }}
              >
                Xem Thực Đơn
              </Link>
            </div>
          </div>

          {/* Right Images */}
          <div className="w-[52%] relative flex items-center justify-center py-8">
            <div className="relative w-full max-w-[500px] h-[380px]">
              {/* Main large image */}
              <div className="absolute top-0 right-0 w-[280px] h-[280px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500 z-20">
                <img 
                  src={getImageUrl(homeBanner, '/images/home/hero-burger.png')}
                  alt="Burger ngon" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Secondary image */}
              <div className="absolute bottom-0 left-4 w-[240px] h-[240px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-3 hover:rotate-0 transition-transform duration-500 z-10">
                <img 
                  src="/images/home/hero-collage.png" 
                  alt="Đồ ăn hấp dẫn" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative circle */}
              <div className="absolute -top-4 left-16 w-20 h-20 rounded-full bg-yellow-400/30 blur-sm z-0" />
              <div className="absolute -bottom-2 right-20 w-16 h-16 rounded-full bg-red-400/20 blur-sm z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATEGORIES SECTION ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-10 tracking-tight">
            Danh Mục Phổ Biến
          </h2>
          <div className="flex justify-center gap-6 flex-wrap">
            {categories.map((cat) => {

              const IconComp = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/menu?category=${cat.name}`}
                  className="group flex flex-col items-center gap-3 no-underline w-[110px]"
                >
                  <div 
                    className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ 
                      backgroundColor: `${cat.color}10`, 
                      color: cat.color,
                      border: `1.5px solid ${cat.color}25`
                    }}
                  >
                    <IconComp />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== BEST SELLERS SECTION ===================== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight flex items-center gap-2">
                <span className="w-1 h-7 bg-[#c0392b] rounded-full inline-block" />
                Bán Chạy Nhất
              </h2>
              <p className="text-gray-500 text-[15px]">
                Những món ăn được yêu thích nhất, đã sẵn sàng phục vụ bạn.
              </p>
            </div>
            <Link
              to="/menu"
              className="text-[#c0392b] font-semibold text-sm hover:underline no-underline flex items-center gap-1 shrink-0"
            >
              Xem Tất Cả
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-4 gap-5">
            {bestSellers.map((item, idx) => (
              <div
                key={item._id || idx}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative h-[200px] bg-gray-50 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.badge && (
                    <span
                      className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-bold shadow-md"
                      style={{ backgroundColor: item.badge.color }}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[15px] font-bold text-gray-800 truncate pr-2">
                      {item.name}
                    </h3>
                    <StarRating rating={item.rating} />
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2 h-8">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#c0392b] font-extrabold text-base">
                        {formatPrice(item.price)}
                      </span>
                      {item.oldPrice && (
                        <span className="text-gray-400 text-xs line-through ml-2">
                          {formatPrice(item.oldPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-9 h-9 rounded-full bg-[#c0392b] text-white flex items-center justify-center hover:bg-[#a93226] transition-colors shadow-md hover:shadow-lg focus:outline-none"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== WHY CHOOSE US SECTION ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-3 tracking-tight">
            Tại Sao Chọn Chúng Tôi?
          </h2>
          <p className="text-center text-gray-500 mb-12 text-[15px]">
            Cam kết mang đến trải nghiệm tốt nhất cho bạn
          </p>
          <div className="grid grid-cols-4 gap-6">
            {[
              { emoji: '⚡', title: 'Siêu Nhanh', desc: 'Đơn hàng được chuẩn bị trong vài phút, nóng hổi tới tay bạn' },
              { emoji: '🥬', title: 'Nguyên Liệu Tươi', desc: 'Sử dụng 100% nguyên liệu tươi ngon, nhập hàng ngày' },
              { emoji: '👨‍🍳', title: 'Đầu Bếp Chuyên Nghiệp', desc: 'Đội ngũ đầu bếp giàu kinh nghiệm, tay nghề cao' },
              { emoji: '💰', title: 'Giá Hợp Lý', desc: 'Mức giá phải chăng, nhiều khuyến mãi hấp dẫn mỗi ngày' },
            ].map((item, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="text-base font-bold text-gray-800 mb-2 group-hover:text-[#c0392b] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA BANNER ===================== */}
      <section className="py-14 bg-gradient-to-r from-[#c0392b] via-[#e74c3c] to-[#c0392b]">
        <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between">
          <div>
            <h2 className="text-white text-3xl font-black mb-2">
              Đặt hàng ngay hôm nay! 🍔
            </h2>
            <p className="text-white/80 text-base">
              Nhận ưu đãi giảm 10% cho đơn hàng đầu tiên khi đăng ký thành viên.
            </p>
          </div>
          <Link
            to="/register"
            className="px-8 py-4 bg-white text-[#c0392b] font-bold rounded-full hover:bg-yellow-300 hover:text-[#991b1b] transition-all duration-300 shadow-xl no-underline text-base shrink-0"
          >
            Đăng Ký Ngay
          </Link>
        </div>
      </section>

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">
            ✓
          </div>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
};

export default HomePage;
