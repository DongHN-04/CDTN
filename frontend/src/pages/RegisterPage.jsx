import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatApiError } from '../utils/apiError';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Utensils } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
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
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      showToast('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      showToast(formatApiError(err, 'Đăng ký thất bại. Vui lòng thử lại!'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#f5ece5] p-5 font-sans">
      <div className="flex flex-col md:flex-row w-[950px] max-w-full bg-white rounded-[24px] shadow-[0_25px_50px_-12px_rgba(139,92,246,0.04),0_16px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden min-h-[600px] items-stretch">

        {/* Cột trái: Panel Quảng bá / Slogan thương hiệu */}
        <div className="hidden md:flex w-[38%] bg-gradient-to-br from-[#c0392b] to-[#a93226] p-10 text-white flex-col justify-between relative box-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#c0392b] shadow-sm">
                <Utensils size={22} />
              </div>
              <span className="text-[18px] font-black tracking-wide text-white">Sơn Đông FastFood</span>
            </div>

            <div className="mt-20">
              <h2 className="text-[28px] font-extrabold leading-tight mb-[15px] tracking-tight">
                Ẩm thực tươi ngon<br />
                <span className="text-[#f39c12]">Trải nghiệm tuyệt vời</span>
              </h2>
              <p className="text-[14px] leading-relaxed text-white/85 m-0">
                Đăng ký tài khoản để khám phá thực đơn hấp dẫn, tích lũy điểm thưởng và nhận nhiều ưu đãi đặc quyền khi mua sắm.
              </p>
            </div>
          </div>

          <div className="flex items-center opacity-80 text-[11px] font-bold tracking-wider text-white">
            <ShieldCheck size={18} className="mr-1.5" />
            AN TOÀN & BẢO MẬT 100%
          </div>
        </div>

        {/* Cột phải: Form Đăng ký */}
        <div className="w-full md:w-[62%] p-8 sm:p-12 flex flex-col justify-center box-border">
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5 tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-[13px] text-slate-500 m-0 font-medium">Đăng ký tài khoản để bắt đầu trải nghiệm mua sắm tiện lợi</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Grid Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Họ tên - Full width */}
              <div className="flex flex-col gap-2 w-full sm:col-span-2">
                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">HỌ VÀ TÊN</label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3.5 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-3.5 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">EMAIL TÀI KHOẢN</label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3.5 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-3.5 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                    placeholder="example@gmail.com"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">SỐ ĐIỆN THOẠI</label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3.5 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-3.5 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                    placeholder="0987 xxx xxx"
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">MẬT KHẨU</label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3.5 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-3.5 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">XÁC NHẬN MẬT KHẨU</label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3.5 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-3.5 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox điều khoản */}
            <div className="flex items-center gap-2 mt-0.5">
              <input type="checkbox" id="terms" required className="w-[15px] h-[15px] accent-[#c0392b] cursor-pointer" />
              <label htmlFor="terms" className="text-[13px] text-slate-500 cursor-pointer font-medium select-none">
                Tôi đồng ý với{' '}
                <span className="text-[#c0392b] font-bold">
                  Điều khoản & Chính sách
                </span>{' '}
                của Sơn Đông Fast Food
              </label>
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#c0392b] text-white rounded-xl text-[14px] font-extrabold cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(192, 57, 43, 0.15)] hover:bg-[#a93226] hover:shadow-[0_6px_20px_rgba(192, 57, 43, 0.25)] focus:ring-4 focus:ring-red-100 active:scale-[0.98] transition-all duration-200 mt-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
              <ArrowRight size={18} className="ml-2" />
            </button>
          </form>

          <div className="mt-6 text-[13px] text-slate-500 text-center font-medium">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#c0392b] font-bold hover:text-[#a93226] transition-colors no-underline">Đăng nhập ngay →</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
