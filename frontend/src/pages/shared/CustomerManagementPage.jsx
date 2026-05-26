import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import customerService from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const pageSize = 5;
const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatLastPurchase = (value) => {
  if (!value) return 'Chưa mua hàng';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa mua hàng';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  type: 'Thường',
  notes: '',
};

const CustomerManagementPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, customer: null, loading: false });
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await customerService.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      type: customer.type === 'VIP' ? 'VIP' : 'Thường',
      notes: customer.notes || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData(emptyForm);
  };

  const handleDelete = (customer) => {
    setDeleteModal({ isOpen: true, customer, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteModal.customer) return;

    try {
      setDeleteModal(current => ({ ...current, loading: true }));
      await customerService.deleteCustomer(deleteModal.customer._id);
      setDeleteModal({ isOpen: false, customer: null, loading: false });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa khách hàng');
      setDeleteModal({ isOpen: false, customer: null, loading: false });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Tên khách hàng là bắt buộc');
      return;
    }

    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer._id, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      closeForm();
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu khách hàng');
    }
  };

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return customers.filter(customer => {
      const matchesSearch = !keyword || [
        customer.name,
        customer.phone,
        customer.email,
        customer.type,
      ].filter(Boolean).join(' ').toLowerCase().includes(keyword);

      const matchesType = typeFilter === 'all'
        || (typeFilter === 'vip' && customer.type === 'VIP')
        || (typeFilter === 'regular' && customer.type !== 'VIP');

      return matchesSearch && matchesType;
    });
  }, [customers, search, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthCustomers = customers.filter(customer => {
      const createdAt = new Date(customer.createdAt || Date.now());
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;

    return {
      total: customers.length,
      vip: customers.filter(customer => customer.type === 'VIP').length,
      newThisMonth: monthCustomers,
    };
  }, [customers]);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Khách hàng</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Quản lý và theo dõi thông tin khách hàng.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm khách hàng..."
              className="w-72 rounded-xl border border-red-100 bg-white py-3 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#c70d1a] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <select
            value={typeFilter}
            onChange={event => setTypeFilter(event.target.value)}
            className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-gray-700 outline-none"
          >
            <option value="all">Lọc</option>
            <option value="vip">VIP</option>
            <option value="regular">Thường xuyên</option>
          </select>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#a90b16]"
          >
            <PlusCircle size={17} />
            Thêm khách hàng
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard title="Tổng khách hàng" value={stats.total} icon="♙" tone="bg-red-50 text-[#c70d1a]" />
        <StatCard title="Khách hàng VIP" value={stats.vip} icon="✪" tone="bg-sky-50 text-sky-700" />
        <StatCard title="Khách mới tháng này" value={`+${stats.newThisMonth}`} icon="↗" tone="bg-gray-100 text-gray-600" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-[#fbf8f7] text-left text-[11px] font-black uppercase tracking-widest text-red-950">
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Liên hệ</th>
              <th className="px-5 py-4">Tổng đơn</th>
              <th className="px-5 py-4">Chi tiêu (VNĐ)</th>
              <th className="px-5 py-4">Lần cuối mua</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-sm font-bold text-gray-500">Đang tải...</td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-sm font-bold text-gray-500">Không có khách hàng phù hợp.</td>
              </tr>
            ) : (
              paginatedCustomers.map(customer => (
                <CustomerRow
                  key={customer._id}
                  customer={customer}
                  canDelete={user?.role === 'admin'}
                  onEdit={() => openEdit(customer)}
                  onDelete={() => handleDelete(customer)}
                />
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-gray-50 px-5 py-4 text-xs font-bold text-gray-500">
          <span>
            Hiển thị {filteredCustomers.length ? (currentPage - 1) * pageSize + 1 : 0}
            -{Math.min(currentPage * pageSize, filteredCustomers.length)} của {filteredCustomers.length} khách hàng
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
        <CustomerFormModal
          formData={formData}
          setFormData={setFormData}
          editingCustomer={editingCustomer}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Xóa khách hàng?"
        message={`Bạn có chắc chắn muốn xóa "${deleteModal.customer?.name || 'khách hàng này'}" khỏi hệ thống không?`}
        loading={deleteModal.loading}
        onCancel={() => setDeleteModal({ isOpen: false, customer: null, loading: false })}
        onConfirm={confirmDelete}
      />
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

const CustomerRow = ({ customer, canDelete, onEdit, onDelete }) => {
  const initials = (customer.name || 'KH').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const isVip = customer.type === 'VIP';

  return (
    <tr className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/70">
      <td className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black ${isVip ? 'bg-red-50 text-[#c70d1a]' : 'bg-gray-100 text-gray-600'}`}>
            {initials}
          </div>
          <div>
            <div className="font-black text-gray-950">{customer.name}</div>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${isVip ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {isVip ? 'VIP' : 'THƯỜNG XUYÊN'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 py-5">
        <div className="font-bold">{customer.phone || 'Chưa có SĐT'}</div>
        <div className="text-xs font-semibold text-gray-500">{customer.email || 'Chưa có email'}</div>
      </td>
      <td className="px-5 py-5 font-black">{customer.totalOrders}</td>
      <td className="px-5 py-5 font-black text-[#c70d1a]">{formatCurrency(customer.totalSpent)}</td>
      <td className="px-5 py-5 font-semibold text-gray-600">{formatLastPurchase(customer.lastPurchase)}</td>
      <td className="px-5 py-5">
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-700">Sửa</button>
          {canDelete && <button onClick={onDelete} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600">Xóa</button>}
        </div>
      </td>
    </tr>
  );
};

const CustomerFormModal = ({ formData, setFormData, editingCustomer, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-xl font-black text-gray-950">{editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">Cập nhật thông tin liên hệ và phân loại khách hàng.</p>
        </div>
        <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">Đóng</button>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Tên khách hàng">
          <input value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Số điện thoại">
          <input value={formData.phone} onChange={event => setFormData({ ...formData, phone: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Email">
          <input type="email" value={formData.email} onChange={event => setFormData({ ...formData, email: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Loại khách">
          <select value={formData.type} onChange={event => setFormData({ ...formData, type: event.target.value })} className={inputClass}>
            <option value="Thường">Thường</option>
            <option value="VIP">VIP</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Ghi chú">
            <textarea value={formData.notes} onChange={event => setFormData({ ...formData, notes: event.target.value })} className={`${inputClass} min-h-[90px] resize-none`} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 md:col-span-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">Hủy</button>
          <button type="submit" className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white">
            {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
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

export default CustomerManagementPage;
