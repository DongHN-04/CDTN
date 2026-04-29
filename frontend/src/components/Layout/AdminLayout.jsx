import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Định nghĩa các mục menu và role được phép xem
  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', roles: ['admin', 'staff'] },
    { label: 'Bán hàng (POS)', path: '/staff/pos', roles: ['staff'] },
    { label: 'Quản lý nhân sự', path: '/admin/employees', roles: ['admin'] },
    { label: 'Quản lý thực đơn', path: '/admin/menu', roles: ['admin'] },
    { label: 'Quản lý kho', path: '/admin/inventory', roles: ['admin'] },
    { label: 'Quản lý khách hàng', path: '/admin/customers', roles: ['admin', 'staff'] },
    { label: 'Quản lý hóa đơn', path: '/admin/invoices', roles: ['admin', 'staff'] },
    { label: 'Báo cáo thống kê', path: '/admin/reports', roles: ['admin'] },
  ];

  // Lọc menu dựa trên role của user hiện tại
  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <h2 style={{ color: '#ecf0f1', marginBottom: '20px' }}>Quản lý nhà hàng</h2>
        <div style={{ color: '#bdc3c7', marginBottom: '20px' }}>
          <p>👤 {user?.name}</p>
          <p>🔑 Role: {user?.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</p>
        </div>
        <hr style={{ borderColor: '#7f8c8d' }} />
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredMenu.map(item => (
              <li key={item.path} style={{ marginBottom: '10px' }}>
                <Link to={item.path} style={sidebarLinkStyle}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button onClick={handleLogout} style={logoutButtonStyle}>
          Đăng xuất
        </button>
      </aside>

      {/* Main Content */}
      <main style={mainContentStyle}>
        <Outlet />
      </main>
    </div>
  );
};

const sidebarStyle = {
  width: '260px',
  background: '#2c3e50',
  color: 'white',
  minHeight: '100vh',
  padding: '20px',
};

const sidebarLinkStyle = {
  color: '#ecf0f1',
  textDecoration: 'none',
  display: 'block',
  padding: '8px 10px',
  borderRadius: '4px',
  transition: 'background 0.3s',
};

const logoutButtonStyle = {
  marginTop: '30px',
  width: '100%',
  padding: '10px',
  background: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const mainContentStyle = {
  flex: 1,
  padding: '20px',
  background: '#f5f7fa',
};

export default AdminLayout;