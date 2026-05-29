import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, PlusCircle, Search, Trash2 } from 'lucide-react';
import menuService from '../../services/menuService';
import MenuForm from '../../components/MenuForm';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { getImageUrl } from '../../utils/imageUrl';
import { ALL_MENU_CATEGORY, MENU_CATEGORIES } from '../../constants/menuCategories';
import { useToast } from '../../contexts/ToastContext';

const categories = [ALL_MENU_CATEGORY, ...MENU_CATEGORIES];
const pageSize = 5;

// Fallback images removed

const normalizeText = (value = '') => value.toString().trim().toLowerCase();
const formatPrice = (value) => Number(value || 0).toLocaleString('vi-VN');
const getItemCode = (item) => `#S-${String(item._id || '').slice(-4).toUpperCase()}`;
const getStatus = (item) => (item.isAvailable === false ? 'Hết hàng' : 'Còn hàng');

const statusClass = {
  'Còn hàng': 'bg-emerald-50 text-emerald-700',
  'Sắp hết': 'bg-amber-50 text-amber-700',
  'Hết hàng': 'bg-red-50 text-red-700',
};

const MenuManagementPage = () => {
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, loading: false });

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await menuService.getMenuItems();
      setMenuItems(data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách món';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const filteredItems = useMemo(() => {
    const keyword = normalizeText(search);
    return menuItems.filter(item => {
      const matchesSearch = !keyword || [item.name, item.category, item.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword);

      const matchesCategory = activeCategory === 'Tất cả'
        || normalizeText(item.category) === normalizeText(activeCategory);

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, search, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const openCreate = () => {
    setSelected(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setSelected(null);
    setShowForm(false);
  };

  const handleFormSubmit = async (formData) => {
    setError('');
    try {
      if (selected) {
        const updated = await menuService.updateMenuItem(selected._id, formData);
        setMenuItems(current => current.map(item => item._id === updated._id ? updated : item));
      } else {
        const created = await menuService.createMenuItem(formData);
        setMenuItems(current => [created, ...current]);
      }
      showToast(selected ? 'Đã cập nhật món' : 'Đã thêm món');
      closeForm();
    } catch (err) {
      const details = err.response?.data?.details;
      const message = details?.[0]?.message || err.response?.data?.message || 'Không thể lưu món';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleDelete = (item) => {
    setDeleteModal({ isOpen: true, item, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;

    try {
      setDeleteModal(current => ({ ...current, loading: true }));
      const result = await menuService.deleteMenuItem(deleteModal.item._id);
      setMenuItems(current => current.filter(menuItem => menuItem._id !== deleteModal.item._id));
      const pausedCombos = Number(result?.pausedCombos || 0);
      showToast(pausedCombos > 0
        ? `Đã xóa món và tạm ngừng ${pausedCombos} combo liên quan.`
        : 'Đã xóa món khỏi thực đơn.'
      );
      setDeleteModal({ isOpen: false, item: null, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể xóa món';
      setError(message);
      showToast(message, 'error');
      setDeleteModal({ isOpen: false, item: null, loading: false });
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Quản lý thực đơn</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Cập nhật và quản lý danh sách món ăn của hệ thống.</p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#a90b16]"
        >
          <PlusCircle size={17} />
          Thêm món mới
        </button>
      </div>

      <div className="mb-6 max-w-xl">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm món ăn, danh mục..."
            className="w-full rounded-full border border-gray-100 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-gray-700 shadow-sm outline-none focus:border-[#c70d1a] focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {categories.map(category => {
          const active = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
                active
                  ? 'bg-[#c70d1a] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-[#c70d1a]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-[#fbf8f7] text-left text-[11px] font-black uppercase tracking-widest text-red-950">
                <th className="px-6 py-4">Thông tin món</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Giá bán</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Đã bán</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm font-bold text-gray-500">Đang tải thực đơn...</td>
                </tr>
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm font-bold text-gray-500">Không có món phù hợp.</td>
                </tr>
              ) : (
                visibleItems.map(item => (
                  <MenuRow
                    key={item._id}
                    item={item}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-50 px-6 py-4 text-xs font-bold text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Hiển thị {visibleItems.length ? (currentPage - 1) * pageSize + 1 : 0}
            -{Math.min(currentPage * pageSize, filteredItems.length)} của {filteredItems.length} món
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentPage === page ? 'bg-[#c70d1a] text-white' : 'border border-gray-100 text-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
            {totalPages > 3 && <span className="px-1">...</span>}
            {totalPages > 3 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentPage === totalPages ? 'bg-[#c70d1a] text-white' : 'border border-gray-100 text-gray-600'
                }`}
              >
                {totalPages}
              </button>
            )}
            <button
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
        <MenuForm
          menuItem={selected}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          error={error}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Xóa món?"
        message={`Bạn có chắc chắn muốn xóa "${deleteModal.item?.name || 'món này'}" khỏi hệ thống không? Nếu món nằm trong combo, combo đó sẽ tạm ngừng.`}
        loading={deleteModal.loading}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, loading: false })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const MenuRow = ({ item, onEdit, onDelete }) => {
  const status = getStatus(item);
  const image = getImageUrl(item.image, '/images/home/product-burger.png');

  return (
    <tr className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/70">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <img
            src={image}
            alt={item.name}
            className={`h-14 w-16 rounded-xl object-cover ring-1 ring-gray-100 ${item.isAvailable === false ? 'grayscale opacity-60' : ''}`}
          />
          <div>
            <div className="font-black text-gray-950">{item.name}</div>
            <div className="mt-0.5 text-xs font-bold text-gray-400">{getItemCode(item)}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 font-bold text-gray-700">{item.category}</td>
      <td className="px-6 py-4 font-black text-[#c70d1a]">
        {formatPrice(item.price)}
        <div className="text-xs font-black">VNĐ</div>
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 font-bold text-gray-800">{Number(item.soldCount || 0).toLocaleString('vi-VN')}</td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-3 text-red-950">
          <button onClick={onEdit} className="rounded-lg p-2 hover:bg-red-50" title="Sửa món">
            <Edit3 size={17} />
          </button>
          <button onClick={onDelete} className="rounded-lg p-2 text-[#c70d1a] hover:bg-red-50" title="Xóa món">
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default MenuManagementPage;
