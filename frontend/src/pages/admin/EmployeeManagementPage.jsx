import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import userService from '../../services/userService';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { useToast } from '../../contexts/ToastContext';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'Nhân viên',
  phone: '',
  salary: '',
  status: 'Đang làm việc',
};

const positions = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'Nhân viên', label: 'Nhân viên' },
];

const statusOptions = ['Đang làm việc', 'Đang nghỉ phép', 'Đã nghỉ việc'];
const pageSize = 5;

const getPosition = (employee) => {
  if (employee.role === 'admin') return 'Quản trị viên';
  return 'Nhân viên';
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (name || 'NV').slice(0, 2).toUpperCase();
};

const EmployeeManagementPage = () => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, employee: null });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getUsers();
      setEmployees(data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách nhân viên';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const enrichedEmployees = useMemo(() => (
    employees.map(employee => ({
      ...employee,
      positionLabel: getPosition(employee),
      status: employee.status || 'Đang làm việc',
    }))
  ), [employees]);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return enrichedEmployees.filter(employee => {
      const matchesSearch = !keyword || [
        employee.name,
        employee.email,
        employee.phone,
        employee.positionLabel,
      ].filter(Boolean).join(' ').toLowerCase().includes(keyword);

      const matchesPosition = positionFilter === 'all' || employee.positionLabel === positionFilter;
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [enrichedEmployees, search, positionFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, positionFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => ({
    total: employees.length,
    working: enrichedEmployees.filter(employee => employee.status === 'Đang làm việc').length,
    leave: enrichedEmployees.filter(employee => employee.status === 'Đang nghỉ phép').length,
    resigned: enrichedEmployees.filter(employee => employee.status === 'Đã nghỉ việc').length,
  }), [employees.length, enrichedEmployees]);

  const openCreate = () => {
    setEditingEmployee(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      password: '',
      role: employee.role === 'admin' ? 'admin' : 'Nhân viên',
      phone: employee.phone || '',
      salary: employee.salary || '',
      status: employee.status || 'Đang làm việc',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Tên và email là bắt buộc');
      showToast('Tên và email là bắt buộc', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Email không hợp lệ');
      showToast('Email không hợp lệ', 'error');
      return;
    }
    if (formData.phone.trim() && !/^(0|\+84)[0-9]{9,10}$/.test(formData.phone.trim().replace(/\s/g, ''))) {
      setError('Số điện thoại không hợp lệ');
      showToast('Số điện thoại không hợp lệ', 'error');
      return;
    }
    if (formData.salary !== '' && (Number(formData.salary) < 0 || Number(formData.salary) > 100000000)) {
      setError('Lương phải từ 0 đến 100.000.000');
      showToast('Lương phải từ 0 đến 100.000.000', 'error');
      return;
    }

    if (!editingEmployee && formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        salary: formData.salary === '' ? 0 : Number(formData.salary),
      };
      if (editingEmployee && !payload.password) delete payload.password;

      if (editingEmployee) {
        const updated = await userService.updateUser(editingEmployee._id, payload);
        setEmployees(current => current.map(employee => employee._id === updated._id ? updated : employee));
      } else {
        const created = await userService.createUser(payload);
        setEmployees(current => [created, ...current]);
      }
      showToast(editingEmployee ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên');
      closeForm();
    } catch (err) {
      const details = err.response?.data?.details;
      const message = details?.[0]?.message || err.response?.data?.message || 'Không thể lưu thông tin nhân viên';
      setError(message);
      showToast(message, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.employee) return;

    try {
      await userService.deleteUser(deleteModal.employee._id);
      setEmployees(current => current.filter(employee => employee._id !== deleteModal.employee._id));
      setDeleteModal({ isOpen: false, employee: null });
      showToast('Đã xóa nhân viên');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể xóa nhân viên';
      setError(message);
      showToast(message, 'error');
      setDeleteModal({ isOpen: false, employee: null });
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Quản lý nhân sự</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Quản lý đội ngũ nhân viên, mức lương và trạng thái làm việc.</p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c20d1e] px-6 text-sm font-black text-white shadow-sm hover:bg-[#a80b19]"
        >
          <PlusCircle size={17} />
          Thêm nhân viên
        </button>
      </div>


      <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng nhân sự" value={stats.total} icon="♟" tone="bg-red-50 text-[#c70d1a]" />
        <StatCard title="Đang làm việc" value={stats.working} icon="▣" tone="bg-sky-50 text-sky-700" />
        <StatCard title="Đang nghỉ phép" value={stats.leave} icon="▤" tone="bg-gray-100 text-gray-600" />
        <StatCard title="Đã nghỉ việc" value={stats.resigned} icon="⌧" tone="bg-red-50 text-red-500" />
      </div>

      <div className="mb-7 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm nhân viên theo tên, email..."
              className="w-full rounded-xl border border-red-100 bg-white py-3 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#c70d1a] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={positionFilter} onChange={event => setPositionFilter(event.target.value)} className={selectClass}>
              <option value="all">Chức vụ</option>
              <option value="Quản trị viên">Quản trị viên</option>
              <option value="Nhân viên">Nhân viên</option>
            </select>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className={selectClass}>
              <option value="all">Trạng thái</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-[#fbf8f7] text-left text-[11px] font-black uppercase tracking-widest text-red-950">
              <th className="px-5 py-4">Nhân viên</th>
              <th className="px-5 py-4">Chức vụ</th>
              <th className="px-5 py-4">Số điện thoại</th>
              <th className="px-5 py-4">Mức lương</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-sm font-bold text-gray-500">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-sm font-bold text-gray-500">Không có nhân viên phù hợp.</td>
              </tr>
            ) : (
              paginatedEmployees.map(employee => (
                <EmployeeRow
                  key={employee._id}
                  employee={employee}
                  onEdit={() => openEdit(employee)}
                  onDelete={() => setDeleteModal({ isOpen: true, employee })}
                />
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-gray-50 px-5 py-4 text-xs font-bold text-gray-500">
          <span>
            Hiển thị {filteredEmployees.length ? (currentPage - 1) * pageSize + 1 : 0}
            -{Math.min(currentPage * pageSize, filteredEmployees.length)} trong số {filteredEmployees.length} nhân viên
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentPage === page ? 'bg-[#c70d1a] font-black text-white' : 'border border-gray-100 text-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <EmployeeFormModal
          formData={formData}
          setFormData={setFormData}
          editingEmployee={editingEmployee}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {deleteModal.isOpen && (
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Xóa nhân viên?"
          message={`Bạn có chắc chắn muốn xóa ${deleteModal.employee?.name || 'nhân viên này'} khỏi hệ thống không?`}
          onCancel={() => setDeleteModal({ isOpen: false, employee: null })}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, tone }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
    <div className="flex items-center gap-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-black ${tone}`}>{icon}</div>
      <div>
        <div className="text-[11px] font-black uppercase tracking-widest text-red-950">{title}</div>
        <div className="mt-1 text-2xl font-black text-gray-950">{value}</div>
      </div>
    </div>
  </div>
);

const EmployeeRow = ({ employee, onEdit, onDelete }) => {
  const statusClass = employee.status === 'Đang làm việc'
    ? 'bg-emerald-50 text-emerald-700'
    : employee.status === 'Đang nghỉ phép'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-gray-100 text-gray-600';

  return (
    <tr className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/70">
      <td className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs font-black text-gray-700">
            {getInitials(employee.name)}
          </div>
          <div>
            <div className="font-black text-gray-950">{employee.name}</div>
            <div className="text-xs font-semibold text-gray-500">{employee.email}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-5 font-bold">{employee.positionLabel}</td>
      <td className="px-5 py-5 font-semibold text-gray-700">{employee.phone || '-'}</td>
      <td className="px-5 py-5 font-black text-[#c70d1a]">{formatCurrency(employee.salary)}</td>
      <td className="px-5 py-5">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{employee.status}</span>
      </td>
      <td className="px-5 py-5">
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-700">Sửa</button>
          <button onClick={onDelete} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600">Xóa</button>
        </div>
      </td>
    </tr>
  );
};

const EmployeeFormModal = ({ formData, setFormData, editingEmployee, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-xl font-black text-gray-950">{editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">Cập nhật thông tin đăng nhập và hồ sơ nhân sự.</p>
        </div>
        <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">Đóng</button>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Họ và tên">
          <input value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Email đăng nhập">
          <input type="email" value={formData.email} onChange={event => setFormData({ ...formData, email: event.target.value })} className={inputClass} />
        </Field>
        <Field label={editingEmployee ? 'Mật khẩu mới' : 'Mật khẩu'}>
          <input
            type="password"
            value={formData.password}
            onChange={event => setFormData({ ...formData, password: event.target.value })}
            placeholder={editingEmployee ? 'Bỏ trống nếu không đổi' : 'Tối thiểu 6 ký tự'}
            autoComplete="new-password"
            className={inputClass}
            required={!editingEmployee}
          />
        </Field>
        <Field label="Chức vụ">
          <select value={formData.role} onChange={event => setFormData({ ...formData, role: event.target.value })} className={inputClass}>
            {positions.map(position => (
              <option key={position.value} value={position.value}>{position.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Số điện thoại">
          <input value={formData.phone} onChange={event => setFormData({ ...formData, phone: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Mức lương">
          <input type="number" value={formData.salary} onChange={event => setFormData({ ...formData, salary: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Trạng thái">
          <select value={formData.status} onChange={event => setFormData({ ...formData, status: event.target.value })} className={inputClass}>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 md:col-span-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">Hủy</button>
          <button type="submit" className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white">
            {editingEmployee ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-black uppercase tracking-wider text-gray-500">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#c0392b] focus:ring-2 focus:ring-red-100';
const selectClass = 'rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-gray-700 outline-none';

export default EmployeeManagementPage;
