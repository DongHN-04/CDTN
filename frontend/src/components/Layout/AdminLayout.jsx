import React, { useState } from 'react'; // THÊM useState ở đây
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tạo state để quản lý việc ẩn/hiện bảng thông báo
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dữ liệu thông báo mẫu (Sau này bạn sẽ lấy từ API Backend/MongoDB)
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
    { label: 'Báo cáo thống kê', path: '/admin/reports', roles: ['admin'], iconSrc: '/images/ICON/ICDoanhThu.png' },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || 'admin'));

  return (
    <div style={appContainerStyle}>
      
      {/* ================= SIDEBAR ================= */}
      <aside style={sidebarStyle}>
        <div style={{ padding: '30px 20px 20px 20px' }}>
          <h2 style={logoTextStyle}>SƠN ĐÔNG ADMIN</h2>
        </div>

        <div style={userInfoStyle}>
          <div style={avatarWrapperStyle}>
            <img 
              src="https://i.pravatar.cc/150?img=11" 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div>
            <p style={userNameStyle}>{user?.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</p>
            <p style={userSubStyle}>{user?.name || 'Sơn Đông Admin'}</p>
          </div>
        </div>

        <nav style={{ flex: 1, marginTop: '10px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredMenu.map(item => {
              const isActive = location.pathname.includes(item.path);
              return (
                <li key={item.path} style={{ marginBottom: '5px' }}>
                  <Link 
                    to={item.path} 
                    style={{
                      ...sidebarLinkStyle,
                      ...(isActive ? activeLinkStyle : inactiveLinkStyle)
                    }}
                  >
                    {item.iconSrc && (
                      <img 
                        src={item.iconSrc} 
                        alt="" 
                        style={{
                          ...iconStyle,
                          filter: isActive ? 'none' : 'grayscale(100%) opacity(60%)' 
                        }} 
                      />
                    )}
                    <span style={{ fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ================= PHẦN BÊN PHẢI ================= */}
      <div style={rightWrapperStyle}>
        <header style={headerStyle}>
          <h2 style={{ color: '#c0392b', fontSize: '20px', margin: 0 }}>Sơn Đông Fast Food</h2>
          
          <div style={headerRightStyle}>
            <input 
              type="text" 
              placeholder="Tìm kiếm ..." 
              style={searchInputStyle}
            />
            
            <div style={headerActionStyle}>
              
              {/* === KHU VỰC NÚT THÔNG BÁO === */}
              <div style={{ position: 'relative' }}>
                <button 
                  style={iconButtonStyle} 
                  title="Thông báo"
                  onClick={() => setShowNotifications(!showNotifications)} // Bật/tắt trạng thái
                >
                  <img src="/images/ICON/ICnotice.png" alt="" style={headerIconStyle} />
                  {/* Chấm đỏ báo có thông báo mới */}
                  <span style={notificationBadgeStyle}>2</span>
                </button>

                {/* Bảng thả xuống (Chỉ hiện khi showNotifications = true) */}
                {showNotifications && (
                  <div style={notificationDropdownStyle}>
                    <div style={notificationHeaderStyle}>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937' }}>Thông báo mới</h4>
                      <span style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>Đánh dấu đã đọc</span>
                    </div>
                    
                    <ul style={notificationListStyle}>
                      {notifications.map(notif => (
                        <li key={notif.id} style={{
                          ...notificationItemStyle,
                          backgroundColor: notif.isRead ? '#ffffff' : '#eff6ff' // Bôi màu xanh nhạt nếu chưa đọc
                        }}>
                          <p style={{ 
                            margin: '0 0 4px 0', 
                            fontSize: '13px', 
                            color: '#374151',
                            fontWeight: notif.isRead ? '400' : '600'
                          }}>
                            {notif.text}
                          </p>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{notif.time}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div style={notificationFooterStyle}>
                      Xem tất cả thông báo
                    </div>
                  </div>
                )}
              </div>
              {/* === HẾT KHU VỰC NÚT THÔNG BÁO === */}

              <button style={iconButtonStyle} title="Cài đặt">
                <img src="/images/ICON/ICsetting.png" alt="" style={headerIconStyle} />
              </button>
              
              <button onClick={handleLogout} style={logoutBtnStyle} title="Đăng xuất">
                <img src="/images/ICON/IClogout.png" alt="" style={logoutIconStyle} />
              </button>
            </div>
          </div>
        </header>

        <main style={mainContentStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// ================= CSS STYLES (Inline) =================

const appContainerStyle = { display: 'flex', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'system-ui, -apple-system, sans-serif' };
const sidebarStyle = { width: '260px', background: '#f8f9fa', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', zIndex: 10 };
const logoTextStyle = { color: '#c0392b', margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' };
const userInfoStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px 20px 20px' };
const avatarWrapperStyle = { width: '45px', height: '45px', borderRadius: '8px', backgroundColor: '#333', overflow: 'hidden' };
const userNameStyle = { margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#111' };
const userSubStyle = { margin: 0, fontSize: '13px', color: '#666' };
const sidebarLinkStyle = { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', textDecoration: 'none', fontSize: '14px', transition: 'all 0.2s', borderLeft: '4px solid transparent' };
const activeLinkStyle = { backgroundColor: '#fceaea', color: '#c0392b', borderLeftColor: '#c0392b' };
const inactiveLinkStyle = { color: '#4b5563' };
const iconStyle = { width: '22px', height: '22px', objectFit: 'contain' };
const rightWrapperStyle = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const headerStyle = { height: '70px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #e5e7eb' };
const headerRightStyle = { display: 'flex', alignItems: 'center', gap: '20px' };
const searchInputStyle = { padding: '8px 15px', borderRadius: '8px', border: 'none', backgroundColor: '#f3f4f6', width: '250px', fontSize: '14px', outline: 'none' };
const headerActionStyle = { display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #e5e7eb', paddingLeft: '20px' };
const iconButtonStyle = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const logoutBtnStyle = { background: '#c0392b', border: 'none', borderRadius: '8px', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const mainContentStyle = { flex: 1, padding: '30px', overflowY: 'auto' };
const headerIconStyle = { width: '24px', height: '24px', objectFit: 'contain', opacity: 0.7, cursor: 'pointer' };
const logoutIconStyle = { width: '18px', height: '18px', objectFit: 'contain', filter: 'brightness(0) invert(1)' };

/* --- CSS MỚI CHO BẢNG THÔNG BÁO --- */
const notificationBadgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  backgroundColor: '#ef4444',
  color: 'white',
  fontSize: '10px',
  fontWeight: 'bold',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid white'
};

const notificationDropdownStyle = {
  position: 'absolute',
  top: '40px',
  right: '-60px', // Đẩy lùi sang trái một chút để không bị lẹm ra ngoài màn hình
  width: '320px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e5e7eb',
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column'
};

const notificationHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb'
};

const notificationListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  maxHeight: '320px', // Giới hạn chiều cao
  overflowY: 'auto'   // Thêm thanh cuộn nếu có quá nhiều thông báo
};

const notificationItemStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const notificationFooterStyle = {
  padding: '10px',
  textAlign: 'center',
  fontSize: '13px',
  color: '#4b5563',
  fontWeight: '600',
  cursor: 'pointer',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px'
};

export default AdminLayout;