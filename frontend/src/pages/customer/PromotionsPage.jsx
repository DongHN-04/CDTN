import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ShoppingCart, Tag, TicketPercent } from 'lucide-react';
import publicService from '../../services/publicService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';
import { normalizeSavedPromotions } from '../../utils/savedPromotions';

const formatCurrency = value =>
  `${Number(Math.max(0, Math.round(value || 0))).toLocaleString('vi-VN')} VNĐ`;

const formatPromoValue = promo => {
  if (promo.type === 'percent') return `${promo.value}%`;
  if (promo.type === 'fixed') return formatCurrency(promo.value);
  return 'Quà tặng';
};

const formatDate = value => {
  if (!value) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
};

const getPromoTheme = promo => {
  if (promo.type === 'percent') {
    return { bg: 'bg-[#c70d18]', icon: TicketPercent };
  }
  return { bg: 'bg-[#0b7b8c]', icon: Tag };
};

const PromotionsPage = () => {
  const { addCombo } = useCart();
  const { user, updateCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState([]);
  const [combos, setCombos] = useState([]);
  const [savedPromotions, setSavedPromotions] = useState([]);
  const [rawSavedPromotions, setRawSavedPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllVouchers, setShowAllVouchers] = useState(false);

  useEffect(() => {
    if (user?.role !== 'customer') {
      setSavedPromotions([]);
      setRawSavedPromotions([]);
      return;
    }
    publicService.getMyPromotions()
      .then(data => {
        setRawSavedPromotions(data || []);
        setSavedPromotions(normalizeSavedPromotions(data));
      })
      .catch(() => {
        setRawSavedPromotions([]);
        setSavedPromotions([]);
      });
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Trang khách hàng phải dùng API public để không bị 401/403 khi khách chưa đăng nhập.
        const [promoData, comboData] = await Promise.all([
          publicService.getPromotions(),
          publicService.getCombos(),
        ]);

        const now = new Date();
        setPromotions(
          promoData.filter(promo => promo.isActive !== false && (!promo.endDate || new Date(promo.endDate) >= now))
        );
        setCombos(comboData.filter(combo => combo.isActive !== false));
      } catch (error) {
        console.error('Không thể tải khuyến mãi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const savedPromoKeys = useMemo(() => new Set(rawSavedPromotions.flatMap(item => [
    String(item.promotion || ''),
    String(item._id || ''),
    String(item.name || '').toUpperCase(),
  ])), [rawSavedPromotions]);
  const visiblePromotions = promotions
    .filter(promo => !savedPromoKeys.has(String(promo._id || '')) && !savedPromoKeys.has(String(promo.name || '').toUpperCase()));
  const displayedVouchers = showAllVouchers ? visiblePromotions : visiblePromotions.slice(0, 3);
  const visibleCombos = combos;
  const canViewVouchers = user?.role === 'customer';

  const handleAddCombo = combo => {
    if (combo.isAvailable === false) {
      showToast('Combo này đang hết hàng do không đủ nguyên liệu trong kho.', 'error');
      return;
    }
    addCombo(combo, 1);
    showToast(`Đã thêm ${combo.name} vào giỏ hàng.`);
  };

  const handleSavePromotion = async (promo) => {
    if (user?.role !== 'customer') {
      showToast('Vui lòng đăng nhập tài khoản khách hàng để lưu mã.', 'error');
      return;
    }

    try {
      const next = await publicService.claimPromotion(promo._id);
      const normalized = normalizeSavedPromotions(next);
      setRawSavedPromotions(next || []);
      setSavedPromotions(normalized);
      updateCurrentUser({ savedPromotions: next });
      showToast(`Đã lưu mã "${promo.name}".`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu mã khuyến mãi.', 'error');
    }
  };

  const isPromotionSaved = promo => savedPromotions.some(item => (
    item._id === promo._id || item.name?.toUpperCase() === promo.name?.toUpperCase()
  ));

  return (
    <div className="bg-[#f8f5f2] text-slate-950">
      <section className="relative min-h-[430px] overflow-hidden bg-white">
        <img
          src="/images/home/hero-burger.png"
          alt="Khuyến mãi Sơn Đông FastFood"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/35" />
        <div className="relative mx-auto flex min-h-[430px] max-w-6xl items-center px-5 py-14">
          <div className="max-w-xl rounded-2xl border border-white/40 bg-white/80 p-8 shadow-2xl shadow-red-100/50 backdrop-blur-md md:p-10">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#c70d18]">
              🍔 Sơn Đông FastFood
            </span>
            <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
              Thế Giới Ẩm Thực <br />
              <span className="text-[#c70d18]">Ngập Tràn Ưu Đãi</span>
            </h1>
            <p className="mb-8 text-sm font-semibold leading-relaxed text-slate-600 md:text-base">
              Chào mừng bạn đến với Sơn Đông FastFood! Khám phá thực đơn phong phú với những món ăn nhanh nóng hổi, giao hàng siêu tốc và hàng loạt voucher đặc quyền dành riêng cho bạn hôm nay.
            </p>
            <div className="mb-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-red-50/65 px-3 py-2">
                <span className="text-base">⚡</span>
                <span className="text-xs font-bold text-slate-700">Giao siêu tốc</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-red-50/65 px-3 py-2">
                <span className="text-base">🥬</span>
                <span className="text-xs font-bold text-slate-700">Nguyên liệu sạch</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-red-50/65 px-3 py-2">
                <span className="text-base">💝</span>
                <span className="text-xs font-bold text-slate-700">Ưu đãi cực khủng</span>
              </div>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-lg bg-[#c70d18] px-6 py-3 text-sm font-black text-white no-underline shadow-lg shadow-red-200/50 transition duration-200 hover:bg-[#a90b14] hover:shadow-xl hover:shadow-red-200"
            >
              Xem thực đơn ngay
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Tag size={22} className="text-[#c70d18]" />
              <h2 className="m-0 text-2xl font-black tracking-tight">Voucher dành cho bạn</h2>
            </div>
            <p className="m-0 text-sm font-medium text-slate-500">Lưu mã để áp dụng khi thanh toán đơn hàng phù hợp.</p>
          </div>
          {canViewVouchers && visiblePromotions.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllVouchers(!showAllVouchers)}
              className="self-start text-sm font-black text-[#c70d18] no-underline hover:underline sm:self-auto"
            >
              {showAllVouchers ? 'Thu gọn' : `Xem tất cả `}
            </button>
          )}
        </div>

        {!canViewVouchers ? (
          <div className="grid gap-5 rounded-lg border border-red-100 bg-white p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="mb-2 text-xl font-black text-slate-950">Đăng ký tài khoản để nhận mã giảm giá</h3>
              <p className="m-0 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Voucher chỉ hiển thị cho khách hàng đã đăng nhập. Hãy tạo tài khoản Sơn Đông FastFood để lưu mã,
                nhận ưu đãi riêng và thanh toán nhanh hơn trong những lần đặt món tiếp theo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                to="/register"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#c70d18] px-5 text-sm font-black text-white no-underline hover:bg-[#a90b14]"
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="rounded-lg border border-dashed border-red-100 bg-white p-8 text-center text-sm font-bold text-slate-500">
            Đang tải khuyến mãi...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {displayedVouchers.map((promo) => {
              const theme = getPromoTheme(promo);
              const Icon = theme.icon;
              return (
                <article key={promo._id} className="grid min-h-[128px] grid-cols-[110px_1fr] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-red-50">
                  <div className={`${theme.bg} flex flex-col items-center justify-center p-4 text-center text-white`}>
                    <Icon size={30} />
                    <p className="m-0 mt-2 text-xl font-black">{formatPromoValue(promo)}</p>
                  </div>
                  <div className="p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="mb-1 line-clamp-1 text-sm font-black text-slate-950">{promo.name}</h3>
                      <p className="mb-2 line-clamp-2 text-xs leading-5 text-slate-500">{promo.description || ''}</p>
                      {promo.minOrderValue > 0 && (
                        <div className="mb-2">
                          <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-black text-[#c70d18]">
                            Đơn từ {Number(promo.minOrderValue).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <CalendarDays size={12} />
                        {formatDate(promo.endDate)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSavePromotion(promo)}
                        disabled={isPromotionSaved(promo)}
                        className="text-xs font-black text-[#c70d18] disabled:cursor-default disabled:text-emerald-600"
                      >
                        {isPromotionSaved(promo) ? 'Đã lưu' : 'Lưu mã'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShoppingCart size={22} className="text-[#c70d18]" />
                <h2 className="m-0 text-2xl font-black tracking-tight">Combo ưu đãi đặc quyền</h2>
              </div>
              <p className="m-0 text-sm font-medium text-slate-500">Sự kết hợp món ngon, giá tốt hơn khi mua riêng lẻ.</p>
            </div>
            <Link to="/menu?category=Combo" className="hidden text-sm font-black text-[#c70d18] no-underline hover:underline sm:block">
              Xem tất cả
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCombos.slice(0, 4).map((combo, index) => {
              const oldPrice = (combo.items || []).reduce((sum, item) => {
                const price = item.menuItem?.price || 0;
                return sum + price * (item.quantity || 1);
              }, 0);
              const image = getImageUrl(combo.image, '/images/home/product-burger.png');
              const isOutOfStock = combo.isAvailable === false;

              return (
                <div
                  key={combo._id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  {/* KHU VỰC ẢNH */}
                  <div className="h-[200px] overflow-hidden relative bg-gray-50 shrink-0">
                    <img
                      src={image}
                      alt={combo.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale blur-[1px] opacity-60' : ''}`}
                    />

                    {oldPrice > combo.price && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#c70d18] px-3 py-1 text-[11px] font-black text-white z-10">
                        Combo -{Math.max(10, Math.round(((oldPrice - combo.price) / oldPrice) * 100))}%
                      </span>
                    )}

                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[0.5px]">
                        <span className="bg-white/95 text-gray-800 text-[11px] font-black uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider">
                          Hết hàng
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[16px] font-extrabold text-gray-800 leading-snug line-clamp-2 pr-1">
                          {combo.name}
                        </h3>
                        <span className="flex flex-col items-end shrink-0">
                          {oldPrice > combo.price && (
                            <span className="text-xs font-bold text-gray-400 line-through">
                              {formatCurrency(oldPrice)}
                            </span>
                          )}
                          <span className="text-[#c70d18] font-black text-[17px]">
                            {formatCurrency(combo.price)}
                          </span>
                        </span>
                      </div>

                      <div className="mb-3 rounded-2xl bg-[#f6f1ef] p-3">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-red-950">Thành phần:</div>
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                          {(combo.items || []).slice(0, 4).map(item => (
                            <li key={item._id || `${item.menuItem?._id || item.menuItem}-${item.quantity}`} className="flex items-start gap-1.5 text-xs font-semibold text-red-950">
                              <span className="text-[#c0392b]">⊗</span>
                              <span>{item.quantity}x {item.menuItem?.name || item.name || 'Món ăn'}</span>
                            </li>
                          ))}
                          {combo.items?.length > 4 && (
                            <li className="text-[10px] font-bold text-gray-500">+{combo.items.length - 4} món khác</li>
                          )}
                        </ul>
                      </div>

                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 h-8">
                        {combo.description}
                      </p>
                    </div>

                    {isOutOfStock ? (
                      <button
                        disabled
                        className="w-full mt-4 py-3 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center text-sm font-extrabold cursor-not-allowed border border-gray-200"
                      >
                        Ngừng bán
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddCombo(combo)}
                        className="w-full mt-4 py-3 bg-[#c70d18] text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-extrabold hover:bg-[#a90b14] transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Thêm vào giỏ hàng
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
};

export default PromotionsPage;
