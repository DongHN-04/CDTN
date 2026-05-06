import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dữ liệu thông báo mẫu
  const notifications = [
    { id: 1, text: 'Có đơn hàng mới #SD-8493 cần xác nhận', time: '5 phút trước', isRead: false },
    { id: 2, text: 'Kho hàng sắp hết: Gà rán giòn (còn 5 phần)', time: '1 giờ trước', isRead: false },
    { id: 3, text: 'Khách hàng Nguyễn Văn A vừa đăng ký thành viên', time: '3 giờ trước', isRead: true },
    { id: 4, text: 'Báo cáo doanh thu ngày 23/05 đã sẵn sàng', time: '1 ngày trước', isRead: true },
  ];

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICDashboard.png' },
    { label: 'Bán hàng (POS)', path: '/staff/pos', roles: ['staff'], iconSrc: '/images/ICON/IC-POS.png' },
    { label: 'Quản lý nhân sự', path: '/admin/employees', roles: ['admin'], iconSrc: '/images/ICON/ICEmployee.png' },
    { label: 'Quản lý thực đơn', path: '/admin/menu', roles: ['admin'], iconSrc: '/images/ICON/ICMenu.png' },
    { label: 'Quản lý kho', path: '/admin/inventory', roles: ['admin'], iconSrc: '/images/ICON/ICKho.png' },
    { label: 'Quản lý khách hàng', path: '/admin/customers', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICCustomer.png' },
    { label: 'Quản lý hóa đơn', path: '/admin/invoices', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICHoaDon.png' },
    { label: 'Quản lý Khuyến mãi', path: '/admin/promotions', roles: ['admin'], iconSrc: '/images/ICON/ICPromo.png' },
    { label: 'Quản lý Combo', path: '/admin/combos', roles: ['admin'], iconSrc: '/images/ICON/ICCombo.png' },
    { label: 'Đơn hàng khách', path: '/admin/customer-orders', roles: ['admin', 'staff'], iconSrc: '/images/ICON/ICOrder.png' },
    { label: 'Quản lý QR Bàn', path: '/admin/qrcodes', roles: ['admin'], iconSrc: '/images/ICON/ICQR.png' },
    { label: 'Báo cáo thống kê', path: '/admin/reports', roles: ['admin'], iconSrc: '/images/ICON/ICDoanhThu.png' },
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
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
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
                        className={`w-[22px] h-[22px] object-contain transition-all ${
                          isActive ? '' : 'grayscale opacity-60'
                        }`}
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
          {/* Đã sửa chữ và in đậm hơn theo yêu cầu */}
          <h2 className="text-[#c0392b] text-2xl font-black m-0 tracking-tight">Sơn Đông Food</h2>
          
          <div className="flex items-center gap-5">
            {/* Phần Tìm kiếm đã được xóa bỏ */}
            
            <div className="flex items-center gap-4 pl-5 border-l border-gray-200">
              {/* Nút thông báo */}
              <div className="relative">
                <button
                  className="bg-transparent border-none p-1 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                  title="Thông báo"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <img src="/images/ICON/ICnotice.png" alt="Notice" className="w-6 h-6 object-contain opacity-70" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    2
                  </span>
                </button>
                
                {/* Dropdown Thông báo */}
                {showNotifications && (
                  <div className="absolute top-12 -right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-3 px-4 border-b border-gray-100 bg-gray-50/50">
                      <h4 className="m-0 text-[15px] font-bold text-gray-800">Thông báo mới</h4>
                      <span className="text-xs text-blue-500 cursor-pointer hover:underline font-medium">Đánh dấu đã đọc</span>
                    </div>
                    <ul className="list-none p-0 m-0 max-h-80 overflow-y-auto">
                      {notifications.map(notif => (
                        <li
                          key={notif.id}
                          className={`p-3 px-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                            notif.isRead ? 'bg-white' : 'bg-blue-50/30'
                          }`}
                        >
                          <p className={`m-0 mb-1 text-[13px] text-gray-700 ${notif.isRead ? 'font-normal' : 'font-semibold'}`}>
                            {notif.text}
                          </p>
                          <span className="text-[11px] text-gray-400">{notif.time}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-2.5 text-center text-[13px] text-gray-600 font-semibold cursor-pointer border-t border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                      Xem tất cả thông báo
                    </div>
                  </div>
                )}
              </div>

              {/* Nút Cài đặt */}
              <button className="bg-transparent border-none p-1 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors" title="Cài đặt">
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