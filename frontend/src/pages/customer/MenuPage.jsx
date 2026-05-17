import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import publicService from '../../services/publicService';
import { useLocation } from 'react-router-dom';

// Định nghĩa defaultImages
const defaultImages = {
  'Burger': '/images/home/product-burger.png',
  'Gà Rán': '/images/home/product-chicken.png',
  'Pizza': '/images/home/product-pizza.png',
  'Đồ Uống': '/images/home/product-sandwich.png',
  'Tráng Miệng': '/images/home/product-sandwich.png',
  'Khai Vị': '/images/home/product-chicken.png',
};

const formatPrice = (val) => val.toLocaleString('vi-VN') + 'đ';

// Định nghĩa cấu trúc danh mục UI
const categoriesUI = [
  { id: 'all', label: 'Tất cả' },
  { id: 'burger', label: 'Burger', dbCats: ['Burger'] },
  { id: 'garan', label: 'Gà rán', dbCats: ['Gà Rán'] },
  { id: 'ankem', label: 'Món ăn kèm', dbCats: ['Pizza', 'Khai Vị', 'Tráng Miệng', 'Combo'] },
  { id: 'douong', label: 'Đồ uống', dbCats: ['Đồ Uống'] }
];

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCatIds, setSelectedCatIds] = useState(['all']);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [minPriceInput, setMinPriceInput] = useState('0');
  const [maxPriceInput, setMaxPriceInput] = useState('500.000');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  const { addItem } = useCart();
  const location = useLocation();

  useEffect(() => {
    publicService.getMenu().then(data => {
      setMenuItems(data || []);
    });
  }, []);

  // Nếu URL có category, lọc sẵn
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      const foundUI = categoriesUI.find(ui => ui.dbCats?.includes(cat));
      if (foundUI) {
        setSelectedCatIds([foundUI.id]);
      }
    }
  }, [location]);

  const handleCategoryToggle = (id) => {
    if (id === 'all') {
      setSelectedCatIds(['all']);
    } else {
      let next = selectedCatIds.filter(x => x !== 'all');
      if (next.includes(id)) {
        next = next.filter(x => x !== id);
      } else {
        next.push(id);
      }
      if (next.length === 0) {
        setSelectedCatIds(['all']);
      } else {
        setSelectedCatIds(next);
      }
    }
  };

  const parsePrice = (str) => {
    const cleanStr = str.replace(/[^0-9]/g, '');
    return cleanStr ? parseInt(cleanStr, 10) : 0;
  };

  const handlePriceChange = (val, isMin) => {
    // Chỉ giữ lại số
    const num = val.replace(/[^0-9]/g, '');
    let formatted = '';
    if (num) {
      formatted = parseInt(num, 10).toLocaleString('vi-VN');
    }
    
    if (isMin) {
      setMinPriceInput(formatted ? formatted + 'đ' : '0đ');
    } else {
      setMaxPriceInput(formatted ? formatted + 'đ' : '');
    }
  };

  const handleAddToCart = (item) => {
    addItem(item, 1);
    setToast({ show: true, message: `Đã thêm "${item.name}" vào giỏ hàng!` });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500);
  };

  // Trích lọc dữ liệu và trang trí (badges, out of stock)
  const filteredMenu = menuItems.map((item, idx) => {
    let badge = null;
    if (item.name === 'Burger Bò Đặc Biệt' || item.name === 'Pizza Pepperoni') {
      badge = 'PHỔ BIẾN';
    } else if (item.name.toLowerCase().includes('cay')) {
      badge = 'CAY';
    } else if (item.name === 'Khoai Tây Chiên' || item.name === 'Sinh Tố Bơ') {
      badge = 'MỚI';
    }

    let status = 'ĐANG BÁN';
    if (item.name === 'Burger Phô Mai Đôi' || item.name === 'Bánh Flan Trứng') {
      status = 'HẾT HÀNG';
    }

    // Gán ảnh chuẩn hoặc fallback
    const resolvedImage = item.image 
      ? (item.image.startsWith('data:image') || item.image.startsWith('/images') ? item.image : `http://localhost:5000${item.image}`) 
      : defaultImages[item.category] || '/images/home/product-burger.png';

    return {
      ...item,
      badge,
      status,
      resolvedImage,
    };
  }).filter(item => {
    // 1. Tìm kiếm tên/mô tả
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    // 2. Lọc category checklist
    let matchCategory = false;
    if (selectedCatIds.includes('all')) {
      matchCategory = true;
    } else {
      const activeCats = categoriesUI.filter(ui => selectedCatIds.includes(ui.id));
      const allowedDbCats = activeCats.flatMap(ui => ui.dbCats || []);
      matchCategory = allowedDbCats.includes(item.category);
    }

    // 3. Lọc khoảng giá
    const parsedMin = parsePrice(minPriceInput);
    const parsedMax = parsePrice(maxPriceInput);
    const matchPrice = item.price >= parsedMin && (parsedMax === 0 || item.price <= parsedMax);

    // 4. Lọc trạng thái "Chỉ còn hàng"
    const matchAvailability = !onlyAvailable || item.status === 'ĐANG BÁN';

    return matchSearch && matchCategory && matchPrice && matchAvailability;
  });

  // Sắp xếp
  const sortedMenu = [...filteredMenu].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'popular') {
      const aVal = a.badge === 'PHỔ BIẾN' ? 1 : 0;
      const bVal = b.badge === 'PHỔ BIẾN' ? 1 : 0;
      return bVal - aVal;
    }
    return 0;
  });

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-10">
      <div className="max-w-[1240px] mx-auto px-5 flex flex-col md:flex-row gap-8">
        
        {/* ===================== SIDEBAR BỘ LỌC ===================== */}
        <aside className="w-full md:w-[260px] shrink-0">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-black text-gray-800 mb-6 border-b border-gray-100 pb-3 tracking-tight">
              Bộ lọc
            </h2>

            {/* Mục 1: DANH MỤC */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
                DANH MỤC
              </h3>
              <div className="flex flex-col gap-3.5">
                {categoriesUI.map(cat => {
                  const isChecked = selectedCatIds.includes(cat.id);
                  return (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="w-[18px] h-[18px] rounded border-gray-300 text-[#c0392b] focus:ring-[#c0392b] accent-[#c0392b] cursor-pointer"
                      />
                      <span className={`text-[14px] font-bold group-hover:text-[#c0392b] transition-colors ${isChecked ? 'text-gray-800' : 'text-gray-500'}`}>
                        {cat.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Mục 2: MỨC GIÁ */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
                MỨC GIÁ
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={minPriceInput}
                  onChange={(e) => handlePriceChange(e.target.value, true)}
                  className="w-full text-[13px] font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:border-[#c0392b] focus:bg-white transition-all text-center"
                  placeholder="Từ"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  type="text"
                  value={maxPriceInput}
                  onChange={(e) => handlePriceChange(e.target.value, false)}
                  className="w-full text-[13px] font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:border-[#c0392b] focus:bg-white transition-all text-center"
                  placeholder="Đến"
                />
              </div>
            </div>

            {/* Mục 3: TRẠNG THÁI */}
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
                TRẠNG THÁI
              </h3>
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="w-[18px] h-[18px] rounded border-gray-300 text-[#c0392b] focus:ring-[#c0392b] accent-[#c0392b] cursor-pointer"
                />
                <span className={`text-[14px] font-bold group-hover:text-[#c0392b] transition-colors ${onlyAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
                  Chỉ còn hàng
                </span>
              </label>
            </div>

          </div>
        </aside>

        {/* ===================== KHU VỰC THỰC ĐƠN ===================== */}
        <main className="flex-1">
          
          {/* THANH TOP BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm món ăn ngon..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-full shadow-sm outline-none text-[14px] font-semibold text-gray-700 focus:border-[#c0392b] focus:shadow-md transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 shrink-0 justify-end">
              <span className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider">
                Sắp xếp theo:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-100 rounded-2xl px-4 py-2.5 pr-10 text-[14px] font-bold text-gray-700 outline-none shadow-sm focus:border-[#c0392b] transition-all cursor-pointer select-none"
                >
                  <option value="popular">Phổ biến</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* GRID DANH SÁCH MÓN */}
          {sortedMenu.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
              <span className="text-5xl block mb-4">🍔</span>
              <h3 className="text-[18px] font-black text-gray-800 mb-1">Không tìm thấy món ăn nào</h3>
              <p className="text-gray-400 text-sm">Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMenu.map(item => {
                const isOutOfStock = item.status === 'HẾT HÀNG';
                
                return (
                  <div 
                    key={item._id} 
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                  >
                    {/* KHU VỰC ẢNH */}
                    <div className="h-[200px] overflow-hidden relative bg-gray-50 shrink-0">
                      <img
                        src={item.resolvedImage}
                        alt={item.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale blur-[1px] opacity-60' : ''}`}
                      />
                      
                      {/* Badge Top Left */}
                      {item.badge && !isOutOfStock && (
                        <span className={`absolute top-3 left-3 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm text-white ${
                          item.badge === 'PHỔ BIẾN' ? 'bg-[#c0392b]' :
                          item.badge === 'CAY' ? 'bg-[#e67e22]' : 'bg-[#2980b9]'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Phủ Hết Hàng */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[0.5px]">
                          <span className="bg-white/95 text-gray-800 text-[11px] font-black uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider">
                            Hết hàng
                          </span>
                        </div>
                      )}
                    </div>

                    {/* KHU VỰC THÔNG TIN */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-[16px] font-extrabold text-gray-800 leading-snug line-clamp-2 pr-1">
                            {item.name}
                          </h3>
                          <span className="text-[#c0392b] font-black text-[17px] shrink-0">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 h-8">
                          {item.description}
                        </p>
                      </div>

                      {/* NÚT THAO TÁC */}
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full mt-4 py-3 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center text-sm font-extrabold cursor-not-allowed border border-gray-200"
                        >
                          Ngừng bán
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-full mt-4 py-3 bg-[#c0392b] text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-extrabold hover:bg-[#a93226] transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Thêm vào giỏ hàng
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
          
        </main>

      </div>

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">
            ✓
          </div>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
};

export default MenuPage;