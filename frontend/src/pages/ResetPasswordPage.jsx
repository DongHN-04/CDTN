import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { Lock, ArrowRight, Utensils, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return showToast('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số', 'error');
    }

    if (password !== confirmPassword) {
      return showToast('Mật khẩu xác nhận không trùng khớp', 'error');
    }

    setLoading(true);

    try {
      const data = await authService.resetPassword(token, password);
      showToast(data.message || 'Mật khẩu đã đặt lại thành công!', 'success');
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Mã khôi phục không hợp lệ hoặc đã hết hạn!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#f5ece5] p-5 font-sans">
      <div className="flex flex-col md:flex-row w-[900px] max-w-full bg-white rounded-[24px] shadow-[0_25px_50px_-12px_rgba(139,92,246,0.04),0_16px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden min-h-[520px] items-stretch">
        
        {/* Cột trái: Panel Slogan */}
        <div className="hidden md:flex w-[42%] bg-gradient-to-br from-[#c0392b] to-[#a93226] p-10 text-white flex-col justify-between relative box-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#c0392b] shadow-sm">
              <Utensils size={22} />
            </div>
            <span className="text-[18px] font-black tracking-wide text-white">Sơn Đông FastFood</span>
          </div>

          <div className="my-15">
            <h2 className="text-[28px] font-extrabold leading-tight mb-[15px] tracking-tight">
              Đặt lại<br />
              <span className="text-[#f39c12]">Mật khẩu mới</span>
            </h2>
            <p className="text-[14px] leading-relaxed text-white/85 m-0">
              Vui lòng thiết lập mật khẩu mới đủ mạnh và ghi nhớ để bảo mật tài khoản của bạn.
            </p>
          </div>

          <div className="text-[11px] text-white/60 tracking-wider">
            © 2026 Sơn Đông FastFood • V2.4.0
          </div>
        </div>

        {/* Cột phải: Form Đặt lại mật khẩu */}
        <div className="w-full md:w-[58%] p-8 sm:p-12 flex flex-col justify-center box-border">

          {!success ? (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5 tracking-tight">Thiết lập mật khẩu</h2>
                <p className="text-[13px] text-slate-500 m-0 font-medium">Nhập mật khẩu mới của bạn bên dưới</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Mật khẩu mới */}
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">MẬT KHẨU MỚI</label>
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
                      placeholder="Mật khẩu mới (tối thiểu 8 ký tự, gồm chữ và số)"
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

                {/* Xác nhận mật khẩu mới */}
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">XÁC NHẬN MẬT KHẨU MỚI</label>
                  <div className="relative flex items-center w-full">
                    <span className="absolute left-3.5 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-12 py-3 text-[14px] text-slate-800 bg-slate-50 border-[1.5px] border-slate-100 rounded-xl outline-none focus:border-red-200 focus:bg-white focus:ring-2 focus:ring-red-100/50 transition-all duration-200 box-border"
                      placeholder="Xác nhận lại mật khẩu mới"
                    />
                  </div>
                </div>

                {/* Nút Đổi mật khẩu */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#c0392b] text-white rounded-xl text-[14px] font-extrabold cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(192,57,43,0.15)] hover:bg-[#a93226] hover:shadow-[0_6px_20px_rgba(192,57,43,0.25)] focus:ring-4 focus:ring-red-100 active:scale-[0.98] transition-all duration-200 mt-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  <ArrowRight size={18} className="ml-2" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Đổi mật khẩu thành công!</h3>
              <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn đang được tự động chuyển hướng về trang đăng nhập sau vài giây...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-2.5 bg-[#c0392b] text-white text-sm font-bold rounded-lg hover:bg-[#a93226] transition-colors no-underline shadow-sm"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;
