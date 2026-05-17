import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const cartCount = getItemCount();

  const navLinks = [
    { path: '/', label: 'Trang Chủ' },
    { path: '/menu', label: 'Thực Đơn' },
    { path: '/promotions', label: 'Khuyến Mãi' },
    { path: '/about', label: 'Giới Thiệu' },
    { path: '/contact', label: 'Liên Hệ' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ===== TOP RED STRIPE ===== */}
      <div className="w-full h-1.5 bg-gradient-to-r from-[#c0392b] via-[#e74c3c] to-[#c0392b]" />

      {/* ===== HEADER / NAVBAR ===== */}
      <header className="bg-white sticky top-0 z-50 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 h-[72px] flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="no-underline flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-[#c0392b] rounded-xl flex items-center justify-center shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block text-[#c0392b] text-lg font-black tracking-tight leading-5">Sơn Đông</span>
              <span className="block text-[#c0392b] text-sm font-bold tracking-tight">FastFood</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-[14px] font-semibold no-underline transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-[#c0392b] bg-red-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section: Search + Cart + Auth */}
          <div className="flex items-center gap-3">

            {/* Search Bar */}
            <div className="relative hidden lg:flex items-center">
              <svg className="absolute left-3 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]/20 transition-all"
              />
            </div>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all no-underline group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-[#c0392b] transition-colors">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#c0392b] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  👋 {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl border-none cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 bg-[#c0392b] text-white text-sm font-bold rounded-xl no-underline hover:bg-[#a93226] transition-colors shadow-sm"
              >
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-white border-t border-gray-200">
        {/* Main Footer */}
        <div className="max-w-[1200px] mx-auto px-5 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {/* Branding */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-[#c0392b] rounded-xl flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
                  </svg>
                </div>
                <span className="text-[#c0392b] text-lg font-black tracking-tight">Sơn Đông FastFood</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Mang đến hương vị ẩm thực đường phố hiện đại chuẩn bản sắc Việt Nam.
              </p>
              <div className="flex gap-2">
                <a href="https://www.facebook.com/ngocson070704" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#c0392b] hover:text-white transition-all no-underline text-sm">🌐</a>
                <a href="https://www.facebook.com/ngocson070704" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#c0392b] hover:text-white transition-all no-underline text-sm">💬</a>
                <a href="mailto:lienhe@sondong.com" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#c0392b] hover:text-white transition-all no-underline text-sm">✉️</a>
              </div>
            </div>

            {/* Về chúng tôi */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Về chúng tôi</h4>
              <ul className="list-none p-0 m-0 space-y-3">
                <li><Link to="/about" className="text-gray-500 text-sm no-underline hover:text-[#c0392b] transition-colors">Giới thiệu</Link></li>
                <li><Link to="/stores" className="text-gray-500 text-sm no-underline hover:text-[#c0392b] transition-colors">Hệ thống cửa hàng</Link></li>
                <li><Link to="/careers" className="text-gray-500 text-sm no-underline hover:text-[#c0392b] transition-colors">Tuyển dụng</Link></li>
              </ul>
            </div>

            {/* Hỗ trợ */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Hỗ trợ khách hàng</h4>
              <ul className="list-none p-0 m-0 space-y-3">
                <li><Link to="/privacy" className="text-gray-500 text-sm no-underline hover:text-[#c0392b] transition-colors">Chính sách bảo mật</Link></li>
                <li><Link to="/terms" className="text-gray-500 text-sm no-underline hover:text-[#c0392b] transition-colors">Điều khoản dịch vụ</Link></li>
                <li><Link to="/faq" className="text-gray-500 text-sm no-underline hover:text-[#c0392b] transition-colors">Câu hỏi thường gặp</Link></li>
              </ul>
            </div>

            {/* Liên hệ */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Liên hệ</h4>
              <ul className="list-none p-0 m-0 space-y-3">
                <li className="flex items-start gap-2 text-gray-500 text-sm">
                  <span className="text-[#c0392b]">📍</span> Kim Giang, Đại Kim, Hoàng Mai, Hà Nội
                </li>
                <li className="flex items-start gap-2 text-gray-500 text-sm">
                  <span className="text-[#c0392b]">📞</span> 0386422292
                </li>
                <li className="flex items-start gap-2 text-gray-500 text-sm">
                  <span className="text-[#c0392b]">⏰</span> Mở cửa: 08:00 - 22:00
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-100">
          <div className="max-w-[1200px] mx-auto px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-gray-400 text-xs m-0">
              © 2024 Sơn Đông FastFood. Mọi quyền được bảo lưu.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-gray-400 text-xs no-underline hover:text-gray-600 transition-colors">Chính Sách Bảo Mật</Link>
              <Link to="/terms" className="text-gray-400 text-xs no-underline hover:text-gray-600 transition-colors">Điều Khoản Dịch Vụ</Link>
              <Link to="/faq" className="text-gray-400 text-xs no-underline hover:text-gray-600 transition-colors">Câu Hỏi Thường Gặp</Link>
              <Link to="/careers" className="text-gray-400 text-xs no-underline hover:text-gray-600 transition-colors">Tuyển Dụng</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;