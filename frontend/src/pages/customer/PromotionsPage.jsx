import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Gift, ShoppingCart, Tag, TicketPercent, Truck } from 'lucide-react';
import publicService from '../../services/publicService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';

const fallbackPromotions = [
  {
    _id: 'fallback-20',
    name: 'Giảm 20% đơn từ 100K',
    description: 'Áp dụng cho burger, gà rán và đồ uống trong ngày.',
    type: 'percent',
    value: 20,
    minOrderValue: 100000,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    isActive: true,
  },
  {
    _id: 'fallback-ship',
    name: 'Miễn phí giao hàng',
    description: 'Cho đơn hàng nội thành từ 150K.',
    type: 'fixed',
    value: 25000,
    minOrderValue: 150000,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    isActive: true,
  },
  {
    _id: 'fallback-water',
    name: 'Tặng 1 nước',
    description: 'Áp dụng khi mua combo bất kỳ tại cửa hàng.',
    type: 'buyXgetY',
    value: 1,
    minOrderValue: 0,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    isActive: true,
  },
];

const fallbackCombos = [
  {
    _id: 'combo-burger',
    name: 'Burger Bò Đặc Biệt + Khoai Tây',
    description: 'Burger bò phô mai, khoai tây chiên và sốt đặc biệt.',
    price: 90000,
    originalPrice: 120000,
    image: '/images/home/product-burger.png',
    items: [],
  },
  {
    _id: 'combo-chicken',
    name: 'Combo Gà Giòn Sơn Đông',
    description: 'Gà rán giòn, khoai tây và nước uống mát lạnh.',
    price: 295000,
    originalPrice: 350000,
    image: '/images/home/product-chicken.png',
    items: [],
  },
  {
    _id: 'combo-pizza',
    name: 'Pizza Pepperoni Size L',
    description: 'Pizza nóng giòn, nhiều phô mai, phù hợp nhóm bạn.',
    price: 65000,
    originalPrice: 85000,
    image: '/images/home/product-pizza.png',
    items: [],
  },
  {
    _id: 'combo-sandwich',
    name: 'Cánh Gà Chiên Cay Kèm Salad',
    description: 'Cánh gà cay nhẹ, ăn kèm rau tươi và sốt riêng.',
    price: 85000,
    originalPrice: 110000,
    image: '/images/home/product-sandwich.png',
    items: [],
  },
];

const formatCurrency = value =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, Math.round(value || 0)));

const formatPromoValue = promo => {
  if (promo.type === 'percent') return `${promo.value}%`;
  if (promo.type === 'fixed') return formatCurrency(promo.value);
  return 'Quà tặng';
};

const formatDate = value => {
  if (!value) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
};

const getPromoTheme = index => {
  const themes = [
    { bg: 'bg-[#c70d18]', icon: TicketPercent, label: 'Sale' },
    { bg: 'bg-[#0b7b8c]', icon: Truck, label: 'Free Ship' },
    { bg: 'bg-[#f59e0b]', icon: Gift, label: 'Quà tặng' },
  ];
  return themes[index % themes.length];
};

