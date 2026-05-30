import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { Mail, ArrowRight, Utensils, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.forgotPassword(email);
      showToast(data.message || 'Yêu cầu khôi phục thành công!', 'success');
      setSuccess(true);
      if (data.resetUrl) {
        // Lấy đường dẫn tương đối để chuyển hướng đúng cổng port chạy của React
        const parsedUrl = new URL(data.resetUrl);
        setResetUrl(parsedUrl.pathname);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!', 'error');
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
              Khôi phục<br />
              <span className="text-[#f39c12]">Mật khẩu của bạn</span>
            </h2>
            <p className="text-[14px] leading-relaxed text-white/85 m-0">
              Nhập email đăng ký và hệ thống sẽ gửi đường dẫn đặt lại mật khẩu cho bạn ngay lập tức.
            </p>
          </div>

          <div className="text-[11px] text-white/60 tracking-wider">
            © 2026 Sơn Đông FastFood • V2.4.0
          </div>
        </div>

        {/* Cột phải: Form Quên mật khẩu */}
        <div className="w-full md:w-[58%] p-8 sm:p-12 flex flex-col justify-center box-border">
          
          <Link to="/login" className="inline-flex items-center text-[13px] font-bold text-slate-500 hover:text-[#c0392b] transition-colors mb-6 no-underline gap-1">
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>

          {!success ? (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5 tracking-tight">Quên mật khẩu?</h2>
                <p className="text-[13px] text-slate-500 m-0 font-medium">Nhập email tài khoản của bạn để khôi phục mật khẩu</p>
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

                {/* Nút Gửi */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#c0392b] text-white rounded-xl text-[14px] font-extrabold cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(192,57,43,0.15)] hover:bg-[#a93226] hover:shadow-[0_6px_20px_rgba(192,57,43,0.25)] focus:ring-4 focus:ring-red-100 active:scale-[0.98] transition-all duration-200 mt-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang gửi...' : 'Gửi yêu cầu khôi phục'}
                  <ArrowRight size={18} className="ml-2" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Đã gửi yêu cầu thành công!</h3>
              <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                Chúng tôi đã ghi nhận yêu cầu khôi phục mật khẩu cho email <strong className="text-slate-700">{email}</strong>.
              </p>

              {resetUrl && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-left">
                  <span className="block text-[11px] font-bold text-orange-700 tracking-wide uppercase mb-1">Môi trường thử nghiệm (Local Dev)</span>
                  <p className="text-[13px] text-slate-600 mb-3 leading-relaxed">
                    Hệ thống chạy giả lập không gửi email thật. Click nút bên dưới để khôi phục mật khẩu ngay lập tức:
                  </p>
                  <Link
                    to={resetUrl}
                    className="inline-flex items-center justify-center w-full py-2.5 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors no-underline shadow-sm"
                  >
                    Đi đến trang Đặt lại mật khẩu
                  </Link>
                </div>
              )}

              <p className="text-sm text-slate-400">
                Không nhận được yêu cầu?{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-[#c0392b] font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  Gửi lại yêu cầu
                </button>
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
