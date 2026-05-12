// import React, { useState, useEffect, useRef } from 'react';
// import * as XLSX from 'xlsx';
// import { 
//   Download, Upload, List, 
//   Edit3, Trash2, TrendingUp, Utensils 
// } from 'lucide-react';

// // Nhúng service gọi API
// import menuService from '../../services/menuService';

// const MenuManagementPage = () => {
//   // State chứa dữ liệu thật từ DB
//   const [menuItems, setMenuItems] = useState([]);
//   const [loading, setLoading] = useState(true);
  
//   const fileInputRef = useRef(null);
//   const [editingId, setEditingId] = useState(null);

//   const [formData, setFormData] = useState({
//     name: '',
//     category: 'Gà Rán',
//     price: '',
//     status: 'ĐANG BÁN'
//   });

//   // ====== GỌI DỮ LIỆU TỪ MONGODB ======
//   const fetchMenu = async () => {
//     try {
//       setLoading(true);
//       const data = await menuService.getMenu();
//       setMenuItems(data);
//     } catch (error) {
//       console.error("Lỗi tải thực đơn:", error);
//       alert('Không thể tải dữ liệu thực đơn từ server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Chạy ngay khi mở trang
//   useEffect(() => {
//     fetchMenu();
//   }, []);

//   // ====== LƯU MÓN ĂN MỚI HOẶC CẬP NHẬT ======
//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (editingId) {
//         const updated = await menuService.updateMenu(editingId, formData);
//         setMenuItems(menuItems.map(item => (item._id === updated._id ? updated : item)));
//         setEditingId(null);
//       } else {
//         const newItem = await menuService.createMenu(formData);
//         setMenuItems([newItem, ...menuItems]);
//       }
      
//       // Reset form
//       setFormData({ name: '', category: 'Gà Rán', price: '', status: 'ĐANG BÁN' });
//       alert("Lưu món ăn thành công!");
//     } catch (error) {
//       alert(error.response?.data?.message || 'Lỗi khi lưu món ăn');
//     }
//   };

//   // ====== XÓA MÓN ĂN ======
//   const handleDelete = async (id) => {
//     if (window.confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) {
//       try {
//         await menuService.deleteMenu(id);
//         setMenuItems(menuItems.filter(item => item._id !== id));
//       } catch (error) {
//         alert('Xóa thất bại');
//       }
//     }
//   };

//   // Bấm sửa món
//   const handleEditClick = (item) => {
//     setEditingId(item._id);
//     setFormData({
//       name: item.name,
//       category: item.category,
//       price: item.price,
//       status: item.status
//     });
//   };

//   // Nút Làm mới form
//   const handleResetForm = (e) => {
//     e.preventDefault();
//     setEditingId(null);
//     setFormData({ name: '', category: 'Gà Rán', price: '', status: 'ĐANG BÁN' });
//   };

//   // ====== XỬ LÝ XUẤT EXCEL ======
//   const handleExportExcel = () => {
//     const dataToExport = menuItems.map(item => ({
//       'Mã Món': item._id,
//       'Tên Món Ăn': item.name,
//       'Danh Mục': item.category,
//       'Giá Bán (VNĐ)': item.price,
//       'Trạng Thái': item.status
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Thực Đơn");
//     XLSX.writeFile(workbook, "Danh_Sach_Thuc_Don.xlsx");
//   };

//   // ====== XỬ LÝ NHẬP EXCEL ======
//   const handleImportExcel = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = async (event) => {
//       try {
//         const data = new Uint8Array(event.target.result);
//         const workbook = XLSX.read(data, { type: 'array' });
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
        
//         const importedData = XLSX.utils.sheet_to_json(worksheet);
        
