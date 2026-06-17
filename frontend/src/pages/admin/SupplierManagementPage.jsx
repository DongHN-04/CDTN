import React, { useCallback, useEffect, useMemo, useState } from 'react';
import supplierService from '../../services/supplierService';
import SupplierForm from '../../components/SupplierForm';
import PurchaseForm from '../../components/PurchaseForm';
import { formatApiError } from '../../utils/apiError';
import { PlusCircle } from 'lucide-react';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { useToast } from '../../contexts/ToastContext';
import Pagination from '../../components/Pagination';

const pageSize = 5;
const formatCurrency = (value = 0, compact = false) => {
  const number = Number(value || 0);
  if (compact && Math.abs(number) >= 1000000) {
    return `${(number / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M VNĐ`;
  }
  return `${number.toLocaleString('vi-VN')} VNĐ`;
};

const SupplierManagementPage = () => {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState(null);
  const [payDebtAmount, setPayDebtAmount] = useState('');
  const [payDebtLoading, setPayDebtLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [, setPageError] = useState('');
  const [search, setSearch] = useState('');
  const [debtFilter, setDebtFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, supplier: null, loading: false });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [supplierData, purchaseData] = await Promise.all([
        supplierService.getSuppliers(),
        supplierService.getPurchases(),
      ]);
      setSuppliers(supplierData || []);
      setPurchases(purchaseData || []);
    } catch (error) {
      const message = formatApiError(error, 'Không thể tải dữ liệu nhà cung cấp');
      setPageError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const openCreate = () => {
    setEditingSupplier(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = (supplier) => {
    setDeleteModal({ isOpen: true, supplier, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteModal.supplier) return;

    try {
      setDeleteModal(current => ({ ...current, loading: true }));
      await supplierService.deleteSupplier(deleteModal.supplier._id);
      setDeleteModal({ isOpen: false, supplier: null, loading: false });
      showToast('Đã xóa nhà cung cấp');
      fetchData();
    } catch (error) {
      const message = formatApiError(error, 'Không thể xóa nhà cung cấp');
      setPageError(message);
      showToast(message, 'error');
      setDeleteModal({ isOpen: false, supplier: null, loading: false });
    }
  };

  const handleSubmit = async (formData) => {
    setFormError('');
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier._id, formData);
      } else {
        await supplierService.createSupplier(formData);
      }
      setShowForm(false);
      setEditingSupplier(null);
      showToast(editingSupplier ? 'Đã cập nhật nhà cung cấp' : 'Đã thêm nhà cung cấp');
      fetchData();
    } catch (error) {
      const message = formatApiError(error, 'Lỗi lưu nhà cung cấp');
      setFormError(message);
      showToast(message, 'error');
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseForm(false);
    showToast('Đã nhập hàng');
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayDebt = async () => {
    const amount = Number(payDebtAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Số tiền thanh toán không hợp lệ', 'error');
      return;
    }
    if (amount > Number(payingSupplier.debt || 0)) {
      showToast('Số tiền thanh toán lớn hơn công nợ hiện tại', 'error');
      return;
    }

    try {
      setPayDebtLoading(true);
      await supplierService.payDebt(payingSupplier._id, amount);
      setPayingSupplier(null);
      setPayDebtAmount('');
      showToast('Đã thanh toán công nợ');
      fetchData();
    } catch (error) {
      const message = formatApiError(error, 'Lỗi thanh toán công nợ');
      setPageError(message);
      showToast(message, 'error');
    } finally {
      setPayDebtLoading(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return suppliers.filter(supplier => {
      const matchesSearch = !keyword || [
        supplier.name,
        supplier.contactPerson,
        supplier.phone,
        supplier.email,
      ].filter(Boolean).join(' ').toLowerCase().includes(keyword);

      const matchesDebt = debtFilter === 'all'
        || (debtFilter === 'debt' && supplier.debt > 0)
        || (debtFilter === 'clear' && supplier.debt <= 0);

      return matchesSearch && matchesDebt;
    });
  }, [suppliers, search, debtFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, debtFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(startIndex, startIndex + pageSize);
  }, [filteredSuppliers, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const totalDebt = suppliers.reduce((sum, supplier) => sum + Number(supplier.debt || 0), 0);
    const activeSupplierIds = new Set(purchases.map(purchase => purchase.supplier?._id || purchase.supplier).filter(Boolean));
    const purchaseTotal = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);

    return {
      total: suppliers.length,
      active: activeSupplierIds.size,
      purchaseTotal,
      totalDebt,
    };
  }, [suppliers, purchases]);

  const recentPurchases = useMemo(() => purchases.slice(0, 3), [purchases]);

  const supplierShares = useMemo(() => {
    const totals = new Map();
    purchases.forEach(purchase => {
      const supplierName = purchase.supplier?.name || 'Khác';
      totals.set(supplierName, (totals.get(supplierName) || 0) + Number(purchase.totalAmount || 0));
    });

    const maxValue = Math.max(...Array.from(totals.values()), 1);
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        height: Math.max(24, Math.round((value / maxValue) * 110)),
        color: ['bg-[#e9b2b2]', 'bg-[#df8b8b]', 'bg-[#c72f38]', 'bg-[#d56b72]', 'bg-[#efc9c9]'][index],
      }));
  }, [purchases]);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Quản lý Nhà cung cấp</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Danh sách đối tác cung ứng nguyên liệu và lịch sử giao dịch.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c20d1e] px-6 text-sm font-black text-white shadow-sm hover:bg-[#a80b19]"
          >
            <PlusCircle size={17} />
            Thêm đối tác
          </button>
        </div>
      </div>


      <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard title="Tổng nhà cung cấp" value={stats.total} hint={`${filteredSuppliers.length} nhà cung cấp đang hiển thị`} icon="▣" />
        <StatCard title="Đang hoạt động" value={stats.active} hint="Có giao dịch nhập hàng" icon="◎" />
        <StatCard title="Tổng giá trị nhập" value={formatCurrency(stats.purchaseTotal, true)} hint={`Công nợ: ${formatCurrency(stats.totalDebt)}`} icon="▥" />
      </div>

      <div className="mb-7 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm nhà cung cấp..."
              className="w-full rounded-xl border border-red-100 bg-white py-3 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#c70d1a] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <select
            value={debtFilter}
            onChange={event => setDebtFilter(event.target.value)}
            className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-gray-700 outline-none"
          >
            <option value="all">Lọc</option>
            <option value="debt">Còn công nợ</option>
            <option value="clear">Không công nợ</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-black uppercase tracking-widest text-red-950">
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Nhà cung cấp</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-sm font-bold text-gray-500">Đang tải...</td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-sm font-bold text-gray-500">Không có nhà cung cấp phù hợp.</td>
                </tr>
              ) : (
                paginatedSuppliers.map((supplier, index) => (
                  <SupplierRow
                    key={supplier._id}
                    supplier={supplier}
                    index={(currentPage - 1) * pageSize + index}
                    onEdit={() => openEdit(supplier)}
                    onDelete={() => handleDelete(supplier)}
                    onPayDebt={() => {
                      setPayingSupplier(supplier);
                      setPayDebtAmount(String(supplier.debt || ''));
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredSuppliers.length}
          totalPages={totalPages}
          label="nhà cung cấp"
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="m-0 text-lg font-black text-gray-950">Lịch sử nhập hàng gần đây</h2>
          <div className="mt-5 flex flex-col gap-3">
            {recentPurchases.length === 0 ? (
              <p className="text-sm font-bold text-gray-400">Chưa có lịch sử nhập hàng.</p>
            ) : (
              recentPurchases.map(purchase => (
                <div key={purchase._id} className="flex items-center justify-between rounded-xl bg-[#fbf8f7] px-4 py-3">
                  <div>
                    <div className="text-sm font-black text-red-950">PO-{purchase._id.slice(-6).toUpperCase()}</div>
                    <div className="text-xs font-semibold text-gray-500">
                      {new Date(purchase.purchaseDate).toLocaleDateString('vi-VN')} - {purchase.supplier?.name || 'Nhà cung cấp'}
                    </div>
                  </div>
                  <div className="text-right text-sm font-black text-gray-950">{formatCurrency(purchase.totalAmount)}</div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setShowPurchaseForm(true)}
            className="mt-5 w-full rounded-xl border border-[#c70d1a] px-4 py-3 text-xs font-black text-[#c70d1a] hover:bg-red-50"
          >
            Nhập hàng mới
          </button>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="m-0 text-lg font-black text-gray-950">Tỉ trọng nhập hàng theo đối tác</h2>
          <div className="mt-7 flex h-[160px] items-end justify-center gap-4 rounded-2xl bg-[#fbf8f7] px-6 py-5">
            {supplierShares.length === 0 ? (
              <p className="self-center text-sm font-bold text-gray-400">Chưa có dữ liệu</p>
            ) : (
              supplierShares.map(item => (
                <div key={item.name} className="flex flex-col items-center gap-2">
                  <div className={`w-10 rounded-t-lg ${item.color}`} style={{ height: item.height }} title={`${item.name}: ${formatCurrency(item.value)}`} />
                  <span className="max-w-[56px] truncate text-[10px] font-bold text-gray-500">{item.name}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showPurchaseForm && (
        <PurchaseForm onClose={() => setShowPurchaseForm(false)} onSuccess={handlePurchaseSuccess} />
      )}

      {payingSupplier && (
        <PayDebtModal
          supplier={payingSupplier}
          amount={payDebtAmount}
          setAmount={setPayDebtAmount}
          loading={payDebtLoading}
          onConfirm={handlePayDebt}
          onClose={() => {
            setPayingSupplier(null);
            setPayDebtAmount('');
          }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Xóa nhà cung cấp?"
        message={`Bạn có chắc chắn muốn xóa "${deleteModal.supplier?.name || 'nhà cung cấp này'}" khỏi hệ thống không?`}
        loading={deleteModal.loading}
        onCancel={() => setDeleteModal({ isOpen: false, supplier: null, loading: false })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const StatCard = ({ title, value, hint, icon }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
    <div className="mb-5 flex items-center justify-between">
      <div className="text-[11px] font-black uppercase tracking-widest text-red-950">{title}</div>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#c70d1a]">{icon}</div>
    </div>
    <div className="text-3xl font-black text-gray-950">{value}</div>
    <div className="mt-2 text-xs font-bold text-gray-500">{hint}</div>
  </div>
);

const SupplierRow = ({ supplier, index, onEdit, onDelete, onPayDebt }) => {
  const initials = (supplier.name || 'NC').slice(0, 2).toUpperCase();
  const hasDebt = Number(supplier.debt || 0) > 0;

  return (
    <tr className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/70">
      <td className="px-4 py-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-black text-white ${index % 2 ? 'bg-lime-600' : 'bg-emerald-900'}`}>
          {initials}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="font-black text-gray-950">{supplier.name}</div>
        <div className="line-clamp-1 text-xs font-semibold text-gray-500">{supplier.address || supplier.notes || 'Chưa có địa chỉ'}</div>
      </td>
      <td className="px-4 py-4">
        <div className="font-bold">{supplier.phone || 'Chưa có SĐT'}</div>
        <div className="text-xs text-gray-500">{supplier.email || 'Chưa có email'}</div>
      </td>
      <td className="px-4 py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${hasDebt ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>
          {hasDebt ? `Nợ ${formatCurrency(supplier.debt)}` : 'Đang hợp tác'}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-700">Sửa</button>
          {hasDebt && <button onClick={onPayDebt} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Trả nợ</button>}
          <button onClick={onDelete} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600">Xóa</button>
        </div>
      </td>
    </tr>
  );
};

const PayDebtModal = ({ supplier, amount, setAmount, loading, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="m-0 text-xl font-black text-gray-950">Thanh toán công nợ</h2>
      <p className="mt-2 text-sm font-bold text-gray-500">Nhà cung cấp: {supplier.name}</p>
      <p className="mt-1 text-sm font-bold text-gray-500">Công nợ hiện tại: {formatCurrency(supplier.debt)}</p>
      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-gray-500">Số tiền thanh toán (VNĐ)</span>
        <input
          type="number"
          min="1"
          max={Number(supplier.debt || 0)}
          value={amount}
          onChange={event => setAmount(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#c0392b] focus:ring-2 focus:ring-red-100"
        />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} disabled={loading} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600 disabled:opacity-60">Hủy</button>
        <button onClick={onConfirm} disabled={loading} className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          {loading ? 'Đang xử lý...' : 'Xác nhận'}
        </button>
      </div>
    </div>
  </div>
);

const PaginationFooter = ({ currentPage, pageSize, totalItems, totalPages, label, onPageChange }) => (
  <div className="flex items-center justify-between border-t border-gray-50 px-4 py-4 text-xs font-bold text-gray-500">
    <span>
      Hiển thị {totalItems ? (currentPage - 1) * pageSize + 1 : 0}
      -{Math.min(currentPage * pageSize, totalItems)} của {totalItems} {label}
    </span>
    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
  </div>
);

export default SupplierManagementPage;
