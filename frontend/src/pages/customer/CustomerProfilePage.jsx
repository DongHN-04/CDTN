import React, { useEffect, useState } from 'react';
import { CalendarDays, Home, MapPin, PackageCheck, Pencil, Plus, Save, TicketPercent, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import publicService from '../../services/publicService';
import userService from '../../services/userService';
import {
  buildAddressOption,
  normalizeCustomerAddresses,
  parseSavedAddress,
} from '../../utils/customerAddresses';
import { normalizeSavedPromotions } from '../../utils/savedPromotions';

const districts = [
  'Ba Đình',
  'Hoàn Kiếm',
  'Tây Hồ',
  'Long Biên',
  'Cầu Giấy',
  'Đống Đa',
  'Hai Bà Trưng',
  'Hoàng Mai',
  'Thanh Xuân',
  'Nam Từ Liêm',
  'Bắc Từ Liêm',
  'Hà Đông',
  'Sơn Tây',
  'Ba Vì',
  'Chương Mỹ',
  'Đan Phượng',
  'Đông Anh',
  'Gia Lâm',
  'Hoài Đức',
  'Mê Linh',
  'Mỹ Đức',
  'Phú Xuyên',
  'Phúc Thọ',
  'Quốc Oai',
  'Sóc Sơn',
  'Thạch Thất',
  'Thanh Oai',
  'Thanh Trì',
  'Thường Tín',
  'Ứng Hòa',
];

const PAGE_SIZE = 5;

const formatCurrency = value =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const statusMap = {
  pending: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Đang chuẩn bị', className: 'bg-sky-50 text-sky-700' },
  delivering: { label: 'Đang giao', className: 'bg-red-50 text-[#c0392b]' },
  completed: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-600' },
};

const formatOrderCode = (id = '') => `#SD-${String(id).slice(-4).toUpperCase()}`;
const formatOrderItems = (items = []) => items.map(item => `${item.quantity} ${item.name || 'món'}`).join(', ');

const validateProfile = ({ name, phone }) => {
  if (!name.trim()) return 'Vui lòng nhập họ và tên.';
  if (name.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.';
  if (!phone.trim()) return 'Vui lòng nhập số điện thoại.';
  if (!/^(0|\+84)[0-9]{9,10}$/.test(phone.trim().replace(/\s/g, ''))) {
    return 'Số điện thoại không hợp lệ.';
  }
  return '';
};

const validateAddress = ({ label, address, district }) => {
  if (!label.trim()) return 'Vui lòng nhập tên địa chỉ.';
  if (!address.trim()) return 'Vui lòng nhập địa chỉ chi tiết.';
  if (!district) return 'Vui lòng chọn quận/huyện.';
  if (address.trim().length < 6) return 'Địa chỉ chi tiết quá ngắn.';
  return '';
};

const CustomerProfilePage = () => {
  const { user, updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [savedPromotions, setSavedPromotions] = useState([]);
  const [promoPage, setPromoPage] = useState(1);
  const PROMO_PAGE_SIZE = 4;
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Nhà riêng', address: '', district: '', city: 'Hà Nội' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const freshProfile = await userService.getProfile();
        setProfile(freshProfile);
        setProfileForm({
          name: freshProfile?.name || '',
          phone: freshProfile?.phone || '',
        });

        const savedAddresses = normalizeCustomerAddresses(freshProfile?.addresses || []);
        if (savedAddresses.length) {
          setAddresses(savedAddresses);
        } else if (freshProfile?.address) {
          const parsed = parseSavedAddress(freshProfile.address, districts);
          const initialAddresses = [
            buildAddressOption({
              label: 'Địa chỉ mặc định',
              address: parsed.address,
              district: parsed.district,
              city: parsed.city,
              isDefault: true,
            }),
          ];
          setAddresses(initialAddresses);
        } else {
          setAddresses([]);
        }
      } catch (error) {
        showToast('Không thể tải hồ sơ khách hàng.', 'error');
      }
    };

    const fetchOrders = async () => {
      try {
        const data = await publicService.getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        setOrders([]);
      }
    };

    const fetchSavedPromotions = async () => {
      try {
        const data = await publicService.getMyPromotions();
        setSavedPromotions(normalizeSavedPromotions(data));
      } catch (error) {
        setSavedPromotions([]);
      }
    };

    fetchProfile();
    fetchOrders();
    fetchSavedPromotions();
  }, [user?.savedPromotions]);

  const displayName = profile?.name || user?.name || 'Khách hàng Sơn Đông';
  const email = profile?.email || user?.email || 'Chưa cập nhật email';
  const phone = profile?.phone || 'Chưa cập nhật';
  const orderTotalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const visibleOrders = orders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);

  const promoTotalPages = Math.max(1, Math.ceil(savedPromotions.length / PROMO_PAGE_SIZE));
  const paginatedPromotions = savedPromotions.slice((promoPage - 1) * PROMO_PAGE_SIZE, promoPage * PROMO_PAGE_SIZE);

  useEffect(() => {
    if (promoPage > promoTotalPages) {
      setPromoPage(promoTotalPages);
    }
  }, [savedPromotions.length, promoTotalPages, promoPage]);



  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    window.setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleEditProfile = () => {
    setProfileForm({ name: profile?.name || '', phone: profile?.phone || '' });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const error = validateProfile(profileForm);
    if (error) {
      showToast(error, 'error');
      return;
    }

    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      setProfile(updated);
      updateCurrentUser(updated);
      setEditingProfile(false);
      showToast('Đã cập nhật thông tin cá nhân.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Cập nhật thông tin thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const persistAddresses = (nextAddresses) => {
    const normalized = nextAddresses.map((item) => ({
      ...item,
      isDefault: nextAddresses.length === 1 ? true : Boolean(item.isDefault),
    }));
    const firstDefaultIndex = normalized.findIndex(item => item.isDefault);
    const defaultIndex = firstDefaultIndex >= 0 ? firstDefaultIndex : 0;
    const finalAddresses = normalized.map((item, index) => ({
      ...item,
      isDefault: index === defaultIndex,
    }));
    return finalAddresses;
  };

  const saveAddressesToProfile = async (nextAddresses) => {
    const defaultAddress = nextAddresses.find(item => item.isDefault);
    const updated = await userService.updateProfile({
      addresses: nextAddresses,
      address: defaultAddress?.fullAddress || '',
    });
    setProfile(updated);
    updateCurrentUser(updated);
    setAddresses(normalizeCustomerAddresses(updated.addresses || nextAddresses));
    return updated;
  };

  const handleAddAddress = async () => {
    const error = validateAddress(addressForm);
    if (error) {
      showToast(error, 'error');
      return;
    }

    const nextAddress = buildAddressOption({
      ...addressForm,
      isDefault: addresses.length === 0,
    });
    setSaving(true);
    try {
      const nextAddresses = persistAddresses([...addresses, nextAddress]);
      await saveAddressesToProfile(nextAddresses);
    } catch (error) {
      showToast(error.response?.data?.message || 'Lưu địa chỉ thất bại.', 'error');
      setSaving(false);
      return;
    }
    setSaving(false);
    setAddressForm({ label: 'Nhà riêng', address: '', district: '', city: 'Hồ Chí Minh' });
    setShowAddressForm(false);
    showToast('Đã thêm địa chỉ nhận hàng.', 'success');
  };

  const handleSetDefaultAddress = async (id) => {
    setSaving(true);
    try {
      const nextAddresses = persistAddresses(addresses.map(item => ({ ...item, isDefault: item.id === id })));
      await saveAddressesToProfile(nextAddresses);
      showToast('Đã đặt địa chỉ mặc định.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Cập nhật địa chỉ thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    setSaving(true);
    try {
      const nextAddresses = persistAddresses(addresses.filter(item => item.id !== id));
      await saveAddressesToProfile(nextAddresses);
      showToast('Đã xóa địa chỉ.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Xóa địa chỉ thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#fbf7f4] py-10 text-slate-950">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-7">
          <h1 className="m-0 text-4xl font-black tracking-tight">Hồ sơ của bạn</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Quản lý thông tin cá nhân, địa chỉ nhận hàng và lịch sử đơn.</p>
        </div>



        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-lg border border-red-50 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-full bg-red-50 text-4xl font-black text-[#c0392b] ring-4 ring-red-100">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <h2 className="m-0 text-xl font-black">{displayName}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{email}</p>

            </section>

            <section className="rounded-lg border border-red-50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="m-0 text-lg font-black">Thông tin cá nhân</h2>
                {editingProfile ? (
                  <button onClick={() => setEditingProfile(false)} className="text-xs font-black uppercase text-slate-400">
                    Hủy
                  </button>
                ) : (
                  <button onClick={handleEditProfile} className="inline-flex items-center gap-1 text-xs font-black uppercase text-[#c0392b]">
                    <Pencil size={13} />
                    Chỉnh sửa
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <Field label="Email">
                  <div className="flex h-10 items-center rounded-lg border border-red-50 bg-slate-50 px-3 text-sm font-bold text-slate-500">{email}</div>
                </Field>
                <Field label="Họ và tên">
                  {editingProfile ? (
                    <input value={profileForm.name} onChange={event => setProfileForm({ ...profileForm, name: event.target.value })} className={inputClass} />
                  ) : (
                    <div className="flex h-10 items-center rounded-lg border border-red-50 px-3 text-sm font-bold">{displayName}</div>
                  )}
                </Field>
                <Field label="Số điện thoại">
                  {editingProfile ? (
                    <input value={profileForm.phone} onChange={event => setProfileForm({ ...profileForm, phone: event.target.value })} className={inputClass} />
                  ) : (
                    <div className="flex h-10 items-center rounded-lg border border-red-50 px-3 text-sm font-bold">{phone}</div>
                  )}
                </Field>

                {editingProfile && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#c0392b] text-sm font-black text-white disabled:opacity-60"
                  >
                    <Save size={15} />
                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-red-50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="m-0 text-lg font-black">Địa chỉ đã lưu</h2>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-[#c0392b]"
                  title="Thêm địa chỉ"
                >
                  <Plus size={16} />
                </button>
              </div>

              {showAddressForm && (
                <div className="mb-4 space-y-3 rounded-lg border border-red-100 bg-red-50/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="m-0 text-sm font-black">Thêm địa chỉ nhận hàng</p>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="text-slate-400">
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    value={addressForm.label}
                    onChange={event => setAddressForm({ ...addressForm, label: event.target.value })}
                    placeholder="Tên địa chỉ"
                    className={inputClass}
                  />
                  <input
                    value={addressForm.address}
                    onChange={event => setAddressForm({ ...addressForm, address: event.target.value })}
                    placeholder="Số nhà, tên đường, phường/xã"
                    className={inputClass}
                  />
                  <select
                    value={addressForm.district}
                    onChange={event => setAddressForm({ ...addressForm, district: event.target.value })}
                    className={inputClass}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <button type="button" onClick={handleAddAddress} className="h-10 w-full rounded-lg bg-[#c0392b] text-sm font-black text-white">
                    Lưu địa chỉ
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-red-100 p-4 text-sm font-semibold text-slate-500">
                    Chưa có địa chỉ nhận hàng.
                  </div>
                ) : addresses.map(item => (
                  <div key={item.id} className="flex gap-3 rounded-lg border border-red-50 p-3">
                    {item.isDefault ? <Home size={18} className="mt-1 shrink-0 text-[#c0392b]" /> : <MapPin size={18} className="mt-1 shrink-0 text-slate-400" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="m-0 text-sm font-black">{item.label}</p>
                        {item.isDefault && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">Mặc định</span>}
                      </div>
                      <p className="m-0 mt-1 text-xs font-medium leading-5 text-slate-500">{item.fullAddress}</p>
                      <div className="mt-2 flex gap-3">
                        {!item.isDefault && (
                          <button type="button" onClick={() => handleSetDefaultAddress(item.id)} className="text-xs font-black text-[#c0392b]">
                            Đặt mặc định
                          </button>
                        )}
                        <button type="button" onClick={() => handleDeleteAddress(item.id)} className="inline-flex items-center gap-1 text-xs font-black text-slate-400">
                          <Trash2 size={12} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </aside>

          <main className="space-y-6">
            <section className="rounded-lg border border-red-50 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="m-0 text-xl font-black">Đơn hàng gần đây</h2>
                <span className="text-xs font-black text-slate-400">{orders.length} đơn</span>
              </div>

              <div className="space-y-3">
                {visibleOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-red-100 p-6 text-center text-sm font-semibold text-slate-500">
                    Bạn chưa có đơn hàng nào.
                  </div>
                ) : visibleOrders.map(order => {
                  const status = statusMap[order.status] || statusMap.pending;
                  return (
                    <article key={order._id} className="grid gap-4 rounded-lg border border-red-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="flex gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-red-50 text-[#c0392b]">
                          <PackageCheck size={19} />
                        </div>
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="m-0 text-sm font-black">{formatOrderCode(order._id)}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${status.className}`}>{status.label}</span>
                          </div>
                          <p className="m-0 text-sm font-medium text-slate-600">{formatOrderItems(order.items)}</p>
                          <p className="m-0 mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <CalendarDays size={12} />
                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="m-0 text-sm font-black text-[#c0392b]">{formatCurrency(order.total)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              {orders.length > PAGE_SIZE && (
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={orderPage === 1}
                    onClick={() => setOrderPage(page => Math.max(1, page - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-red-50 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: orderTotalPages }, (_, index) => index + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setOrderPage(page)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${orderPage === page ? 'bg-[#c0392b] font-black text-white' : 'border border-red-50 text-slate-600'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={orderPage === orderTotalPages}
                    onClick={() => setOrderPage(page => Math.min(orderTotalPages, page + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-red-50 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-red-50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="m-0 text-lg font-black">Mã giảm giá đã lưu</h2>
                <TicketPercent size={18} className="text-[#c0392b]" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {savedPromotions.length === 0 ? (
                  <div className="sm:col-span-2 rounded-lg border border-dashed border-red-100 p-4 text-sm font-semibold text-slate-500">
                    Chưa có mã giảm giá nào. Hãy vào trang khuyến mãi để lấy mã.
                  </div>
                ) : paginatedPromotions.map(promo => (
                  <div key={promo.promotion || promo._id || promo.name} className="rounded-lg border border-red-50 bg-red-50/30 p-4 flex flex-col justify-between">
                    <div>
                      <p className="m-0 text-base font-black text-[#c0392b]">{promo.name}</p>
                      <p className="m-0 mt-1 text-xs font-medium text-slate-500">{promo.description || ''}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-black text-red-700">
                          Giảm {promo.type === 'percent'
                            ? `${promo.value}%`
                            : `${Number(promo.value).toLocaleString('vi-VN')}đ`}
                        </span>
                        {promo.minOrderValue > 0 && (
                          <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-black text-[#c70d18]">
                            Đơn từ {Number(promo.minOrderValue).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-100/50">
                      {promo.endDate && (
                        <div className="text-[11px] font-bold text-slate-400">
                          Hạn dùng: {new Intl.DateTimeFormat('vi-VN').format(new Date(promo.endDate))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {savedPromotions.length > PROMO_PAGE_SIZE && (
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={promoPage === 1}
                    onClick={() => setPromoPage(page => Math.max(1, page - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-red-50 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: promoTotalPages }, (_, index) => index + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setPromoPage(page)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${promoPage === page ? 'bg-[#c0392b] font-black text-white' : 'border border-red-50 text-slate-600'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={promoPage === promoTotalPages}
                    onClick={() => setPromoPage(page => Math.min(promoTotalPages, page + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-red-50 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

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

const inputClass = 'h-10 w-full rounded-lg border border-red-50 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#c0392b]';

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
    {children}
  </label>
);

export default CustomerProfilePage;