const PromotionsPage = () => {
  const { addCombo } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const visiblePromotions = promotions.length ? promotions : fallbackPromotions;
  const visibleCombos = combos.length ? combos : fallbackCombos;
  const canViewVouchers = user?.role === 'customer';

  const heroPromo = useMemo(() => {
    const best = visiblePromotions.find(promo => promo.type === 'percent') || visiblePromotions[0];
    return best || fallbackPromotions[0];
  }, [visiblePromotions]);

  const handleAddCombo = combo => {
    if (!combo.items?.length && combo._id?.startsWith('combo-')) {
      showToast('Combo mẫu dùng để giới thiệu. Vui lòng xem thực đơn để đặt món.', 'error');
      return;
    }
    if (combo.isAvailable === false) {
      showToast('Combo này đang hết hàng do không đủ nguyên liệu trong kho.', 'error');
      return;
    }
    addCombo(combo, 1);
    showToast(`Đã thêm ${combo.name} vào giỏ hàng.`);
  };

  return (
    <div className="bg-[#f8f5f2] text-slate-950">
      <section className="relative min-h-[430px] overflow-hidden bg-white">
        <img
          src="/images/home/hero-burger.png"
          alt="Khuyến mãi Sơn Đông FastFood"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/20" />
        <div className="relative mx-auto flex min-h-[430px] max-w-6xl items-center px-5 py-14">
          <div className="max-w-md rounded-lg border border-red-100 bg-white/95 p-8 shadow-2xl shadow-red-100 backdrop-blur">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#c70d18]">
              <TicketPercent size={14} />
              Flash sale hôm nay
            </span>
            <h1 className="mb-3 text-5xl font-black tracking-tight text-[#c70d18]">
              Giảm {formatPromoValue(heroPromo)}
            </h1>
            <p className="mb-6 text-[15px] font-semibold leading-7 text-slate-600">
              {heroPromo.description || `Áp dụng cho đơn từ ${formatCurrency(heroPromo.minOrderValue)} tại Sơn Đông FastFood.`}
            </p>
            <div className="mb-6 grid grid-cols-3 gap-3">
              {['02 ngày', '45 giờ', '12 phút'].map(item => (
                <div key={item} className="rounded-lg bg-red-50 px-3 py-2 text-center">
                  <p className="m-0 text-lg font-black text-[#c70d18]">{item.split(' ')[0]}</p>
                  <p className="m-0 text-[11px] font-bold uppercase text-red-300">{item.split(' ')[1]}</p>
                </div>
              ))}
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-lg bg-[#c70d18] px-5 py-3 text-sm font-black text-white no-underline shadow-lg shadow-red-200 hover:bg-[#a90b14]"
            >
              Đặt hàng ngay
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2">
            <Tag size={22} className="text-[#c70d18]" />
            <h2 className="m-0 text-2xl font-black tracking-tight">Voucher dành cho bạn</h2>
          </div>
          <p className="m-0 text-sm font-medium text-slate-500">Lưu mã để áp dụng khi thanh toán đơn hàng phù hợp.</p>
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
            {visiblePromotions.slice(0, 3).map((promo, index) => {
              const theme = getPromoTheme(index);
              const Icon = theme.icon;
              return (
                <article key={promo._id} className="grid min-h-[128px] grid-cols-[110px_1fr] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-red-50">
                  <div className={`${theme.bg} flex flex-col items-center justify-center p-4 text-center text-white`}>
                    <Icon size={30} />
                    <p className="m-0 mt-2 text-xl font-black">{formatPromoValue(promo)}</p>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 line-clamp-1 text-sm font-black text-slate-950">{promo.name}</h3>
                    <p className="mb-3 line-clamp-2 text-xs leading-5 text-slate-500">{promo.description || 'Ưu đãi đang áp dụng tại Sơn Đông FastFood.'}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <CalendarDays size={12} />
                        {formatDate(promo.endDate)}
                      </span>
                      <button className="text-xs font-black text-[#c70d18]">Lưu mã</button>
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
            <Link to="/menu" className="hidden text-sm font-black text-[#c70d18] no-underline hover:underline sm:block">
              Xem tất cả
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCombos.slice(0, 4).map((combo, index) => {
              const oldPrice = combo.originalPrice || Math.round((combo.price || 0) * 1.25);
              const image = getImageUrl(combo.image, fallbackCombos[index % fallbackCombos.length].image);
              const isOutOfStock = combo.isAvailable === false;

              return (
                <article key={combo._id} className={`overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm transition ${isOutOfStock ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-xl'}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-red-50">
                    <img src={image} alt={combo.name} className={`h-full w-full object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`} />
                    <span className="absolute left-3 top-3 rounded-full bg-[#c70d18] px-3 py-1 text-[11px] font-black text-white">
                      Combo -{Math.max(10, Math.round(((oldPrice - combo.price) / oldPrice) * 100))}%
                    </span>
                    {isOutOfStock && (
                      <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black text-red-600 shadow-sm">
                        HẾT HÀNG
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 line-clamp-2 min-h-[40px] text-sm font-black text-slate-950">{combo.name}</h3>
                    <p className="mb-4 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
                      {combo.description || 'Combo tiết kiệm dành riêng cho khách hàng Sơn Đông.'}
                    </p>
                    <div className="mb-4 flex items-end gap-2">
                      <span className="text-xs font-bold text-slate-300 line-through">{formatCurrency(oldPrice)}</span>
                      <span className="text-lg font-black text-[#c70d18]">{formatCurrency(combo.price)}</span>
                    </div>
                    <button
                      onClick={() => handleAddCombo(combo)}
                      disabled={isOutOfStock}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-50 text-sm font-black text-[#c70d18] hover:bg-[#c70d18] hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <ShoppingCart size={16} />
                      {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
};

export default PromotionsPage;
