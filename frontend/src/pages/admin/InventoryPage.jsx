import React, { useCallback, useEffect, useMemo, useState } from 'react';
import inventoryService from '../../services/inventoryService';
import IngredientForm from '../../components/IngredientForm';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { formatApiError } from '../../utils/apiError';
import { useToast } from '../../contexts/ToastContext';
import Pagination from '../../components/Pagination';

const LOW_STOCK_THRESHOLD = 10;
const pageSize = 5;

const formatNumber = (value = 0) => Number(value || 0).toLocaleString('vi-VN');
const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;

const getStatus = (stock = 0) => {
  if (Number(stock) <= 0) return { label: 'Hết hàng', className: 'bg-red-50 text-red-700' };
  if (Number(stock) <= LOW_STOCK_THRESHOLD) return { label: 'Sắp hết', className: 'bg-gray-100 text-gray-600' };
  return { label: 'Còn hàng', className: 'bg-sky-50 text-sky-700' };
};

const InventoryPage = () => {
  const { showToast } = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [, setPageError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, ingredient: null, loading: false });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const data = await inventoryService.getIngredients();
      setIngredients(data || []);
    } catch (error) {
      const message = formatApiError(error, 'Không thể tải dữ liệu kho');
      setPageError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setSelected(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (ingredient) => {
    setSelected(ingredient);
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = (ingredient) => {
    setDeleteModal({ isOpen: true, ingredient, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteModal.ingredient) return;

    try {
      setDeleteModal(current => ({ ...current, loading: true }));
      await inventoryService.deleteIngredient(deleteModal.ingredient._id);
      setIngredients(current => current.filter(item => item._id !== deleteModal.ingredient._id));
      setDeleteModal({ isOpen: false, ingredient: null, loading: false });
      showToast('Đã xóa nguyên liệu');
    } catch (error) {
      const message = formatApiError(error, 'Không thể xóa nguyên liệu');
      setPageError(message);
      showToast(message, 'error');
      setDeleteModal({ isOpen: false, ingredient: null, loading: false });
    }
  };

  const handleSubmit = async (formData) => {
    setFormError('');

    try {
      if (selected) {
        const updated = await inventoryService.updateIngredient(selected._id, formData);
        setIngredients(current => current.map(item => item._id === updated._id ? updated : item));
      } else {
        const created = await inventoryService.createIngredient(formData);
        setIngredients(current => [created, ...current]);
      }
      setShowForm(false);
      showToast(selected ? 'Đã cập nhật nguyên liệu' : 'Đã thêm nguyên liệu');
    } catch (error) {
      const message = formatApiError(error, 'Lỗi lưu nguyên liệu');
      setFormError(message);
      showToast(message, 'error');
    }
  };

  const stats = useMemo(() => {
    const lowStock = ingredients.filter(item => item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD).length;
    const outOfStock = ingredients.filter(item => item.stock <= 0).length;
    const totalValue = ingredients.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.pricePerUnit || 0), 0);

    return {
      total: ingredients.length,
      lowStock,
      outOfStock,
      totalValue,
    };
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return ingredients.filter(item => {
      const status = getStatus(item.stock).label;
      const matchesSearch = !keyword || [
        item.name,
        item.unit,
        status,
      ].join(' ').toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'available' && status === 'Còn hàng')
        || (statusFilter === 'low' && status === 'Sắp hết')
        || (statusFilter === 'out' && status === 'Hết hàng');

      return matchesSearch && matchesStatus;
    });
  }, [ingredients, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredIngredients.length / pageSize));
  const paginatedIngredients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredIngredients.slice(startIndex, startIndex + pageSize);
  }, [filteredIngredients, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Quản lý Kho</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Theo dõi và cập nhật số lượng nguyên liệu.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm nguyên liệu..."
              className="w-72 rounded-xl border border-red-100 bg-white py-3 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#c70d1a] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-gray-700 outline-none"
          >
            <option value="all">Lọc</option>
            <option value="available">Còn hàng</option>
            <option value="low">Sắp hết</option>
            <option value="out">Hết hàng</option>
          </select>
          <button
            onClick={openCreate}
            className="rounded-xl bg-[#c70d1a] px-5 py-3 text-xs font-black text-white shadow-sm hover:bg-[#a90b16]"
          >
            Nhập hàng
          </button>
        </div>
      </div>


      <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard title="Tổng nguyên liệu" value={stats.total} hint={`+ ${filteredIngredients.length} đang hiển thị`} icon="▣" />
        <StatCard title="Sắp hết hàng" value={stats.lowStock} hint={`Cảnh báo tồn <= ${LOW_STOCK_THRESHOLD}`} icon="△" />
        <StatCard title="Hết hàng" value={stats.outOfStock} hint={`Giá trị kho: ${formatCurrency(stats.totalValue)}`} icon="◎" danger />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="bg-[#fbf8f7] text-left text-[11px] font-black uppercase tracking-widest text-red-950">
              <th className="px-5 py-4">Mã NL</th>
              <th className="px-5 py-4">Tên nguyên liệu</th>
              <th className="px-5 py-4">Tồn kho</th>
              <th className="px-5 py-4">Đơn vị</th>
              <th className="px-5 py-4">Giá nhập</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-sm font-bold text-gray-500">Đang tải...</td>
              </tr>
            ) : filteredIngredients.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-sm font-bold text-gray-500">Không có nguyên liệu phù hợp.</td>
              </tr>
            ) : (
              paginatedIngredients.map((ingredient, index) => (
                <IngredientRow
                  key={ingredient._id}
                  ingredient={ingredient}
                  index={(currentPage - 1) * pageSize + index}
                  onEdit={() => openEdit(ingredient)}
                  onDelete={() => handleDelete(ingredient)}
                />
              ))
            )}
          </tbody>
        </table>
        <PaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredIngredients.length}
          totalPages={totalPages}
          label="nguyên liệu"
          onPageChange={setCurrentPage}
        />
      </div>

      {showForm && (
        <IngredientForm
          ingredient={selected}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Xóa nguyên liệu?"
        message={`Bạn có chắc chắn muốn xóa "${deleteModal.ingredient?.name || 'nguyên liệu này'}" khỏi hệ thống không?`}
        loading={deleteModal.loading}
        onCancel={() => setDeleteModal({ isOpen: false, ingredient: null, loading: false })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const StatCard = ({ title, value, hint, icon, danger = false }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
    <div className={`absolute right-0 top-0 h-20 w-20 rounded-bl-[44px] ${danger ? 'bg-red-50' : 'bg-sky-50'}`} />
    <div className="relative">
      <div className="mb-5 flex items-center justify-between">
        <div className="text-[11px] font-black uppercase tracking-widest text-red-950">{title}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${danger ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-700'}`}>{icon}</div>
      </div>
      <div className={`text-4xl font-black ${danger ? 'text-[#c70d1a]' : 'text-gray-950'}`}>{value}</div>
      <div className={`mt-2 text-xs font-bold ${danger ? 'text-red-500' : 'text-sky-600'}`}>{hint}</div>
    </div>
  </div>
);

const IngredientRow = ({ ingredient, index, onEdit, onDelete }) => {
  const status = getStatus(ingredient.stock);

  return (
    <tr className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/70">
      <td className="px-5 py-5 font-black text-red-950">NL-{String(index + 1).padStart(3, '0')}</td>
      <td className="px-5 py-5">
        <div className="font-black text-gray-950">{ingredient.name}</div>
        <div className="text-xs font-semibold text-gray-400">Cập nhật {new Date(ingredient.updatedAt || ingredient.createdAt || Date.now()).toLocaleDateString('vi-VN')}</div>
      </td>
      <td className={`px-5 py-5 font-black ${ingredient.stock <= 0 ? 'text-[#c70d1a]' : 'text-gray-950'}`}>
        {formatNumber(ingredient.stock)}
      </td>
      <td className="px-5 py-5 font-semibold text-gray-700">{ingredient.unit}</td>
      <td className="px-5 py-5 font-semibold text-gray-700">{formatCurrency(ingredient.pricePerUnit)}</td>
      <td className="px-5 py-5">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
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

const PaginationFooter = ({ currentPage, pageSize, totalItems, totalPages, label, onPageChange }) => (
  <div className="flex items-center justify-between border-t border-gray-50 px-5 py-4 text-xs font-bold text-gray-500">
    <span>
      Hiển thị {totalItems ? (currentPage - 1) * pageSize + 1 : 0}
      -{Math.min(currentPage * pageSize, totalItems)} của {totalItems} {label}
    </span>
    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
  </div>
);

export default InventoryPage;
