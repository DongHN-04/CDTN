import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  Download, Upload, List, Edit3, Trash2, TrendingUp, 
  Utensils, FileDown, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

import menuService from '../../services/menuService';

const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Gà Rán',
    price: '',
    status: 'ĐANG BÁN'
  });

  // ====== STATE QUẢN LÝ POPUP THÔNG BÁO (TOAST) ======
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // ====== STATE QUẢN LÝ POPUP XÁC NHẬN XÓA ======
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  // ====== GỌI DỮ LIỆU TỪ MONGODB ======
  // Sử dụng useCallback để tránh cảnh báo missing dependency của useEffect
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const data = await menuService.getMenu();
      setMenuItems(data);
    } catch (error) {
      console.error("Lỗi tải thực đơn:", error);
      showToast('Không thể tải dữ liệu thực đơn từ server', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // ====== LƯU MÓN ĂN MỚI HOẶC CẬP NHẬT ======
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await menuService.updateMenu(editingId, formData);
        setMenuItems(menuItems.map(item => (item._id === updated._id ? updated : item)));
        setEditingId(null);
        showToast("Cập nhật món ăn thành công!");
      } else {
        const newItem = await menuService.createMenu(formData);
        setMenuItems([newItem, ...menuItems]);
        showToast("Thêm món ăn mới thành công!");
      }
      setFormData({ name: '', category: 'Gà Rán', price: '', status: 'ĐANG BÁN' });
    } catch (error) {
      showToast(error.response?.data?.message || 'Lỗi khi lưu món ăn', 'error');
    }
  };

  // ====== XÓA MÓN ĂN ======
  const confirmDelete = async () => {
    try {
      await menuService.deleteMenu(deleteModal.id);
      setMenuItems(menuItems.filter(item => item._id !== deleteModal.id));
      showToast("Đã xóa món ăn khỏi thực đơn!");
      setDeleteModal({ show: false, id: null });
    } catch (error) {
      showToast('Xóa thất bại', 'error');
      setDeleteModal({ show: false, id: null });
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      status: item.status
    });
  };

  const handleResetForm = (e) => {
    e.preventDefault();
    setEditingId(null);
    setFormData({ name: '', category: 'Gà Rán', price: '', status: 'ĐANG BÁN' });
  };

  // ====== TẢI FILE EXCEL MẪU ======
  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Tên Món Ăn': 'Gà Rán Giòn Cay (Mẫu)', 'Danh Mục': 'Gà Rán', 'Giá Bán (VNĐ)': 45000, 'Trạng Thái': 'ĐANG BÁN' },
      { 'Tên Món Ăn': 'Pepsi Lớn (Mẫu)', 'Danh Mục': 'Đồ uống', 'Giá Bán (VNĐ)': 20000, 'Trạng Thái': 'ĐANG BÁN' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thực Đơn Mẫu");
    XLSX.writeFile(workbook, "File_Mau_Nhap_Thuc_Don.xlsx");
    showToast("Đã tải file mẫu thành công!");
  };

  // ====== XỬ LÝ XUẤT EXCEL ======
  const handleExportExcel = () => {
    const dataToExport = menuItems.map(item => ({
      'Mã Món': item._id,
      'Tên Món Ăn': item.name,
      'Danh Mục': item.category,
      'Giá Bán (VNĐ)': item.price,
      'Trạng Thái': item.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thực Đơn");
    XLSX.writeFile(workbook, "Danh_Sach_Thuc_Don.xlsx");
    showToast("Đã xuất báo cáo Excel thành công!");
  };

  // ====== XỬ LÝ NHẬP EXCEL ======
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const importedData = XLSX.utils.sheet_to_json(worksheet);
        
        let successCount = 0;
        for (const item of importedData) {
            const newItemData = {
              name: item['Tên Món Ăn'] || 'Chưa có tên',
              category: item['Danh Mục'] || 'Khác',
              price: item['Giá Bán (VNĐ)'] || 0,
              status: item['Trạng Thái'] || 'TẠM NGƯNG'
            };
            await menuService.createMenu(newItemData);
            successCount++;
        }
        
        showToast(`Đã nhập thành công ${successCount} món ăn từ Excel!`);
        fetchMenu(); 
      } catch (error) {
        showToast("Lỗi khi nhập dữ liệu Excel. Vui lòng kiểm tra file.", "error");
      }
      e.target.value = null;
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="font-sans text-gray-800 relative pb-10">
      
      {/* ===== POPUP THÔNG BÁO (TOAST) ===== */}
      <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0'}`}>
        <div className={`bg-white border-l-4 shadow-xl rounded-lg p-4 flex items-center gap-3 min-w-[280px] ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-green-500" size={24} />
          ) : (
            <XCircle className="text-red-500" size={24} />
          )}
          <div>
            <h4 className="text-sm font-bold text-gray-900 m-0">{toast.type === 'success' ? 'Thành công' : 'Thất bại'}</h4>
            <p className="text-xs text-gray-500 m-0 mt-0.5">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* ===== POPUP XÁC NHẬN XÓA (MODAL) ===== */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa?</h3>
              <p className="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn xóa món ăn này khỏi thực đơn không? Hành động này không thể hoàn tác.</p>
              
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteModal({ show: false, id: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Hủy bỏ
                </button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-200 hover:bg-red-700 transition-colors">
                  Xóa món
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Quản lý Thực đơn</h1>
          <p className="text-sm text-gray-500 m-0">Cập nhật và điều chỉnh danh sách món ăn trong hệ thống</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm">
            <FileDown size={16} /> File mẫu
          </button>

          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm">
            <Upload size={16} /> Nhập Excel
          </button>

          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors shadow-sm">
            <Download size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ===== CỘT TRÁI: FORM & STATS ===== */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <List size={20} className="text-[#c0392b]" />
              <h3 className="text-lg font-bold text-gray-900 m-0">{editingId ? 'Cập nhật món ăn' : 'Chi tiết món ăn'}</h3>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tên món ăn</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="border-b border-gray-300 py-2 outline-none text-sm font-semibold focus:border-[#c0392b] transition-colors" placeholder="Ví dụ: Gà Rán Giòn Cay" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Danh mục</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="border-b border-gray-300 py-2 outline-none text-sm font-semibold text-gray-800 cursor-pointer focus:border-[#c0392b] transition-colors appearance-none bg-transparent">
                  <option value="Gà Rán">Gà Rán</option>
                  <option value="Burger">Burger</option>
                  <option value="Đồ uống">Đồ uống</option>
                  <option value="Món phụ">Món phụ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Giá (VNĐ)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required className="border-b border-gray-300 py-2 outline-none text-sm font-semibold focus:border-[#c0392b] transition-colors" placeholder="Ví dụ: 45000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Trạng thái</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="border-b border-gray-300 py-2 outline-none text-sm font-semibold text-gray-800 cursor-pointer focus:border-[#c0392b] transition-colors appearance-none bg-transparent">
                    <option value="ĐANG BÁN">Đang bán</option>
                    <option value="TẠM NGƯNG">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handleResetForm} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Làm mới</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-[#c0392b] hover:bg-red-800 transition-colors shadow-sm shadow-red-200">
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[#fdf0f0] rounded-xl p-6 relative overflow-hidden border border-red-50">
            <div className="relative z-10">
              <h4 className="text-[#c0392b] font-bold text-xs uppercase tracking-wider mb-2">Tổng số món ăn</h4>
              <div className="text-4xl font-black text-gray-900 mb-2">{menuItems.length}</div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c0392b]">
                <TrendingUp size={14} /><span>Trạng thái hoạt động tốt</span>
              </div>
            </div>
            <Utensils size={100} className="absolute -bottom-4 -right-4 text-[#c0392b] opacity-10 rotate-12" />
          </div>
        </div>

        {/* ===== CỘT PHẢI: BẢNG DỮ LIỆU ===== */}
        <div className="xl:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-base font-bold text-gray-900 m-0">Danh sách thực đơn</h3>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mã món</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tên món ăn</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Danh mục</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Giá bán</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Đang tải dữ liệu...</td></tr>
                ) : menuItems.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Chưa có món ăn nào trong thực đơn.</td></tr>
                ) : (
                  menuItems.map((item) => (
                    <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 text-xs text-gray-400 font-mono font-medium">
                        {item._id.substring(item._id.length - 6).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 font-medium">{item.category}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#c0392b]">
                        {Number(item.price).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${item.status === 'ĐANG BÁN' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleEditClick(item)} className="text-gray-400 hover:text-blue-600 transition-colors bg-blue-50/50 p-2 rounded-lg hover:bg-blue-100">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => setDeleteModal({ show: true, id: item._id })} className="text-gray-400 hover:text-red-600 transition-colors bg-red-50/50 p-2 rounded-lg hover:bg-red-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagementPage;