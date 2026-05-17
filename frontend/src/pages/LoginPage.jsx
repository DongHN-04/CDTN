import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State cho nút ẩn/hiện mật khẩu
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login({ email, password });
      if (userData.role === 'admin' || userData.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapperStyle}>
      
      {/* Background Watermark (Logo mờ phía sau) */}
      <div style={watermarkStyle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#f0e6e6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ width: '600px', height: '600px' }}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
      </div>

      {/* Header Logo Section */}
      <div style={headerSectionStyle}>
        <div style={logoIconBoxStyle}>
          <img 
              src="/images/ICON/restaurant.png" 
              alt="Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
            />
        </div>
        <h1 style={titleStyle}>Sơn Đông Fast Food</h1>
        <p style={subtitleStyle}>HỆ THỐNG QUẢN LÝ VẬN HÀNH</p>
      </div>

      {/* Login Form Card */}
      <div style={formCardStyle}>
        <h2 style={{ fontSize: '22px', marginBottom: '30px', color: '#111827' }}>Đăng nhập hệ thống</h2>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          
          {/* Input: Tên đăng nhập */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>TÊN ĐĂNG NHẬP</label>
            <div style={inputWrapperStyle}>
              <span style={leftIconStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="admin_sondong"
              />
            </div>
          </div>

          {/* Input: Mật khẩu */}
          <div style={formGroupStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>MẬT KHẨU</label>
              <Link to="/forgot-password" style={forgotPasswordStyle}>Quên mật khẩu?</Link>
            </div>
            <div style={inputWrapperStyle}>
              <span style={leftIconStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
              />
              <span style={rightIconStyle} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </span>
            </div>
          </div>

          {/* Ghi nhớ đăng nhập */}
          <div style={rememberStyle}>
            <input type="checkbox" id="remember" style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#c0392b' }} />
            <label htmlFor="remember" style={{ cursor: 'pointer', color: '#6b7280', fontSize: '14px' }}>Ghi nhớ phiên đăng nhập</label>
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...buttonStyle, opacity: 0.7 } : buttonStyle}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Footer */}
        <div style={footerStyle}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Bạn chưa có tài khoản ? <Link to="/register" style={registerLinkStyle}>Yêu cầu đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// ================= CSS STYLES (Inline) =================

const pageWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  position: 'relative',
  overflow: 'hidden'
};

const watermarkStyle = {
  position: 'absolute',
  top: '-10%',
  right: '-10%',
  zIndex: 0,
  opacity: 0.5,
  pointerEvents: 'none'
};

const headerSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '30px',
  zIndex: 1
};

const logoIconBoxStyle = {
  width: '60px',
  height: '60px',
  backgroundColor: '#c0392b',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '15px',
  boxShadow: '0 4px 6px -1px rgba(192, 57, 43, 0.3)'
};

const titleStyle = {
  margin: '0 0 5px 0',
  color: '#c0392b',
  fontSize: '28px',
  fontWeight: '900',
  letterSpacing: '-0.5px'
};

const subtitleStyle = {
  margin: 0,
  color: '#6b7280',
  fontSize: '13px',
  fontWeight: '600',
  letterSpacing: '1.5px'
};

const formCardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: '40px',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
  zIndex: 1
};

const formGroupStyle = {
  marginBottom: '25px',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#4b5563',
  letterSpacing: '0.5px',
  display: 'block',
  marginBottom: '8px'
};

const forgotPasswordStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#c0392b',
  textDecoration: 'none',
  marginBottom: '8px'
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const leftIconStyle = {
  position: 'absolute',
  left: '0',
  display: 'flex',
  alignItems: 'center',
  color: '#9ca3af'
};

const rightIconStyle = {
  position: 'absolute',
  right: '0',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '5px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 30px 10px 30px', // Chừa khoảng trống cho icon trái/phải
  border: 'none',
  borderBottom: '2px solid #e5e7eb',
  fontSize: '15px',
  outline: 'none',
  backgroundColor: 'transparent',
  transition: 'border-color 0.3s',
  color: '#111827'
};

const rememberStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '30px',
  marginTop: '-5px'
};

const buttonStyle = {
  width: '100%',
  padding: '14px',
  background: '#c0392b',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background 0.3s',
  boxShadow: '0 4px 6px -1px rgba(192, 57, 43, 0.2)'
};

const errorStyle = {
  background: '#fef2f2',
  color: '#b91c1c',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '14px',
  borderLeft: '4px solid #ef4444'
};

const footerStyle = {
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #f3f4f6',
  textAlign: 'center'
};

const registerLinkStyle = {
  color: '#0369a1', // Màu xanh lục đậm giống thiết kế
  fontWeight: '700',
  textDecoration: 'none'
};

export default LoginPage;