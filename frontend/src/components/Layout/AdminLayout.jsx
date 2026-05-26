import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = (user?.name || 'SD')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Tổng quan', path: '/admin/dashboard', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICDashboard.png' },
    { label: 'Bán hàng (POS)', path: '/staff/pos', roles: ['staff'], iconSrc: '/images/ICON/ICOrder.png' },
    { label: 'Quản lý nhân sự', path: '/admin/employees', roles: ['admin'], iconSrc: '/images/ICON/ICEmployee.png' },
    { label: 'Quản lý thực đơn', path: '/admin/menu', roles: ['admin'], iconSrc: '/images/ICON/ICMenu.png' },
    { label: 'Quản lý kho', path: '/admin/inventory', roles: ['admin'], iconSrc: '/images/ICON/ICKho.png' },
    { label: 'Quản lý khách hàng', path: '/admin/customers', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICCustomer.png' },
    { label: 'Quản lý Khuyến mãi', path: '/admin/promotions', roles: ['admin'], iconSrc: '/images/ICON/ICKmai.png' },
    { label: 'Quản lý Combo', path: '/admin/combos', roles: ['admin'], iconSrc: '/images/ICON/ICCombo.png' },
    { label: 'Quản lý Đơn hàng', path: '/admin/invoices', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICOrder.png' },
    { label: 'Quản lý ca làm việc', path: '/admin/shifts', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICQrPhone.png' },
    { label: 'Nhà cung cấp', path: '/admin/suppliers', roles: ['admin'], iconSrc: '/images/ICON/restaurant.png' },
    { label: 'Lịch sử nhập hàng', path: '/admin/purchases', roles: ['admin'], iconSrc: '/images/ICON/ICKho.png' },
    { label: 'Báo cáo doanh thu', path: '/admin/revenue', roles: ['admin'], iconSrc: '/images/ICON/ICDoanhThu.png' },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || 'admin'));

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-gray-50 border-r border-gray-200 flex flex-col z-10 shrink-0">
        <div className="pt-8 px-5 pb-5">
          <h2 className="text-[#c0392b] m-0 text-lg font-black tracking-wide">SƠN ĐÔNG ADMIN</h2>
        </div>

        <div className="flex items-center gap-3 px-5 pb-5">
          <div className="w-[45px] h-[45px] rounded-lg bg-gray-800 overflow-hidden shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm font-black text-white">
                {initials}
              </div>
            )}
          </div>
          <div>
            <p className="m-0 font-bold text-[15px] text-gray-900">{user?.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</p>
            <p className="m-0 text-[13px] text-gray-500">{user?.name || 'Sơn Đông Admin'}</p>
          </div>
        </div>

        <nav className="flex-1 mt-2 overflow-y-auto">
          <ul className="list-none p-0 m-0">
            {filteredMenu.map(item => {
              const isActive = location.pathname.includes(item.path);
              return (
                <li key={item.path} className="mb-1">
                  <Link
                    to={item.path}
                    className={`flex items-center gap-4 py-3 px-5 no-underline text-sm transition-all border-l-4 ${
                      isActive
                        ? 'bg-red-50 text-[#c0392b] border-[#c0392b] font-semibold'
                        : 'bg-transparent text-gray-600 border-transparent font-medium hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.iconSrc && (
                      <img
                        src={item.iconSrc}
                        alt=""
                        className={`w-[22px] h-[22px] object-contain transition-all ${isActive ? '' : 'grayscale opacity-60'}`}
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ================= PHẦN BÊN PHẢI ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[70px] bg-white flex items-center justify-between px-8 border-b border-gray-200 shrink-0">
          <h2 className="text-[#c0392b] text-2xl font-black m-0 tracking-tight">Sơn Đông Food</h2>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 pl-5 border-l border-gray-200">
              {/* Nút Cài đặt */}
              <button
                onClick={() => {
                  navigate('/admin/profile');
                }}
                className="bg-transparent border-none p-1 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                title="Hồ sơ"
              >
                <img src="/images/ICON/ICsetting.png" alt="Settings" className="w-6 h-6 object-contain opacity-70" />
              </button>

              {/* Nút Đăng xuất */}
              <button
                onClick={handleLogout}
                className="bg-[#c0392b] border-none rounded-lg w-[35px] h-[35px] flex items-center justify-center cursor-pointer hover:bg-red-800 transition-colors ml-2 shadow-sm"
                title="Đăng xuất"
              >
                <img src="/images/ICON/IClogout.png" alt="Logout" className="w-[18px] h-[18px] object-contain brightness-0 invert" />
              </button>
            </div>
          </div>
        </header>

        {/* Nội dung trang con */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
