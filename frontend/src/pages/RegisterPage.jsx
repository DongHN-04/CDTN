import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatApiError } from '../utils/apiError';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '', // Đã thay 'address' thành 'username' theo thiết kế
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return showToast('Mật khẩu xác nhận không khớp', 'error');
    }

    setLoading(true);
    try {
      const userData = await register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      
      if (userData.role === 'customer') {
        navigate('/');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      showToast(formatApiError(err, 'Đăng ký thất bại. Vui lòng thử lại!'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={cardContainerStyle}>
        
        {/* ================= CỘT TRÁI (Branding) ================= */}
        <div style={leftPanelStyle}>
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Sơn Đông Fast Food</h2>
            </div>
            
            {/* Tiêu đề & Mô tả */}
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.3', marginBottom: '20px' }}>
              Hệ thống Quản lý<br/>Nhà hàng Hiện đại
            </h1>
            <p style={{ fontSize: '15px', lineHeight: '1.6', opacity: 0.9 }}>
              Tối ưu hóa quy trình vận hành, quản lý doanh thu và nhân sự chuyên nghiệp chỉ trong một nền tảng duy nhất.
            </p>
          </div>

          {/* Badge Bảo mật */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, fontSize: '13px', letterSpacing: '1px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
            BẢO MẬT CẤP CAO
          </div>
        </div>

        {/* ================= CỘT PHẢI (Form đăng ký) ================= */}
        <div style={rightPanelStyle}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Đăng ký tài khoản</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 30px 0' }}>Nhập thông tin chi tiết của bạn để bắt đầu</p>
            
            <form onSubmit={handleSubmit}>
              
              {/* Form Grid: 2 Cột */}
              <div style={formGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>HỌ VÀ TÊN</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} placeholder="Nguyễn Văn A" />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>TÊN ĐĂNG NHẬP</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required style={inputStyle} placeholder="admin_sondong" />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>EMAIL</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} placeholder="example@gmail.com" />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>SỐ ĐIỆN THOẠI</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} placeholder="0987 xxx xxx" />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>MẬT KHẨU</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle} placeholder="••••••••" />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>XÁC NHẬN MẬT KHẨU</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required style={inputStyle} placeholder="••••••••" />
                </div>
              </div>

              {/* Checkbox điều khoản */}
              <div style={checkboxGroupStyle}>
                <input type="checkbox" id="terms" required style={{ width: '16px', height: '16px', accentColor: '#c0392b', cursor: 'pointer' }} />
                <label htmlFor="terms" style={{ fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>
                  Tôi đồng ý với <span style={{ color: '#c0392b', fontWeight: 'bold' }}>Điều khoản & Chính sách</span> của Sơn Đông Fast Food
                </label>
              </div>

              <button type="submit" disabled={loading} style={loading ? { ...submitButtonStyle, opacity: 0.7 } : submitButtonStyle}>
                {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Bạn đã có tài khoản? <Link to="/login" style={loginLinkStyle}>Trở về đăng nhập →</Link>
              </p>
            </div>
          </div>

          {/* Footer phiên bản */}
          <div style={footerTextStyle}>
            SƠN ĐÔNG FAST FOOD • QUẢN LÝ VẬN HÀNH CHÍNH XÁC • V2.4.0
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= CSS STYLES (Inline) =================

const pageWrapperStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f3f4f6', // Nền xám nhạt
  padding: '20px',
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardContainerStyle = {
  display: 'flex',
  width: '100%',
  maxWidth: '950px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  minHeight: '600px'
};

const leftPanelStyle = {
  width: '40%',
  backgroundColor: '#c0392b',
  // Nếu bạn có ảnh nền gian bếp mờ mờ như trong thiết kế, bạn có thể uncomment dòng dưới và trỏ link ảnh vào:
  // backgroundImage: 'linear-gradient(rgba(192, 57, 43, 0.85), rgba(160, 20, 20, 0.95)), url("/images/kitchen-bg.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: '40px',
  color: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const rightPanelStyle = {
  width: '60%',
  padding: '50px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr', // Chia làm 2 cột bằng nhau
  gap: '20px',
  marginBottom: '20px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#6b7280',
  letterSpacing: '0.5px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #f3f4f6',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#1f2937',
  outline: 'none',
  boxSizing: 'border-box' // Đảm bảo padding không làm tràn width
};

const checkboxGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '25px',
  paddingRight: '10px'
};

const submitButtonStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#c0392b', // Đỏ Sơn Đông
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const loginLinkStyle = {
  color: '#c0392b',
  fontWeight: '700',
  textDecoration: 'none'
};

const footerTextStyle = {
  textAlign: 'center',
  fontSize: '10px',
  color: '#9ca3af',
  letterSpacing: '1px',
  marginTop: '40px'
};

export default RegisterPage;
