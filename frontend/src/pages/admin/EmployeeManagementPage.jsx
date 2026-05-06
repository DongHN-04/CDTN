import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

const EmployeeManagementPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  
  // State quản lý form
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', 
    role: 'Nhân viên phục vụ',
    phone: '',
    salary: ''
  });

  // State quản lý Hộp thoại Xác nhận Xóa (Message Box)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    employeeId: null
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setEmployees(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách nhân viên');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Hàm mở hộp thoại xác nhận xóa
  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, employeeId: id });
  };

  // Hàm đóng hộp thoại xóa
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, employeeId: null });
  };

  // Hàm thực thi việc xóa sau khi đã xác nhận
  const confirmDelete = async () => {
    try {
      await userService.deleteUser(deleteModal.employeeId);
      setEmployees(employees.filter(emp => emp._id !== deleteModal.employeeId));
      closeDeleteModal(); // Xóa xong thì đóng form
    } catch (err) {
      alert('Xóa thất bại');
      closeDeleteModal();
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'Nhân viên phục vụ', phone: '', salary: '' });
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingId(user._id);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', 
      role: user.role || 'Nhân viên phục vụ', 
      phone: user.phone || '', 
      salary: user.salary || '' 
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        const updated = await userService.updateUser(editingId, updateData);
        setEmployees(employees.map(emp => (emp._id === updated._id ? updated : emp)));
      } else {
        const newUser = await userService.createUser(formData);
        setEmployees([newUser, ...employees]);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'NV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="font-sans text-gray-800 pb-20 relative">
      
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ Nhân viên</h1>
        </div>
        <div className="bg-red-50 text-[#c0392b] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-red-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {employees.length} Nhân viên đang làm việc
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-semibold border-l-4 border-red-500">{error}</div>}

      {/* ===== FORM NHẬP LIỆU ===== */}
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 transition-all">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Họ và tên</label>
                  <div className="flex items-center border-b border-gray-300 py-2">
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Nhập tên nhân viên" className="w-full bg-transparent outline-none text-sm font-semibold" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tên đăng nhập</label>
                  <div className="flex items-center border-b border-gray-300 py-2">
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="email@sondong.com" className="w-full bg-transparent outline-none text-sm font-semibold" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mật khẩu</label>
                  <div className="flex items-center border-b border-gray-300 py-2">
                    <input 
                      type="password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      placeholder={editingId ? "Bỏ trống nếu không đổi mật khẩu" : "Nhập mật khẩu cho tài khoản"} 
                      required={!editingId} 
                      className="w-full bg-transparent outline-none text-sm font-semibold placeholder:font-normal placeholder:text-gray-400" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Chức vụ</label>
                  <div className="flex items-center border-b border-gray-300 py-2">
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-transparent outline-none text-sm font-semibold text-gray-800 cursor-pointer">
                      <option value="Nhân viên phục vụ">Nhân viên phục vụ</option>
                      <option value="Thu ngân">Thu ngân</option>
                      <option value="Đầu bếp">Đầu bếp</option>
                      <option value="Quản lý ca">Quản lý ca</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Số điện thoại</label>
                  <div className="flex items-center border-b border-gray-300 py-2">
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="090x xxx xxx" className="w-full bg-transparent outline-none text-sm font-semibold" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mức lương (VNĐ)</label>
                  <div className="flex items-center border-b border-gray-300 py-2">
                    <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} placeholder="Ví dụ: 7500000" className="w-full bg-transparent outline-none text-sm font-semibold text-[#c0392b]" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-[#c0392b] hover:bg-red-800 transition-colors shadow-md shadow-red-200">
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1 bg-[#c0392b] rounded-xl text-white p-8 relative overflow-hidden shadow-md">
            <div className="bg-white/20 w-max px-3 py-1 rounded-full text-[10px] font-bold tracking-widest mb-4 backdrop-blur-sm">
              SƠN ĐÔNG EXCELLENCE
            </div>
            <h3 className="text-2xl font-bold mb-4 leading-tight">Thông tin nhân viên chính thức</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              Đảm bảo thông tin được cập nhật chính xác để đồng bộ với hệ thống kế toán và bảo hiểm xã hội. Mật khẩu cần được bảo mật.
            </p>
          </div>
        </div>
      )}

      {/* ===== TOOLBAR & BẢNG DỮ LIỆU ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap justify-between items-center p-4 bg-gray-50/50 border-b border-gray-100 gap-4">
          <div className="flex gap-2">
            <button onClick={handleAddNew} className="bg-[#c0392b] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-2 hover:bg-red-800 transition-colors shadow-sm shadow-red-200">
              <span className="text-lg leading-none mb-0.5">+</span> Thêm
            </button>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Tìm kiếm theo tên..." className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#c0392b] transition-colors" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Chức vụ / Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Điện thoại</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mức lương</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Đang tải dữ liệu...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Chưa có nhân viên nào trên hệ thống.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors border-l-4 border-l-transparent">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                          {getInitials(emp.name)}
                        </div>
                        <span className="font-semibold text-gray-800">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider bg-blue-100 text-[#005f7b] uppercase">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{emp.phone || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {emp.salary ? Number(emp.salary).toLocaleString('vi-VN') + ' đ' : '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button onClick={() => handleEdit(emp)} className="text-gray-400 hover:text-[#005f7b] transition-colors text-xs font-bold uppercase tracking-wider">
                        Sửa
                      </button>
                      <button onClick={() => handleDeleteClick(emp._id)} className="text-gray-400 hover:text-[#c0392b] transition-colors text-xs font-bold uppercase tracking-wider">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MESSAGE BOX XÁC NHẬN XÓA ===== */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-down">
            <div className="flex flex-col items-center text-center">
              {/* Icon Cảnh báo */}
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống không? Hành động này không thể hoàn tác.
              </p>
              
              {/* Nút bấm */}
              <div className="flex gap-3 w-full">
                <button onClick={closeDeleteModal} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Hủy bỏ
                </button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-200 hover:bg-red-700 transition-colors">
                  Xóa nhân viên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default EmployeeManagementPage;