//         // Push từng dòng excel lên DB
//         let successCount = 0;
//         for (const item of importedData) {
//             const newItemData = {
//               name: item['Tên Món Ăn'] || 'Chưa có tên',
//               category: item['Danh Mục'] || 'Khác',
//               price: item['Giá Bán (VNĐ)'] || 0,
//               status: item['Trạng Thái'] || 'TẠM NGƯNG'
//             };
//             await menuService.createMenu(newItemData);
//             successCount++;
//         }
        
//         alert(`Đã nhập thành công ${successCount} món ăn từ Excel lên Database!`);
//         fetchMenu(); // Gọi lại API để load dữ liệu mới nhất
//       } catch (error) {
//         alert("Lỗi khi nhập dữ liệu Excel. Vui lòng kiểm tra định dạng file.");
//         console.error(error);
//       }
      
//       e.target.value = null;
//     };
//     reader.readAsArrayBuffer(file);
//   };

//   return (
//     <div className="font-sans text-gray-800">
      
//       {/* ===== HEADER ===== */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-1">Quản lý Thực đơn</h1>
//           <p className="text-sm text-gray-500 m-0">Cập nhật và điều chỉnh danh sách món ăn trong hệ thống</p>
//         </div>
        
//         <div className="flex items-center gap-3">
//           <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          
//           <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200">
//             <Upload size={16} /> Nhập Excel
//           </button>

//           <button onClick={handleExportExcel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
//             <Download size={16} /> Xuất báo cáo
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
//         {/* ===== CỘT TRÁI: FORM & STATS ===== */}
//         <div className="xl:col-span-4 flex flex-col gap-6">
          
//           {/* Card Form */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//             <div className="flex items-center gap-2 mb-6">
//               <List size={20} className="text-[#c0392b]" />
//               <h3 className="text-lg font-bold text-gray-900 m-0">
//                 {editingId ? 'Cập nhật món ăn' : 'Chi tiết món ăn'}
//               </h3>
//             </div>

//             <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tên món ăn</label>
//                 <input 
//                   type="text" 
//                   value={formData.name}
//                   onChange={(e) => setFormData({...formData, name: e.target.value})}
//                   required
//                   className="border-b border-gray-300 py-2 outline-none text-sm font-semibold focus:border-[#c0392b] transition-colors"
//                 />
//               </div>

//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Danh mục</label>
//                 <select 
//                   value={formData.category}
//                   onChange={(e) => setFormData({...formData, category: e.target.value})}
//                   className="border-b border-gray-300 py-2 outline-none text-sm font-semibold text-gray-800 cursor-pointer focus:border-[#c0392b] transition-colors appearance-none bg-transparent"
//                 >
//                   <option value="Gà Rán">Gà Rán</option>
//                   <option value="Burger">Burger</option>
//                   <option value="Đồ uống">Đồ uống</option>
//                   <option value="Món phụ">Món phụ</option>
//                 </select>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Giá (VNĐ)</label>
//                   <input 
//                     type="number" 
//                     value={formData.price}
//                     onChange={(e) => setFormData({...formData, price: e.target.value})}
//                     required
//                     className="border-b border-gray-300 py-2 outline-none text-sm font-semibold focus:border-[#c0392b] transition-colors"
//                   />
//                 </div>
//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Trạng thái</label>
//                   <select 
//                     value={formData.status}
//                     onChange={(e) => setFormData({...formData, status: e.target.value})}
//                     className="border-b border-gray-300 py-2 outline-none text-sm font-semibold text-gray-800 cursor-pointer focus:border-[#c0392b] transition-colors appearance-none bg-transparent"
//                   >
//                     <option value="ĐANG BÁN">Đang bán</option>
//                     <option value="TẠM NGƯNG">Tạm ngưng</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex gap-3 mt-4">
//                 <button type="button" onClick={handleResetForm} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
//                   Làm mới
//                 </button>
//                 <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-[#c0392b] hover:bg-red-800 transition-colors shadow-sm">
//                   Lưu món ăn
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* Card Thống kê */}
//           <div className="bg-[#fdf0f0] rounded-xl p-6 relative overflow-hidden border border-red-50">
//             <div className="relative z-10">
//               <h4 className="text-[#c0392b] font-bold text-xs uppercase tracking-wider mb-2">Tổng số món ăn</h4>
//               <div className="text-4xl font-black text-gray-900 mb-2">{menuItems.length}</div>
//               <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c0392b]">
//                 <TrendingUp size={14} />
//                 <span>Trạng thái hoạt động tốt</span>
//               </div>
//             </div>
//             <Utensils size={100} className="absolute -bottom-4 -right-4 text-[#c0392b] opacity-10 rotate-12" />
//           </div>

