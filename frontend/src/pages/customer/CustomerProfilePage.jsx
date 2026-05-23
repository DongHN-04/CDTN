import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Heart, Home, MapPin, PackageCheck, Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import publicService from '../../services/publicService';
import userService from '../../services/userService';
import { getImageUrl } from '../../utils/imageUrl';

const fallbackFavorites = [
  { name: 'Burger Bò Phô Mai', price: 85000, image: '/images/home/product-burger.png' },
  { name: 'Gà Rán Giòn Cay', price: 45000, image: '/images/home/product-chicken.png' },
  { name: 'Khoai Tây Chiên', price: 35000, image: '/images/home/product-sandwich.png' },
];

const recentOrders = [
  {
    code: '#ORD-9824',
    status: 'Hoàn thành',
    statusClass: 'bg-emerald-50 text-emerald-700',
    items: '2 Combo Gà Rán, 1 Pepsi lớn...',
    time: '20 Oct, 18:30',
    total: 245000,
    action: 'Đặt lại',
  },
  {
    code: '#ORD-9751',
    status: 'Đang giao',
    statusClass: 'bg-red-50 text-[#c0392b]',
    items: '1 Burger Bò Phô Mai, Khoai tây chiên...',
    time: 'Hôm nay, 12:15',
    total: 120000,
    action: 'Theo dõi',
  },
];

const formatCurrency = value =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const CustomerProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [favorites, setFavorites] = useState(fallbackFavorites);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const freshProfile = await userService.getProfile();
        setProfile(freshProfile);
      } catch (error) {
        console.error('Không thể tải hồ sơ:', error);
      }
    };

    const fetchFavorites = async () => {
      try {
        // Dùng thực đơn public để khách hàng không cần quyền admin/staff.
        const menu = await publicService.getMenu();
        const featured = menu.slice(0, 3).map(item => ({
          name: item.name,
          price: item.price,
          image: getImageUrl(item.image, fallbackFavorites[0].image),
        }));
        if (featured.length) setFavorites(featured);
      } catch (error) {
        console.error('Không thể tải món gợi ý:', error);
      }
    };

    fetchProfile();
    fetchFavorites();
  }, []);

  const displayName = profile?.name || user?.name || 'Khách hàng Sơn Đông';
  const email = profile?.email || user?.email || 'Chưa cập nhật email';
  const phone = profile?.phone || 'Chưa cập nhật';
  const primaryAddress = profile?.address || 'Chưa cập nhật địa chỉ';

  const membershipPoints = useMemo(() => {
    // Điểm mẫu tính ổn định theo id để tránh hard-code cùng một số cho mọi khách.
    const seed = String(profile?._id || '').slice(-4);
    const numeric = parseInt(seed, 16);
    return Number.isFinite(numeric) ? 1000 + (numeric % 3000) : 2450;
  }, [profile?._id]);

  return (
    <div className="bg-[#fbf7f4] py-10 text-slate-950">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-7">
          <h1 className="m-0 text-4xl font-black tracking-tight">Hồ sơ của bạn</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Quản lý thông tin cá nhân và lịch sử hoạt động</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-lg border border-red-50 bg-white p-6 text-center shadow-sm">
              <div className="relative mx-auto mb-4 h-28 w-28">
                <img
                  src="https://i.pravatar.cc/220?img=12"
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover ring-4 ring-red-50"
                />
                <button className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-[#c0392b] text-white shadow-sm" title="Chỉnh ảnh">
                  <Pencil size={14} />
                </button>
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
                <button className="text-xs font-black uppercase text-[#c0392b]">Chỉnh sửa</button>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">Số điện thoại</span>
                  <div className="flex h-10 items-center rounded-lg border border-red-50 px-3 text-sm font-bold">{phone}</div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">Ngày sinh</span>
                  <div className="flex h-10 items-center rounded-lg border border-red-50 px-3 text-sm font-bold">Chưa cập nhật</div>
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-red-50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="m-0 text-lg font-black">Địa chỉ đã lưu</h2>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-[#c0392b]" title="Thêm địa chỉ">
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 rounded-lg border border-red-50 p-3">
                  <Home size={18} className="mt-1 shrink-0 text-[#c0392b]" />
                  <div>
                    <p className="m-0 text-sm font-black">Nhà riêng</p>
                    <p className="m-0 mt-1 text-xs font-medium leading-5 text-slate-500">{primaryAddress}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-red-50 p-3">
                  <MapPin size={18} className="mt-1 shrink-0 text-slate-400" />
                  <div>
                    <p className="m-0 text-sm font-black">Cửa hàng gần bạn</p>
                    <p className="m-0 mt-1 text-xs font-medium leading-5 text-slate-500">Kim Giang, Đại Kim, Hoàng Mai, Hà Nội</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="rounded-lg border border-red-50 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="m-0 text-xl font-black">Đơn hàng gần đây</h2>
                <Link to="/cart" className="text-xs font-black uppercase text-[#c0392b] no-underline hover:underline">
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-3">
                {recentOrders.map(order => (
                  <article key={order.code} className="grid gap-4 rounded-lg border border-red-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-red-50 text-[#c0392b]">
                        <PackageCheck size={19} />
                      </div>
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="m-0 text-sm font-black">{order.code}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${order.statusClass}`}>{order.status}</span>
                        </div>
                        <p className="m-0 text-sm font-medium text-slate-600">{order.items}</p>
                        <p className="m-0 mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <CalendarDays size={12} />
                          {order.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="m-0 text-sm font-black text-[#c0392b]">{formatCurrency(order.total)}</p>
                      <button className="mt-2 rounded-lg border border-red-100 px-4 py-2 text-xs font-black text-[#c0392b] hover:bg-red-50">
                        {order.action}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-red-50 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-black">Món ăn yêu thích</h2>
              <div className="grid gap-5 md:grid-cols-3">
                {favorites.map(item => (
                  <article key={item.name} className="overflow-hidden rounded-lg border border-red-50 bg-white shadow-sm">
                    <div className="relative aspect-[4/3] overflow-hidden bg-red-50">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      <button className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-[#c0392b] shadow-sm" title="Yêu thích">
                        <Heart size={16} fill="currentColor" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="mb-2 line-clamp-1 text-sm font-black">{item.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#c0392b]">{formatCurrency(item.price)}</span>
                        <Link to="/menu" className="grid h-8 w-8 place-items-center rounded-full bg-[#c0392b] text-white no-underline" title="Đặt món">
                          <Plus size={15} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
