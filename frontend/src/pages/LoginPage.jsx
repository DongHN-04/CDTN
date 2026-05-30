import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Utensils } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await login({ email, password });
      if (userData.role === 'admin' || userData.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#f5ece5] p-5 font-sans">
      <div className="flex flex-col md:flex-row w-[900px] max-w-full bg-white rounded-[24px] shadow-[0_25px_50px_-12px_rgba(139,92,246,0.04),0_16px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden min-h-[520px] items-stretch">

        {/* Cột trái: Panel Quảng bá / Slogan thương hiệu */}
        <div className="hidden md:flex w-[42%] bg-gradient-to-br from-[#c0392b] to-[#a93226] p-10 text-white flex-col justify-between relative box-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#c0392b] shadow-sm">
              <Utensils size={22} />
            </div>
            <span className="text-[18px] font-black tracking-wide text-white">Sơn Đông FastFood</span>
          </div>

          <div className="my-15">
            <h2 className="text-[28px] font-extrabold leading-tight mb-[15px] tracking-tight">
              Hương vị tuyệt hảo<br />
              <span className="text-[#f39c12]">Đặt hàng tiện lợi</span>
            </h2>
            <p className="text-[14px] leading-relaxed text-white/85 m-0">
              Hệ thống đặt món nhanh chóng và quản lý bán hàng tối ưu. Trải nghiệm ẩm thực tuyệt vời của chuỗi cửa hàng Sơn Đông FastFood.
            </p>
          </div>

          <div className="text-[11px] text-white/60 tracking-wider">
            © 2026 Sơn Đông FastFood • V2.4.0
          </div>
        </div>

        {/* Cột phải: Form Đăng nhập */}
        <div className="w-full md:w-[58%] p-8 sm:p-12 flex flex-col justify-center box-border">
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5 tracking-tight">Chào mừng bạn quay lại!</h2>
            <p className="text-[13px] text-slate-500 m-0 font-medium">Đăng nhập để đặt món hoặc quản lý hệ thống</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Input Email */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">EMAIL TÀI KHOẢN</label>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-3.5 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center w-full">
                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">MẬT KHẨU</label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-[#c0392b] hover:text-[#a93226] transition-colors no-underline">Quên mật khẩu?</Link>
              </div>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bg-transparent border-none cursor-pointer flex items-center p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-gray-500" />}
                </button>
              </div>
            </div>

            {/* Ghi nhớ đăng nhập */}
            <div className="flex items-center gap-2 mt-0.5">
              <input type="checkbox" id="remember" className="w-[15px] h-[15px] accent-[#c0392b] cursor-pointer" />
              <label htmlFor="remember" className="text-[13px] text-slate-500 cursor-pointer font-medium select-none">Ghi nhớ phiên đăng nhập</label>
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#c0392b] text-white rounded-xl text-[14px] font-extrabold cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(192,57,43,0.15)] hover:bg-[#a93226] hover:shadow-[0_6px_20px_rgba(192,57,43,0.25)] focus:ring-4 focus:ring-red-100 active:scale-[0.98] transition-all duration-200 mt-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              <ArrowRight size={18} className="ml-2" />
            </button>
          </form>

          <div className="mt-6 text-[13px] text-slate-500 text-center font-medium">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#c0392b] font-bold hover:text-[#a93226] transition-colors no-underline">Đăng ký ngay</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
