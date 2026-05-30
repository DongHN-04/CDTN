import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import publicService from '../../services/publicService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../utils/imageUrl';
import { COMBO_CATEGORY, MENU_CATEGORIES, normalizeCategory } from '../../constants/menuCategories';

/* ───────── SVG Icon Components ───────── */
const BurgerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11h18M3 11c0-4 4-7 9-7s9 3 9 7M3 11v1a1 1 0 001 1h16a1 1 0 001-1v-1" />
    <path d="M3 15h18a1 1 0 011 1v1c0 2-3 4-10 4S2 19 2 17v-1a1 1 0 011-1z" />
    <line x1="4" y1="13" x2="20" y2="13" />
  </svg>
);
const ChickenIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 11.5c0-2.5-1.5-4.5-4-5.5 1-3 4-4 6-3s3 4 2 7c-.5 1.5-2 2.5-4 1.5z" />
    <path d="M11 6C8 4 5 5 4 8s1 6 4 7l1 4h6l1-4c2-1 3-3 3-5" />
    <line x1="9" y1="19" x2="9" y2="22" /><line x1="15" y1="19" x2="15" y2="22" />
  </svg>
);
const PizzaIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 19.5h20L12 2z" /><circle cx="10" cy="13" r="1" /><circle cx="14" cy="13" r="1" /><circle cx="12" cy="9" r="1" />
  </svg>
);
const ComboIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const DrinkIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l-2 18h16L18 2H6z" /><path d="M6 6h12" /><path d="M10 10v4" /><path d="M14 10v4" />
  </svg>
);
const DessertIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 00-5 5c0 1 .5 2 1 3h8c.5-1 1-2 1-3a5 5 0 00-5-5z" />
    <path d="M8 10l-1 8h10l-1-8" /><path d="M9 18l-1 4h8l-1-4" /><line x1="12" y1="2" x2="12" y2="0" />
  </svg>
);



/* ───────── Static Data ───────── */
// Static categories list removed

// Ảnh mặc định theo category
const categoryVisuals = {
  [normalizeCategory('Burger')]: { icon: BurgerIcon, color: '#ef4444' },
  [normalizeCategory('Gà rán')]: { icon: ChickenIcon, color: '#f97316' },
  [normalizeCategory('Pizza')]: { icon: PizzaIcon, color: '#ec4899' },
  [normalizeCategory(COMBO_CATEGORY)]: { icon: ComboIcon, color: '#8b5cf6' },
  [normalizeCategory('Đồ uống')]: { icon: DrinkIcon, color: '#06b6d4' },
  [normalizeCategory('Tráng miệng')]: { icon: DessertIcon, color: '#10b981' },
};

const adminCategories = [...MENU_CATEGORIES, COMBO_CATEGORY].map(name => ({
  name,
  ...(categoryVisuals[normalizeCategory(name)] || categoryVisuals[normalizeCategory('Burger')]),
}));

const defaultImages = {
  'Burger': '/images/home/product-burger.png',
  'Gà Rán': '/images/home/product-chicken.png',
  'Pizza': '/images/home/product-pizza.png',
  'Đồ Uống': '/images/home/product-sandwich.png',
  'Tráng Miệng': '/images/home/product-sandwich.png',
  'Khai Vị': '/images/home/product-chicken.png',
};

// Auto badges removed

