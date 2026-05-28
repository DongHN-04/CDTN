import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Home, MapPin, PackageCheck, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import publicService from '../../services/publicService';
import userService from '../../services/userService';
import {
  buildAddressOption,
  normalizeCustomerAddresses,
  parseSavedAddress,
} from '../../utils/customerAddresses';

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
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Nhà riêng', address: '', district: '', city: 'Hồ Chí Minh' });
  const [message, setMessage] = useState({ type: '', text: '' });
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
        setMessage({ type: 'error', text: 'Không thể tải hồ sơ khách hàng.' });
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

    fetchProfile();
    fetchOrders();
  }, []);

  const displayName = profile?.name || user?.name || 'Khách hàng Sơn Đông';
  const email = profile?.email || user?.email || 'Chưa cập nhật email';
  const phone = profile?.phone || 'Chưa cập nhật';
  const orderTotalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const visibleOrders = orders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);

  const membershipPoints = useMemo(() => {
    const seed = String(profile?._id || '').slice(-4);
    const numeric = parseInt(seed, 16);
    return Number.isFinite(numeric) ? 1000 + (numeric % 3000) : 1000;
  }, [profile?._id]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEditProfile = () => {
    setProfileForm({ name: profile?.name || '', phone: profile?.phone || '' });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const error = validateProfile(profileForm);
    if (error) {
      showMessage('error', error);
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
      showMessage('success', 'Đã cập nhật thông tin cá nhân.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Cập nhật thông tin thất bại.');
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
      showMessage('error', error);
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
      showMessage('error', error.response?.data?.message || 'Lưu địa chỉ thất bại.');
      setSaving(false);
      return;
    }
    setSaving(false);
    setAddressForm({ label: 'Nhà riêng', address: '', district: '', city: 'Hồ Chí Minh' });
    setShowAddressForm(false);
    showMessage('success', 'Đã thêm địa chỉ nhận hàng.');
  };

  const handleSetDefaultAddress = async (id) => {
    setSaving(true);
    try {
      const nextAddresses = persistAddresses(addresses.map(item => ({ ...item, isDefault: item.id === id })));
      await saveAddressesToProfile(nextAddresses);
    showMessage('success', 'Đã đặt địa chỉ mặc định.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Cập nhật địa chỉ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    setSaving(true);
    try {
      const nextAddresses = persistAddresses(addresses.filter(item => item.id !== id));
      await saveAddressesToProfile(nextAddresses);
    showMessage('success', 'Đã xóa địa chỉ.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Xóa địa chỉ thất bại.');
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

        {message.text && (
          <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-bold ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-lg border border-red-50 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-full bg-red-50 text-4xl font-black text-[#c0392b] ring-4 ring-red-100">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <h2 className="m-0 text-xl font-black">{displayName}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{email}</p>

              <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-red-50 bg-[#fffaf8]">
                <div className="border-r border-red-50 p-3">
                  <p className="m-0 text-[11px] font-black uppercase text-slate-400">Hạng thành viên</p>
                  <p className="mt-1 text-sm font-black text-[#c0392b]">Vàng</p>
                </div>
                <div className="p-3">
                  <p className="m-0 text-[11px] font-black uppercase text-slate-400">Điểm tích lũy</p>
                  <p className="mt-1 text-sm font-black">{membershipPoints.toLocaleString('vi-VN')} pt</p>
                </div>
              </div>
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
                    onClick={() => setOrderPage(page => Math.max(1, page - 1))}
                    disabled={orderPage === 1}
                    className="h-9 rounded-lg border border-red-50 px-3 text-xs font-black text-slate-600 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <span className="text-xs font-black text-slate-500">
                    {orderPage}/{orderTotalPages}
                  </span>
                  <button
                    onClick={() => setOrderPage(page => Math.min(orderTotalPages, page + 1))}
                    disabled={orderPage === orderTotalPages}
                    className="h-9 rounded-lg border border-red-50 px-3 text-xs font-black text-slate-600 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
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
