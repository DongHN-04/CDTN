import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/'); // Chuyển về trang chủ sau khi đăng xuất
  };

  // Hàm kiểm tra menu active
  const isActive = (path) => location.pathname === path;

  return (
    <div style={containerStyle}>
      
      {/* ================= HEADER ================= */}
      <header style={headerStyle}>
        <div style={headerContainerStyle}>
          {/* Logo */}
          <Link to="/" style={logoStyle}>
            Sơn Đông Fast Food
          </Link>

          {/* Navigation */}
          <nav style={navStyle}>
            <Link to="/" style={isActive('/') ? activeLinkStyle : linkStyle}>Trang chủ</Link>
            <Link to="/menu" style={isActive('/menu') ? activeLinkStyle : linkStyle}>Thực đơn</Link>
            <Link to="/promotions" style={isActive('/promotions') ? activeLinkStyle : linkStyle}>Khuyến mãi</Link>
            <Link to="/about" style={isActive('/about') ? activeLinkStyle : linkStyle}>Giới thiệu</Link>
            <Link to="/contact" style={isActive('/contact') ? activeLinkStyle : linkStyle}>Liên hệ</Link>
            <Link to="/cart" style={isActive('/cart') ? activeLinkStyle : linkStyle}>Giỏ hàng</Link>
          </nav>

          {/* Auth Section */}
          <div style={authSectionStyle}>
            {user ? (
              <>
                <span style={greetingStyle}>👋 Chào, {user.name}</span>
                <button onClick={handleLogout} style={logoutBtnStyle}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" style={loginBtnStyle}>Đăng nhập</Link>
                <Link to="/register" style={registerBtnStyle}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main style={mainContentStyle}>
        <Outlet /> 
      </main>

      {/* ================= FOOTER ================= */}
      <footer style={footerStyle}>
        <div style={footerContainerStyle}>
          
          {/* Cột 1: Branding */}
          <div style={footerColumnStyle}>
            <h3 style={footerLogoStyle}>Sơn Đông Fast Food</h3>
            <p style={footerDescStyle}>
              Mang đến hương vị ẩm thực đường phố hiện đại chuẩn bản sắc Việt Nam. Cam kết chất lượng và sự tận tâm.
            </p>
            {/* Social Icons Placeholder */}
          <div className="flex gap-2.5 mt-2">
            <a 
              href="https://www.facebook.com/ngocson070704" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:text-[#c0392b] transition-all text-sm no-underline"
            >
              🌐
            </a>

            {/* Link Zalo / Messenger */}
            <a 
              href="https://www.facebook.com/ngocson070704" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:text-[#c0392b] transition-all text-sm no-underline"
            >
              💬
            </a>

            <a 
              href="mailto:lienhe@sondong.com" 
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:text-[#c0392b] transition-all text-sm no-underline"
            >
              ✉️
            </a>
          </div>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div style={footerColumnStyle}>
            <h4 style={footerHeadingStyle}>Về chúng tôi</h4>
            <ul style={footerListStyle}>
              <li><Link to="/about" style={footerLinkStyle}>Giới thiệu</Link></li>
              <li><Link to="/stores" style={footerLinkStyle}>Hệ thống cửa hàng</Link></li>
              <li><Link to="/careers" style={footerLinkStyle}>Tuyển dụng</Link></li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng */}
          <div style={footerColumnStyle}>
            <h4 style={footerHeadingStyle}>Hỗ trợ khách hàng</h4>
            <ul style={footerListStyle}>
              <li><Link to="/privacy" style={footerLinkStyle}>Chính sách bảo mật</Link></li>
              <li><Link to="/terms" style={footerLinkStyle}>Điều khoản sử dụng</Link></li>
              <li><Link to="/refund" style={footerLinkStyle}>Chính sách hoàn tiền</Link></li>
              <li><Link to="/faq" style={footerLinkStyle}>Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div style={footerColumnStyle}>
            <h4 style={footerHeadingStyle}>Liên hệ</h4>
            <ul style={footerListStyle}>
              <li style={contactItemStyle}>
                <span style={contactIconStyle}>📍</span>
                Kim Giang, Đại Kim, Hoàng Mai, Hà Nội
              </li>
              <li style={contactItemStyle}>
                <span style={contactIconStyle}>📞</span>
                0386422292
              </li>
              <li style={contactItemStyle}>
                <span style={contactIconStyle}>⏰</span>
                Mở cửa: 08:00 - 22:00
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div style={copyrightStyle}>
          © 2026 Sơn Đông Fast Food. Tinh hoa ẩm thực đường phố.
        </div>
      </footer>
    </div>
  );
};

// ================= STYLES =================

const containerStyle = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#f9fafb' // Nền hơi xám sáng
};

/* --- Header Styles --- */
const headerStyle = {
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #f3f4f6',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
};

const headerContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 20px',
  height: '80px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const logoStyle = {
  color: '#c0392b',
  fontSize: '22px',
  fontWeight: '900',
  textDecoration: 'none',
  letterSpacing: '-0.5px'
};

const navStyle = {
  display: 'flex',
  gap: '30px',
  alignItems: 'center'
};

const linkStyle = {
  color: '#4b5563',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  padding: '8px 0',
  transition: 'color 0.2s',
};

const activeLinkStyle = {
  ...linkStyle,
  color: '#c0392b',
  borderBottom: '2px solid #c0392b'
};

/* --- Auth & Buttons --- */
const authSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px'
};

const greetingStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151'
};

const loginBtnStyle = {
  textDecoration: 'none',
  color: '#c0392b',
  fontWeight: '600',
  fontSize: '14px',
  padding: '8px 16px',
};

const registerBtnStyle = {
  textDecoration: 'none',
  backgroundColor: '#c0392b',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '14px',
  padding: '10px 20px',
  borderRadius: '8px',
  transition: 'opacity 0.2s'
};

const logoutBtnStyle = {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
};

/* --- Main Content --- */
const mainContentStyle = {
  flex: 1,
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
};

/* --- Footer Styles --- */
const footerStyle = {
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '60px',
  marginTop: '40px'
};

const footerContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '40px',
  marginBottom: '40px'
};

const footerColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const footerLogoStyle = {
  color: '#c0392b',
  fontSize: '18px',
  fontWeight: '800',
  margin: '0 0 5px 0'
};

const footerDescStyle = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: 0
};

// const socialIconsStyle = {
//   display: 'flex',
//   gap: '10px',
//   marginTop: '10px'
// };

// const socialIconWrapper = {
//   width: '32px',
//   height: '32px',
//   backgroundColor: '#f3f4f6',
//   borderRadius: '50%',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   cursor: 'pointer',
//   fontSize: '14px'
// };

const footerHeadingStyle = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 5px 0'
};

const footerListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const footerLinkStyle = {
  color: '#6b7280',
  textDecoration: 'none',
  fontSize: '13px',
  transition: 'color 0.2s'
};

const contactItemStyle = {
  color: '#6b7280',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  lineHeight: '1.5'
};

const contactIconStyle = {
  color: '#c0392b',
  fontSize: '14px'
};

const copyrightStyle = {
  textAlign: 'center',
  padding: '20px',
  borderTop: '1px solid #e5e7eb',
  color: '#9ca3af',
  fontSize: '12px',
  letterSpacing: '0.5px'
};

export default CustomerLayout;