//         </div>

//         {/* ===== CỘT PHẢI: BẢNG DỮ LIỆU ===== */}
//         <div className="xl:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          
//           <div className="p-5 flex justify-between items-center border-b border-gray-100">
//             <h3 className="text-base font-bold text-gray-900 m-0">Danh sách thực đơn</h3>
//           </div>

//           <div className="overflow-x-auto flex-1">
//             <table className="w-full text-left border-collapse min-w-[600px]">
//               <thead>
//                 <tr className="bg-gray-50/50">
//                   <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mã món</th>
//                   <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tên món ăn</th>
//                   <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Danh mục</th>
//                   <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Giá bán</th>
//                   <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
//                   <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr><td colSpan="6" className="text-center py-10 text-gray-500">Đang tải dữ liệu...</td></tr>
//                 ) : menuItems.length === 0 ? (
//                   <tr><td colSpan="6" className="text-center py-10 text-gray-500">Chưa có món ăn nào trong thực đơn.</td></tr>
//                 ) : (
//                   menuItems.map((item) => (
//                     <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
//                       <td className="px-5 py-4 text-xs text-gray-400 font-mono">
//                         {item._id.substring(item._id.length - 6).toUpperCase()}
//                       </td>
//                       <td className="px-5 py-4">
//                         <span className="font-bold text-gray-800 text-sm">{item.name}</span>
//                       </td>
//                       <td className="px-5 py-4 text-sm text-gray-600">{item.category}</td>
//                       <td className="px-5 py-4 text-sm font-bold text-[#c0392b]">
//                         {Number(item.price).toLocaleString('vi-VN')}đ
//                       </td>
//                       <td className="px-5 py-4">
//                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase
//                           ${item.status === 'ĐANG BÁN' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
//                         >
//                           {item.status}
//                         </span>
//                       </td>
//                       <td className="px-5 py-4 text-right">
//                         <div className="flex justify-end gap-3">
//                           <button onClick={() => handleEditClick(item)} className="text-[#3b82f6] hover:text-blue-800 transition-colors">
//                             <Edit3 size={16} />
//                           </button>
//                           <button onClick={() => handleDelete(item._id)} className="text-[#ef4444] hover:text-red-800 transition-colors">
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MenuManagementPage;

import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import publicService from '../../services/publicService';
import { useLocation } from 'react-router-dom';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();
  const location = useLocation();

  useEffect(() => {
    publicService.getMenu().then(data => {
      setMenuItems(data);
      const cats = ['Tất cả', ...new Set(data.map(item => item.category))];
      setCategories(cats);
    });
  }, []);

  // Nếu URL có category, lọc sẵn
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setSelectedCategory(cat);
  }, [location]);

  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Thực Đơn</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Tìm món..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {filteredMenu.map(item => (
          <div key={item._id} style={{
            background: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }} onClick={() => addItem(item, 1)}>
            <img
              src={item.image ? (item.image.startsWith('data:image') ? item.image : `http://localhost:5000${item.image}`) : 'https://via.placeholder.com/300x200?text=No+Image'}
              alt={item.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 10px' }}>{item.name}</h3>
              <p style={{ color: '#666', margin: '0 0 10px' }}>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {item.price.toLocaleString()}₫
                </span>
                <button style={{
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>+ Thêm</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;