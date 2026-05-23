import React from 'react';
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const formatDate = value => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const getEmployeeCode = user => {
  if (!user?._id) return 'NV-SD0000';
  return `NV-SD${String(user._id).slice(-4).toUpperCase()}`;
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || 'Người dùng Sơn Đông';
  const roleLabel = user?.role === 'admin' ? 'Quản lý cửa hàng' : 'Nhân viên cửa hàng';
  const employeeCode = getEmployeeCode(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activityItems = [
    { title: 'Xử lý đơn hàng mới', time: '10:45 AM, hôm nay', active: true },
    { title: 'Cập nhật thực đơn', time: '08:30 AM, hôm nay' },
    { title: 'Đăng nhập hệ thống', time: '06:15 AM, hôm nay' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-lg border border-red-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <img src="https://i.pravatar.cc/300?img=12" alt={displayName} className="h-full w-full object-cover" />
            <button className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-white text-[#c70d18] shadow-sm" title="Cập nhật ảnh">
              <Camera size={15} />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="m-0 text-3xl font-black tracking-tight text-slate-950">{displayName}</h1>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Đang làm việc
              </span>
            </div>

            <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness size={15} className="text-[#c70d18]" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={15} className="text-[#c70d18]" />
                {employeeCode}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail size={15} className="text-[#c70d18]" />
                {user?.email || 'Chưa cập nhật email'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-lg bg-[#c70d18] px-5 py-3 text-sm font-black text-white hover:bg-[#a90b14]">
                Chỉnh sửa hồ sơ
              </button>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-[#c70d18] hover:bg-red-100">
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-red-100 bg-white p-6 shadow-sm">
          <h2 className="m-0 mb-7 text-lg font-black text-slate-950">Thông tin cơ bản</h2>

          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Họ tên</p>
              <p className="m-0 text-sm font-bold text-slate-900">{displayName}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Ngày tham gia</p>
              <p className="m-0 text-sm font-bold text-slate-900">{formatDate(user?.createdAt)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Vai trò</p>
              <p className="m-0 text-sm font-bold text-slate-900">{roleLabel}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Số điện thoại</p>
              <p className="m-0 inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                <Phone size={15} className="text-[#c70d18]" />
                {user?.phone || 'Chưa cập nhật'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Địa chỉ</p>
              <p className="m-0 inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                <MapPin size={15} className="text-[#c70d18]" />
                {user?.address || 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          <div className="my-7 h-px bg-red-50" />

          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Ca làm việc chính</p>
              <p className="m-0 text-sm font-bold text-slate-900">Ca sáng (06:00 - 14:00)</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Bộ phận</p>
              <p className="m-0 text-sm font-bold text-slate-900">{user?.role === 'admin' ? 'Quản lý vận hành' : 'Vận hành cửa hàng'}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Mã nhân viên</p>
              <p className="m-0 text-sm font-bold text-slate-900">{employeeCode}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-400">Trạng thái</p>
              <p className="m-0 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                Đang làm việc
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="m-0 mb-4 text-base font-black text-slate-950">Bảo mật</h2>
            <div className="space-y-3">
              <button className="flex h-12 w-full items-center justify-between rounded-lg border border-red-50 px-3 text-sm font-black text-slate-800 hover:bg-red-50">
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole size={16} className="text-[#c70d18]" />
                  Đổi mật khẩu
                </span>
                <ChevronRight size={16} />
              </button>
              <button className="flex h-12 w-full items-center justify-between rounded-lg border border-red-50 px-3 text-sm font-black text-slate-800 hover:bg-red-50">
                <span className="inline-flex items-center gap-2">
                  <Bell size={16} className="text-[#c70d18]" />
                  Thông báo
                </span>
                <ChevronRight size={16} />
              </button>
              <div className="flex h-12 items-center justify-between rounded-lg border border-red-50 px-3 text-sm font-black text-slate-800">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#c70d18]" />
                  Xác thực 2 lớp
                </span>
                <span className="h-5 w-9 rounded-full bg-[#c70d18] p-0.5">
                  <span className="block h-4 w-4 translate-x-4 rounded-full bg-white" />
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-red-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-base font-black text-slate-950">Hoạt động</h2>
              <button className="text-xs font-black text-[#c70d18]">Tất cả</button>
            </div>
            <div className="space-y-4">
              {activityItems.map(item => (
                <div key={item.title} className="flex gap-3">
                  <span className={`mt-1 grid h-5 w-5 place-items-center rounded-full border ${item.active ? 'border-[#c70d18] bg-red-50' : 'border-red-100 bg-white'}`}>
                    <Clock3 size={11} className={item.active ? 'text-[#c70d18]' : 'text-red-200'} />
                  </span>
                  <div>
                    <p className="m-0 text-sm font-black text-slate-900">{item.title}</p>
                    <p className="m-0 mt-1 text-xs font-semibold text-slate-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