const formatPrice = (val) => val.toLocaleString('vi-VN') + 'đ';

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
  const { addItem, addCombo } = useCart();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [homeBanner, setHomeBanner] = useState(getHomeBannerImage);

  useEffect(() => {
    publicService.getHomepageData()
      .then(data => {
        if (data.banners && data.banners.length > 0) {
          const activeBanner = data.banners.find(b => b.isActive) || data.banners[0];
          setHomeBanner(activeBanner.image);

          // Update local cache to match the database
          localStorage.setItem('promotionBanners', JSON.stringify(data.banners));
          const activeIndex = data.banners.findIndex(b => b.isActive);
          localStorage.setItem('activePromotionBannerIndex', String(activeIndex !== -1 ? activeIndex : 0));
        }
      })
      .catch(() => { });

    Promise.all([
      publicService.getMenu(),
      publicService.getCombos(),
    ]).then(([menuData, comboData]) => {
      const normalizedMenu = (menuData || []).map(item => ({ ...item, type: 'item' }));
      const normalizedCombos = (comboData || []).map(combo => ({
        ...combo,
        type: 'combo',
        category: COMBO_CATEGORY,
        description: combo.description || '',
      }));
      setMenuItems([...normalizedMenu, ...normalizedCombos]);
    }).catch(() => { });
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

  const bestSellers = useMemo(() => {
    return [...menuItems]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 4)
      .map(item => {
        const isOutOfStock = item.isAvailable === false;
        const resolvedImage = item.image
          ? getImageUrl(item.image, defaultImages[item.category] || '/images/home/product-burger.png')
          : defaultImages[item.category] || '/images/home/product-burger.png';
        return {
          ...item,
          isOutOfStock,
          resolvedImage,
        };
      });
  }, [menuItems]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleAddToCart = (item) => {
    if (item.type === 'combo') {
      addCombo(item, 1);
    } else {
      addItem(item, 1);
    }
    showToast(`Đã thêm "${item.name}" vào giỏ hàng!`, 'success');
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
              Nhanh Chóng. Tươi Ngon.<br />
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
            {adminCategories.map((cat) => {

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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bestSellers.map((item, idx) => {
              const isOutOfStock = item.isOutOfStock;
              return (
                <div
                  key={item._id || idx}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  {/* KHU VỰC ẢNH */}
                  <div className="h-[200px] overflow-hidden relative bg-gray-50 shrink-0">
                    <img
                      src={item.resolvedImage}
                      alt={item.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale blur-[1px] opacity-60' : ''}`}
                    />



                    {/* Combo Discount Badge */}
                    {item.type === 'combo' && !isOutOfStock && (() => {
                      const totalItemsPrice = (item.items || []).reduce((sum, subItem) => {
                        const price = subItem.menuItem?.price || 0;
                        return sum + price * (subItem.quantity || 1);
                      }, 0);
                      return totalItemsPrice > item.price ? (
                        <span className="absolute left-3 top-3 rounded-full bg-[#c0392b] px-3 py-1 text-[11px] font-black text-white z-10">
                          Combo -{Math.max(10, Math.round(((totalItemsPrice - item.price) / totalItemsPrice) * 100))}%
                        </span>
                      ) : null;
                    })()}

                    {/* Phủ Hết Hàng */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[0.5px]">
                        <span className="bg-white/95 text-gray-800 text-[11px] font-black uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider">
                          Hết hàng
                        </span>
                      </div>
                    )}
                  </div>

                  {/* KHU VỰC THÔNG TIN */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[15px] font-extrabold text-gray-800 leading-snug line-clamp-2 pr-1">
                          {item.name}
                        </h3>
                        <span className="flex flex-col items-end shrink-0">
                          {item.type === 'combo' && (() => {
                            const totalItemsPrice = (item.items || []).reduce((sum, subItem) => {
                              const price = subItem.menuItem?.price || 0;
                              return sum + price * (subItem.quantity || 1);
                            }, 0);
                            return totalItemsPrice > item.price ? (
                              <span className="text-xs font-bold text-gray-400 line-through">
                                {formatPrice(totalItemsPrice)}
                              </span>
                            ) : null;
                          })()}
                          <span className="text-[#c0392b] font-black text-[16px]">
                            {formatPrice(item.price)}
                          </span>
                        </span>
                      </div>

                      {item.type === 'combo' && (
                        <div className="mb-3 rounded-2xl bg-[#f6f1ef] p-3 text-left">
                          <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-red-950">Thành phần:</div>
                          <ul className="m-0 flex list-none flex-col gap-1 p-0">
                            {(item.items || []).slice(0, 3).map(subItem => (
                              <li key={subItem._id || `${subItem.menuItem?._id || subItem.menuItem}-${subItem.quantity}`} className="flex items-start gap-1 text-[11px] font-semibold text-red-950">
                                <span className="text-[#c0392b]">⊗</span>
                                <span>{subItem.quantity}x {subItem.menuItem?.name || subItem.name || 'Món ăn'}</span>
                              </li>
                            ))}
                            {item.items?.length > 3 && (
                              <li className="text-[10px] font-bold text-gray-500">+{item.items.length - 3} món khác</li>
                            )}
                          </ul>
                        </div>
                      )}

                      <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Nút thêm vào giỏ */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={isOutOfStock}
                      className="w-full py-2.5 bg-[#c0392b] hover:bg-[#a93226] text-white font-extrabold text-[13px] rounded-2xl flex items-center justify-center gap-2 border-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              );
            })}
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
              {user ? `Chào mừng bạn quay lại, ${user.name || 'Khách hàng Sơn Đông'}! 🍔` : 'Đặt hàng ngay hôm nay! 🍔'}
            </h2>
            <p className="text-white/80 text-base">
              {user ? 'Hôm nay bạn muốn thưởng thức món ăn thơm ngon nào từ thực đơn của chúng tôi?' : 'Đăng ký thành viên để nhận nhiều ưu đãi hấp dẫn.'}
            </p>
          </div>
          {user ? (
            <Link
              to="/menu"
              className="px-8 py-4 bg-white text-[#c0392b] font-bold rounded-full hover:bg-yellow-300 hover:text-[#991b1b] transition-all duration-300 shadow-xl no-underline text-base shrink-0"
            >
              Xem Thực Đơn Ngay
            </Link>
          ) : (
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-[#c0392b] font-bold rounded-full hover:bg-yellow-300 hover:text-[#991b1b] transition-all duration-300 shadow-xl no-underline text-base shrink-0"
            >
              Đăng Ký Ngay
            </Link>
          )}
        </div>
      </section>

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce duration-300">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}>
            {toast.type === 'success' ? '✓' : '✕'}
          </div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

    </div>
  );
};

export default HomePage;
