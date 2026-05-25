import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, UserRound, Utensils } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = path => location.pathname === path;
  const cartCount = getItemCount();

  const navLinks = [
    { path: '/', label: 'Trang Chủ' },
    { path: '/menu', label: 'Thực Đơn' },
    { path: '/promotions', label: 'Khuyến Mãi' },
    { path: '/about', label: 'Giới Thiệu' },
    { path: '/contact', label: 'Liên Hệ' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f9fafb]" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <div className="h-1.5 w-full bg-gradient-to-r from-[#c0392b] via-[#e74c3c] to-[#c0392b]" />

      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-6 px-5">
          <Link to="/" className="flex shrink-0 items-center gap-2 no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c0392b] text-white shadow-sm">
              <Utensils size={22} />
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-black leading-5 tracking-tight text-[#c0392b]">Sơn Đông</span>
              <span className="block text-sm font-bold tracking-tight text-[#c0392b]">FastFood</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-4 py-2 text-[14px] font-semibold no-underline transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-red-50 text-[#c0392b]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="group relative rounded-xl border border-gray-200 bg-gray-50 p-2.5 no-underline transition-all hover:border-red-200 hover:bg-red-50"
              title="Giỏ hàng"
            >
              <ShoppingCart size={20} className="text-gray-600 transition-colors group-hover:text-[#c0392b]" />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#c0392b] text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
                {(user.role === 'admin' || user.role === 'staff') && (
                  <Link
                    to={user.role === 'admin' ? "/admin/dashboard" : "/staff/pos"}
                    className="px-4 py-2 bg-[#c0392b] text-white text-sm font-bold rounded-xl no-underline hover:bg-[#a93226] transition-colors shadow-sm mr-1"
                  >
                    Quản trị
                  </Link>
                )}
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 no-underline transition-all ${
                    isActive('/profile')
                      ? 'border-red-200 bg-red-50 text-[#c0392b]'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-[#c0392b]'
                  }`}
                  title="Hồ sơ của bạn"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#c0392b] shadow-sm">
                    <UserRound size={16} />
                  </span>
                  <span className="hidden max-w-[120px] truncate text-sm font-bold sm:block">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-[#c0392b] px-5 py-2.5 text-sm font-bold text-white no-underline shadow-sm transition-colors hover:bg-[#a93226]"
              >
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="w-full flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 py-10 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0392b] text-white">
                <Utensils size={18} />
              </div>
              <span className="text-lg font-black tracking-tight text-[#c0392b]">Sơn Đông FastFood</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-500">
              Mang đến hương vị ẩm thực đường phố hiện đại chuẩn bản sắc Việt Nam.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-800">Về chúng tôi</h4>
            <ul className="m-0 list-none space-y-3 p-0">
              <li><Link to="/about" className="text-sm text-gray-500 no-underline transition-colors hover:text-[#c0392b]">Giới thiệu</Link></li>
              <li><Link to="/promotions" className="text-sm text-gray-500 no-underline transition-colors hover:text-[#c0392b]">Khuyến mãi</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-500 no-underline transition-colors hover:text-[#c0392b]">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-800">Hỗ trợ khách hàng</h4>
            <ul className="m-0 list-none space-y-3 p-0">
              <li><Link to="/privacy" className="text-sm text-gray-500 no-underline transition-colors hover:text-[#c0392b]">Chính sách bảo mật</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-500 no-underline transition-colors hover:text-[#c0392b]">Điều khoản dịch vụ</Link></li>
              <li><Link to="/faq" className="text-sm text-gray-500 no-underline transition-colors hover:text-[#c0392b]">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-800">Liên hệ</h4>
            <ul className="m-0 list-none space-y-3 p-0 text-sm text-gray-500">
              <li>Kim Giang, Đại Kim, Hoàng Mai, Hà Nội</li>
              <li>0386422292</li>
              <li>Mở cửa: 08:00 - 23:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-4 md:flex-row">
            <p className="m-0 text-xs text-gray-400">© 2024 Sơn Đông FastFood. Mọi quyền được bảo lưu.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-xs text-gray-400 no-underline transition-colors hover:text-gray-600">Privacy Policy</Link>
              <Link to="/terms" className="text-xs text-gray-400 no-underline transition-colors hover:text-gray-600">Terms of Service</Link>
              <Link to="/faq" className="text-xs text-gray-400 no-underline transition-colors hover:text-gray-600">FAQ</Link>
              <Link to="/careers" className="text-xs text-gray-400 no-underline transition-colors hover:text-gray-600">Careers</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
