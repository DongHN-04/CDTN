import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

const formatPrice = (val) => val.toLocaleString('vi-VN') + ' VNĐ';

const ProductDetailModal = ({ product, isOpen, onClose, showToast }) => {
  const [quantity, setQuantity] = useState(1);
  const { addItem, addCombo } = useCart();

  useEffect(() => {
    if (isOpen) {
      setQuantity(1); // Reset số lượng khi mở modal mới
      document.body.style.overflow = 'hidden'; // Ngăn cuộn trang bên dưới
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (product.type === 'combo') {
      addCombo(product, quantity);
    } else {
      addItem(product, quantity);
    }
    if (showToast) {
      showToast(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng!`, 'success');
    }
    onClose();
  };

  const isOutOfStock = product.status === 'HẾT HÀNG' || product.isOutOfStock;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Nội Dung */}
      <div className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">

        {/* Nút Đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur text-gray-500 hover:text-[#c0392b] hover:bg-red-50 p-2.5 rounded-full transition-colors border border-gray-100 shadow-sm cursor-pointer"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        {/* Cột Trái: Ảnh */}
        <div className="w-full md:w-1/2 bg-gray-50/80 relative shrink-0 flex items-center justify-center overflow-hidden border-r border-gray-100">
          <div className="h-[280px] md:h-[500px] w-full p-8 flex items-center justify-center relative">
            {/* Vòng sáng trang trí sau ảnh */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl z-0 pointer-events-none" />
            <img
              src={product.resolvedImage}
              alt={product.name}
              className={`w-full h-full object-contain drop-shadow-2xl relative z-10 transition-transform duration-500 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            />
          </div>

          {/* Badge */}
          {product.badge && !isOutOfStock && (
            <span className={`absolute top-6 left-6 text-[12px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-md text-white z-10 ${product.badge === 'PHỔ BIẾN' ? 'bg-[#c0392b]' :
              product.badge === 'CAY' ? 'bg-[#e67e22]' : 'bg-[#2980b9]'
              }`}>
              {product.badge}
            </span>
          )}

          {/* Lớp phủ Hết Hàng */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
              <span className="bg-white text-gray-800 text-[15px] font-black uppercase px-8 py-2.5 rounded-full shadow-xl tracking-widest border border-gray-100">
                Tạm Hết Hàng
              </span>
            </div>
          )}
        </div>

        {/* Cột Phải: Thông tin chi tiết */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto bg-white">
          <div className="flex-1">
            {/* Phân loại */}
            <span className="inline-block text-[#c0392b] text-[11px] font-black tracking-[0.2em] uppercase mb-3 bg-red-50 px-3 py-1 rounded-full">
              {product.category}
            </span>

            {/* Tên SP */}
            <h2 className="text-3xl font-black text-gray-800 mb-4 leading-tight tracking-tight">
              {product.name}
            </h2>

            {/* Giá */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-[#c0392b] text-4xl font-black tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.type === 'combo' && (() => {
                const totalItemsPrice = (product.items || []).reduce((sum, subItem) => {
                  const price = subItem.menuItem?.price || 0;
                  return sum + price * (subItem.quantity || 1);
                }, 0);
                return totalItemsPrice > product.price ? (
                  <span className="text-gray-400 font-bold line-through mb-1.5 text-lg">
                    {formatPrice(totalItemsPrice)}
                  </span>
                ) : null;
              })()}
            </div>

            {/* Mô tả */}
            <div className="text-gray-500 text-[15px] leading-relaxed mb-8 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              {product.description ? (
                <p className="m-0 whitespace-pre-line">{product.description}</p>
              ) : (
                <p className="m-0 italic text-gray-400">Hương vị tuyệt hảo đang chờ bạn khám phá.</p>
              )}
            </div>

            {/* Thành phần Combo */}
            {product.type === 'combo' && product.items && product.items.length > 0 && (
              <div className="mb-8">
                <h4 className="text-[12px] font-black text-gray-400 mb-3 uppercase tracking-widest border-b border-gray-100 pb-2">
                  Combo Bao Gồm
                </h4>
                <ul className="grid grid-cols-1 gap-2.5">
                  {product.items.map(subItem => (
                    <li key={subItem._id || `${subItem.menuItem?._id || subItem.menuItem}-${subItem.quantity}`} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#c0392b] font-black text-sm border border-red-100/50">
                        {subItem.quantity}x
                      </div>
                      <span className="text-[14px] font-bold text-gray-700 flex-1">{subItem.menuItem?.name || subItem.name || 'Món ăn'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Khu vực Action */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center shrink-0">
            {/* Bộ đếm Số lượng */}
            <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 p-1 w-full sm:w-auto shrink-0 h-[60px]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-14 h-full flex items-center justify-center text-gray-500 hover:text-[#c0392b] hover:bg-white rounded-[14px] transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                disabled={isOutOfStock || quantity <= 1}
              >
                <Minus size={22} strokeWidth={3} />
              </button>
              <span className="w-12 text-center font-black text-xl text-gray-800">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-14 h-full flex items-center justify-center text-gray-500 hover:text-[#c0392b] hover:bg-white rounded-[14px] transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                disabled={isOutOfStock}
              >
                <Plus size={22} strokeWidth={3} />
              </button>
            </div>

            {/* Nút Thêm vào Giỏ */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 w-full h-[60px] bg-[#c0392b] text-white rounded-2xl flex items-center justify-center gap-3 font-extrabold text-[16px] hover:bg-[#a93226] transition-all shadow-[0_8px_20px_rgba(192,57,43,0.25)] hover:shadow-[0_12px_25px_rgba(192,57,43,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed border-none cursor-pointer whitespace-nowrap px-4"
            >
              {isOutOfStock ? (
                'Tạm Hết Hàng'
              ) : (
                <>
                  <ShoppingCart size={22} strokeWidth={2.5} />
                  Thêm vào giỏ hàng
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
