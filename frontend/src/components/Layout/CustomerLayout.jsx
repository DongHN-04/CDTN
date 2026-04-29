import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CustomerLayout = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Có thể chuyển hướng về trang chủ nếu muốn
  };

  return (
    <div>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>🍽️ Gourmet Restaurant</h1>
        </div>
        <nav>
          <Link to="/" style={linkStyle}>Trang chủ</Link>
          <Link to="/menu" style={linkStyle}>Thực đơn</Link>
          <Link to="/cart" style={linkStyle}>Giỏ hàng</Link>
          {user ? (
            <>
              <span style={{ color: 'white', marginRight: '15px' }}>
                Xin chào, {user.name}
              </span>
              <button onClick={handleLogout} style={buttonStyle}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" style={linkStyle}>Đăng nhập</Link>
              <Link to="/register" style={linkStyle}>Đăng ký</Link>
            </>
          )}
        </nav>
      </header>

      <main style={{ minHeight: '70vh', padding: '20px' }}>
        <Outlet /> {/* Nơi render các trang con */}
      </main>

      <footer style={footerStyle}>
        <p>© 2025 Restaurant Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Styles đơn giản
const headerStyle = {
  background: '#2c3e50',
  color: 'white',
  padding: '1rem 2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  marginLeft: '20px',
};

const buttonStyle = {
  background: 'transparent',
  border: '1px solid white',
  color: 'white',
  padding: '5px 10px',
  cursor: 'pointer',
  borderRadius: '4px',
};

const footerStyle = {
  background: '#ecf0f1',
  textAlign: 'center',
  padding: '1rem',
  marginTop: '20px',
};

export default CustomerLayout;