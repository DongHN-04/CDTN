import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  TicketPercent,
  Trash2,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import comboService from '../../services/comboService';
import menuService from '../../services/menuService';
import orderService from '../../services/orderService';
import promotionService from '../../services/promotionService';
import { getImageUrl } from '../../utils/imageUrl';
import { ALL_MENU_CATEGORY, COMBO_CATEGORY, MENU_CATEGORIES, normalizeCategory, standardizeCategory } from '../../constants/menuCategories';
import { useToast } from '../../contexts/ToastContext';

const defaultImages = {
  'Burger': '/images/home/product-burger.png',
  'Gà Rán': '/images/home/product-chicken.png',
  'Pizza': '/images/home/product-pizza.png',
  'Đồ Uống': '/images/home/product-sandwich.png',
  'Tráng Miệng': '/images/home/product-sandwich.png',
  'Khai Vị': '/images/home/product-chicken.png',
  'Combo': '/images/home/product-burger.png',
};

const categories = [ALL_MENU_CATEGORY, ...MENU_CATEGORIES, COMBO_CATEGORY];

const formatCurrency = value =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, Math.round(value || 0)));

const getCartLineId = item => (item.type === 'combo' ? item.comboId : item.menuItem?._id);

const POSPage = () => {
  const { items, addItem, addCombo, removeItem, updateQuantity, clearCart, getCartTotal, getItemCount } = useCart();
  const { showToast } = useToast();

  const [menuItems, setMenuItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_MENU_CATEGORY);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [selectedPromoId, setSelectedPromoId] = useState('auto');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [menuData, comboData, promoData] = await Promise.all([
          menuService.getMenuItems(),
          comboService.getCombos(),
          promotionService.getPromotions(),
        ]);

        const activeCombos = comboData.filter(combo => combo.isActive !== false);
        const standardizedMenu = (menuData || []).map(item => ({
          ...item,
          category: standardizeCategory(item.category),
        }));
        setMenuItems(standardizedMenu);
        setCombos(activeCombos);
        setPromotions(promoData.filter(promo => promo.isActive !== false));
      } catch (error) {
        console.error('Lỗi tải dữ liệu POS:', error);
        showToast('Không thể tải dữ liệu quầy bán hàng. Vui lòng thử lại.', 'error');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const cartTotal = getCartTotal();
  const grandTotal = Math.max(cartTotal - discount, 0);

  const applicablePromotions = useMemo(() => {
    const now = new Date();

    return promotions
      .filter(promo => {
        if (!promo.isActive) return false;
        if (promo.startDate && new Date(promo.startDate) > now) return false;
        if (promo.endDate && new Date(promo.endDate) < now) return false;
        if (cartTotal < (promo.minOrderValue || 0)) return false;
        return true;
      })
      .map(promo => {
        const rawDiscount = promo.type === 'percent' ? cartTotal * (promo.value / 100) : promo.value;
        return { ...promo, discountValue: Math.min(rawDiscount || 0, cartTotal) };
      })
      .sort((a, b) => b.discountValue - a.discountValue);
  }, [cartTotal, promotions]);

  useEffect(() => {
    if (selectedPromoId === 'auto') {
      setDiscount(applicablePromotions[0]?.discountValue || 0);
      return;
    }

    const promo = applicablePromotions.find(item => item._id === selectedPromoId);
    if (promo) {
      setDiscount(promo.discountValue);
    } else {
      setSelectedPromoId('auto');
    }
  }, [applicablePromotions, selectedPromoId]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const normalizedMenu = menuItems
      .filter(item => selectedCategory === ALL_MENU_CATEGORY || normalizeCategory(item.category) === normalizeCategory(selectedCategory))
      .map(item => ({ ...item, productType: 'item' }));

    const normalizedCombos = combos
      .filter(() => selectedCategory === ALL_MENU_CATEGORY || selectedCategory === COMBO_CATEGORY)
      .map(combo => ({ ...combo, category: COMBO_CATEGORY, productType: 'combo' }));

    return [...normalizedMenu, ...normalizedCombos].filter(product => {
      const text = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
      return !keyword || text.includes(keyword);
    });
  }, [combos, menuItems, search, selectedCategory]);

  const handleProductClick = product => {
    if (product.productType === 'item' && product.isAvailable === false) {
      showToast('Món này đang hết hàng do không đủ nguyên liệu trong kho.', 'error');
      return;
    }
    if (product.productType === 'combo') {
      if (product.isAvailable === false) {
        showToast('Combo này đang hết hàng do không đủ nguyên liệu trong kho.', 'error');
        return;
      }
      if (!product.items || product.items.length === 0) {
        showToast('Combo này chưa có món, không thể thêm vào giỏ.', 'error');
        return;
      }
      addCombo(product, 1);
      showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
      return;
    }
    addItem(product, 1);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleCheckout = async () => {
    if (!items.length) {
      showToast('Giỏ hàng đang trống.', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map(item => {
        if (item.type === 'combo') return { comboId: item.comboId, quantity: item.quantity };
        return { menuItem: item.menuItem._id, quantity: item.quantity };
      });

      const order = await orderService.createOrder({
        customer,
        items: orderItems,
        discount,
        paymentMethod,
        promotionId: selectedPromoId !== 'auto' ? selectedPromoId : null,
      });

      showToast(`Đã tạo hóa đơn #${order._id.slice(-6)} với tổng tiền ${formatCurrency(order.total || grandTotal)}.`);
      clearCart();
      setCustomer({ name: '', phone: '' });
      setSelectedPromoId('auto');
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Không thể tạo đơn hàng.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedPromo = selectedPromoId === 'auto'
    ? applicablePromotions[0]
    : applicablePromotions.find(item => item._id === selectedPromoId);

  return (
    <div className="min-h-full bg-[#fbf7f4] text-slate-900 -m-6 sm:-m-8">
      <div className="flex h-[calc(100vh-70px)] min-h-[720px] overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
              {categories.map(category => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                      active ? 'bg-[#c70d18] text-white shadow-sm' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="mb-5 grid grid-cols-[1fr_auto] gap-3">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Tìm kiếm món ăn, combo..."
                  className="h-12 w-full rounded-lg border border-red-100 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <button className="flex h-12 items-center gap-2 rounded-lg border border-red-100 bg-white px-4 text-sm font-bold text-stone-700 hover:border-red-300">
                <SlidersHorizontal size={18} />
                Lọc
              </button>
            </div>

            {dataLoading ? (
              <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-red-100 bg-white text-sm font-semibold text-stone-500">
                Đang tải thực đơn...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-red-100 bg-white text-sm font-semibold text-stone-500">
                Không tìm thấy món phù hợp.
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5">
                {filteredProducts.map(product => {
                  const isCombo = product.productType === 'combo';
                  const isOutOfStock = product.isAvailable === false;
                  
                  // Category-specific fallback image
                  const fallback = defaultImages[product.category] || '/images/home/product-burger.png';
                  const image = isCombo
                    ? (product.image ? getImageUrl(product.image, fallback) : fallback)
                    : getImageUrl(product.image, fallback);



                  return (
                    <article
                      key={`${product.productType}-${product._id}`}
                      className={`group overflow-hidden rounded-lg border border-red-50 bg-white shadow-sm transition ${isOutOfStock ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
                    >
                      <button
                        onClick={() => handleProductClick(product)}
                        disabled={isOutOfStock}
                        className="block w-full text-left disabled:cursor-not-allowed"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                          <img
                            src={image}
                            alt={product.name}
                            className={`h-full w-full object-cover transition duration-300 ${isOutOfStock ? 'grayscale opacity-60' : 'group-hover:scale-105'}`}
                            onError={event => {
                              event.currentTarget.src = fallback;
                            }}
                          />
                          {isCombo && (
                            <span className="absolute right-2 top-2 rounded bg-stone-900 px-2 py-1 text-[10px] font-black text-white">
                              COMBO
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[10px] font-black text-red-600 shadow-sm">
                              HẾT HÀNG
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{product.name}</h3>

                          
                          {/* Hiển thị thành phần của combo */}
                          {isCombo && (
                            <div className="mt-2 rounded-xl bg-orange-50/50 p-2 text-left border border-orange-100/50">
                              <div className="mb-1 text-[9px] font-black uppercase tracking-wider text-orange-950">Thành phần:</div>
                              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                                {(product.items || []).slice(0, 3).map(subItem => (
                                  <li key={subItem._id || `${subItem.menuItem?._id || subItem.menuItem}-${subItem.quantity}`} className="flex items-start gap-1 text-[10px] font-semibold text-orange-950">
                                    <span className="text-[#c70d18]">⊗</span>
                                    <span className="truncate">{subItem.quantity}x {subItem.menuItem?.name || subItem.name || 'Món ăn'}</span>
                                  </li>
                                ))}
                                {product.items?.length > 3 && (
                                  <li className="text-[9px] font-bold text-stone-500">+{product.items.length - 3} món khác</li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-base font-black text-[#c70d18]">{formatCurrency(product.price)}</span>
                            <span className={`grid h-8 w-8 place-items-center rounded-lg shadow-sm ${isOutOfStock ? 'bg-stone-200 text-stone-400' : 'bg-[#c70d18] text-white'}`}>
                              <Plus size={18} strokeWidth={3} />
                            </span>
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="flex w-[370px] shrink-0 flex-col border-l border-red-100 bg-white shadow-xl">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-red-100 px-5">
            <div className="flex items-center gap-2 font-black">
              <ShoppingCart size={18} className="text-[#c70d18]" />
              Giỏ hàng
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-[#c70d18]">{getItemCount()}</span>
            </div>
            <button
              onClick={clearCart}
              disabled={!items.length}
              className="text-xs font-bold text-[#c70d18] disabled:cursor-not-allowed disabled:text-stone-300"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!items.length ? (
              <div className="grid h-full min-h-[280px] place-items-center rounded-lg border border-dashed border-red-100 text-center">
                <div>
                  <ShoppingCart className="mx-auto mb-3 text-red-200" size={42} />
                  <p className="m-0 text-sm font-bold text-stone-500">Chưa có món trong giỏ</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => {
                  const id = getCartLineId(item);
                  const name = item.type === 'combo' ? item.name : item.menuItem.name;
                  const price = item.type === 'combo' ? item.price : item.menuItem.price;
                  
                  const itemCategory = item.type === 'combo' ? 'Combo' : item.menuItem?.category;
                  const itemFallback = defaultImages[itemCategory] || '/images/home/product-burger.png';
                  const image = item.type === 'combo'
                    ? (item.image ? getImageUrl(item.image, itemFallback) : itemFallback)
                    : getImageUrl(item.menuItem?.image, itemFallback);

                  return (
                    <div key={`${item.type}-${id}`} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-lg border border-red-50 bg-white p-2">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-stone-100">
                        <img src={image} alt={name} className="h-full w-full object-cover" onError={e => { e.currentTarget.src = itemFallback; }} />
                      </div>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold">{name}</p>
                        {item.type === 'combo' && (
                          <p className="m-0 text-[10px] text-orange-950/80 font-medium truncate" title={(item.items || []).map(subItem => `${subItem.quantity}x ${subItem.menuItem?.name || subItem.name || 'Món'}`).join(', ')}>
                            Thành phần: {(item.items || []).map(subItem => `${subItem.quantity}x ${subItem.menuItem?.name || subItem.name || 'Món'}`).join(', ')}
                          </p>
                        )}
                        <p className="m-0 text-[11px] text-stone-500">{formatCurrency(price)}</p>
                        <div className="mt-2 inline-flex h-7 items-center rounded-full bg-red-50">
                          <button
                            onClick={() => updateQuantity(id, item.quantity - 1)}
                            className="grid h-7 w-8 place-items-center text-[#c70d18]"
                            title="Giảm số lượng"
                          >
                            <Minus size={13} strokeWidth={3} />
                          </button>
                          <span className="min-w-7 text-center text-xs font-black">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(id, item.quantity + 1)}
                            className="grid h-7 w-8 place-items-center text-[#c70d18]"
                            title="Tăng số lượng"
                          >
                            <Plus size={13} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="m-0 text-sm font-black">{formatCurrency(price * item.quantity)}</p>
                        <button
                          onClick={() => removeItem(id)}
                          className="mt-2 inline-grid h-7 w-7 place-items-center rounded-full text-red-500 hover:bg-red-50"
                          title="Xóa món"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-red-100 p-5">
            <div className="mb-4 grid grid-cols-2 gap-2">
              <label className="relative col-span-2">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                <input
                  value={customer.name}
                  onChange={event => setCustomer(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Tên khách hàng"
                  className="h-10 w-full rounded-lg border border-red-100 pl-9 pr-3 text-sm outline-none focus:border-red-300"
                />
              </label>
              <input
                value={customer.phone}
                onChange={event => setCustomer(prev => ({ ...prev, phone: event.target.value }))}
                placeholder="Số điện thoại"
                className="col-span-2 h-10 rounded-lg border border-red-100 px-3 text-sm outline-none focus:border-red-300"
              />
            </div>

            <label className="mb-4 flex h-12 items-center gap-3 rounded-lg bg-red-50 px-3 text-sm">
              <TicketPercent size={18} className="shrink-0 text-[#c70d18]" />
              <select
                value={selectedPromoId}
                onChange={event => setSelectedPromoId(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              >
                <option value="auto">Tự động chọn voucher tốt nhất</option>
                {applicablePromotions.map(promo => (
                  <option key={promo._id} value={promo._id}>
                    {promo.name} - giảm {formatCurrency(promo.discountValue)}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Giảm giá {selectedPromo ? `(${selectedPromo.name})` : ''}</span>
                <span className="text-[#c70d18]">- {formatCurrency(discount)}</span>
              </div>
              <div className="flex items-end justify-between border-t border-red-100 pt-3">
                <span className="font-black">Tổng cộng</span>
                <span className="text-2xl font-black text-[#c70d18]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="my-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-black ${
                  paymentMethod === 'cash' ? 'bg-red-100 text-[#c70d18]' : 'bg-stone-100 text-stone-700'
                }`}
              >
                <Banknote size={17} />
                Tiền mặt
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-black ${
                  paymentMethod === 'qr' ? 'bg-red-100 text-[#c70d18]' : 'bg-stone-100 text-stone-700'
                }`}
              >
                <WalletCards size={17} />
                Ví / Banking
              </button>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || !items.length}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c70d18] text-sm font-black text-white shadow-lg shadow-red-200 transition hover:bg-[#a90b14] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
            >
              <Printer size={17} />
              {loading ? 'Đang thanh toán...' : 'Thanh toán'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default POSPage;
