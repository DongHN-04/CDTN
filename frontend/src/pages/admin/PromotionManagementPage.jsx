import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, MoreVertical, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import promotionService from '../../services/promotionService';
import uploadService from '../../services/uploadService';
import { getImageUrl } from '../../utils/imageUrl';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { useToast } from '../../contexts/ToastContext';

const pageSize = 6;

const initialForm = {
  name: '',
  description: '',
  type: 'percent',
  value: 0,
  minOrderValue: 0,
  startDate: '',
  endDate: '',
  isActive: true,
};

// Default banner removed

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateText = (value) => {
  if (!value) return 'Chưa đặt';
  return new Date(value).toLocaleDateString('vi-VN');
};

const formatCurrency = (value = 0) => `${Number(value).toLocaleString('vi-VN')} VNĐ`;

const getPromotionStatus = (promotion) => {
  const now = new Date();
  const start = new Date(promotion.startDate);
  const end = new Date(promotion.endDate);

  if (!promotion.isActive) return { label: 'Tạm tắt', tone: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', disabled: true };
  if (start > now) return { label: 'Sắp chạy', tone: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' };
  if (end < now) return { label: 'Hết hạn', tone: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', disabled: true };
  return { label: 'Đang chạy', tone: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
};

const getDiscountText = (promotion) => {
  if (promotion.type === 'percent') return `Giảm ${promotion.value}%`;
  if (promotion.type === 'fixed') return `Giảm ${formatCurrency(promotion.value)}`;
  return 'Không hỗ trợ';
};

const PromotionManagementPage = () => {
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [, setError] = useState('');
  const [banners, setBanners] = useState([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', target: null, loading: false });
  const [currentPage, setCurrentPage] = useState(1);
  const bannerInputRef = useRef(null);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await promotionService.getPromotions();
      setPromotions(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách khuyến mãi';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchBanners = useCallback(async () => {
    try {
      const data = await promotionService.getBanners();
      if (data && data.length > 0) {
        setBanners(data);
        const activeIdx = data.findIndex(b => b.isActive);
        setActiveBannerIndex(activeIdx !== -1 ? activeIdx : 0);
      } else {
        setBanners([]);
        setActiveBannerIndex(0);
      }
    } catch (err) {
      console.error('Không thể tải banner:', err);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
    fetchBanners();
  }, [fetchPromotions, fetchBanners]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(false);
  };

  const handleEdit = (promotion) => {
    setEditingId(promotion._id);
    setForm({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      value: promotion.value,
      minOrderValue: promotion.minOrderValue,
      startDate: formatDateInput(promotion.startDate),
      endDate: formatDateInput(promotion.endDate),
      isActive: promotion.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = (promotion) => {
    setDeleteModal({ isOpen: true, type: 'promotion', target: promotion, loading: false });
  };

  const confirmDeletePromotion = async () => {
    if (!deleteModal.target?._id) return;

    try {
      setDeleteModal(current => ({ ...current, loading: true }));
      await promotionService.deletePromotion(deleteModal.target._id);
      setPromotions(current => current.filter(promotion => promotion._id !== deleteModal.target._id));
      if (editingId === deleteModal.target._id) closeForm();
      setDeleteModal({ isOpen: false, type: '', target: null, loading: false });
      showToast('Đã xóa khuyến mãi');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể xóa khuyến mãi';
      setError(message);
      showToast(message, 'error');
      setDeleteModal({ isOpen: false, type: '', target: null, loading: false });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const value = Number(form.value);
    const minOrderValue = Number(form.minOrderValue || 0);
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);

    if (!form.name.trim()) {
      setError('Tên khuyến mãi là bắt buộc');
      showToast('Tên khuyến mãi là bắt buộc', 'error');
      return;
    }
    if (!Number.isFinite(value) || value <= 0 || value > 100000000 || (form.type === 'percent' && value > 100)) {
      setError('Giá trị giảm không hợp lệ');
      showToast('Giá trị giảm không hợp lệ', 'error');
      return;
    }
    if (!Number.isFinite(minOrderValue) || minOrderValue < 0 || minOrderValue > 100000000) {
      setError('Giá trị đơn tối thiểu không hợp lệ');
      showToast('Giá trị đơn tối thiểu không hợp lệ', 'error');
      return;
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      showToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      return;
    }

    try {
      if (editingId) {
        const updated = await promotionService.updatePromotion(editingId, form);
        setPromotions(current => current.map(promotion => promotion._id === updated._id ? updated : promotion));
      } else {
        const created = await promotionService.createPromotion(form);
        setPromotions(current => [created, ...current]);
      }
      showToast(editingId ? 'Đã cập nhật khuyến mãi' : 'Đã tạo khuyến mãi');
      closeForm();
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể lưu khuyến mãi';
      setError(message);
      showToast(message, 'error');
    }
  };

  const filteredPromotions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return promotions.filter(promotion => {
      const status = getPromotionStatus(promotion);
      const matchesStatus = statusFilter === 'all' || status.label === statusFilter;
      const haystack = [promotion.name, promotion.description, getDiscountText(promotion)].join(' ').toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [promotions, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / pageSize));
  const paginatedPromotions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPromotions.slice(startIndex, startIndex + pageSize);
  }, [filteredPromotions, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const featuredPromotion = useMemo(() => {
    return promotions.find(promotion => getPromotionStatus(promotion).label === 'Đang chạy') || promotions[0];
  }, [promotions]);

  const activeBanner = banners[activeBannerIndex] || { image: '', title: '' };

  const selectBanner = async (index) => {
    const targetBanner = banners[index];
    if (!targetBanner?._id) return;
    try {
      await promotionService.setActiveBanner(targetBanner._id);
      setActiveBannerIndex(index);
      window.dispatchEvent(new Event('promotion-banner-updated'));
      showToast('Đã kích hoạt banner');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể kích hoạt banner';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setError('');
    try {
      const imageUrl = await uploadService.uploadImage(file);
      const title = featuredPromotion?.name || 'Banner khuyến mãi';
      await promotionService.createBanner({ image: imageUrl, title });
      await fetchBanners();
      showToast('Đã tải banner mới');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải banner mới';
      setError(message);
      showToast(message, 'error');
    } finally {
      setUploadingBanner(false);
      event.target.value = '';
    }
  };

  const handleDeleteBanner = (index) => {
    const targetBanner = banners[index];
    if (!targetBanner?._id) {
      // Nếu là default mock banner, không thể xóa khỏi DB
      return;
    }

    setDeleteModal({ isOpen: true, type: 'banner', target: targetBanner, loading: false });
  };

  const confirmDeleteBanner = async () => {
    if (!deleteModal.target?._id) return;

    try {
      setDeleteModal(current => ({ ...current, loading: true }));
      await promotionService.deleteBanner(deleteModal.target._id);
      await fetchBanners();
      setDeleteModal({ isOpen: false, type: '', target: null, loading: false });
      showToast('Đã xóa banner');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể xóa banner';
      setError(message);
      showToast(message, 'error');
      setDeleteModal({ isOpen: false, type: '', target: null, loading: false });
    }
  };

  const confirmDelete = () => {
    if (deleteModal.type === 'banner') return confirmDeleteBanner();
    return confirmDeletePromotion();
  };

  return (
    <div className="max-w-[980px] mx-auto pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-black tracking-tight text-gray-900">Quản lý khuyến mãi</h1>
          <p className="mt-1 text-xs font-medium text-gray-500">Theo dõi banner, mã giảm giá và chương trình ưu đãi.</p>
        </div>
      </div>

      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a1e1e]" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm mã giảm giá hoặc chương trình..."
            className="h-11 w-full rounded-xl border border-red-100 bg-white pl-11 pr-4 text-sm outline-none md:w-[330px] focus:border-[#c0392b] focus:ring-2 focus:ring-red-50"
          />
        </div>

        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c20d1e] px-6 text-sm font-black text-white shadow-sm hover:bg-[#a80b19]"
        >
          <PlusCircle size={17} />
          Tạo khuyến mãi mới
        </button>
      </div>


      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="m-0 text-lg font-black text-gray-900">{editingId ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi mới'}</h2>
            <button onClick={closeForm} className="rounded-lg px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100">
              Đóng
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên chương trình">
              <input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Loại giảm">
              <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })} className={inputClass}>
                <option value="percent">Giảm theo phần trăm</option>
                <option value="fixed">Giảm tiền trực tiếp</option>
              </select>
            </Field>
            <Field label="Giá trị">
              <input type="number" min="0" value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Đơn tối thiểu">
              <input type="number" min="0" value={form.minOrderValue} onChange={event => setForm({ ...form, minOrderValue: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Ngày bắt đầu">
              <input required type="date" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Ngày kết thúc">
              <input required type="date" value={form.endDate} onChange={event => setForm({ ...form, endDate: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Mô tả">
              <textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={`${inputClass} min-h-[90px] resize-none`} />
            </Field>
            <div className="flex flex-col justify-between rounded-xl bg-gray-50 p-4">
              <label className="inline-flex items-center gap-3 text-sm font-bold text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} className="h-4 w-4 accent-[#c0392b]" />
                Kích hoạt chương trình
              </label>
              <button type="submit" className="mt-5 rounded-xl bg-[#c20d1e] px-5 py-2.5 text-sm font-black text-white">
                {editingId ? 'Cập nhật khuyến mãi' : 'Lưu khuyến mãi'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      <section className="mb-12">
        <div className="mb-5">
          <h2 className="m-0 text-xl font-black text-gray-950">Banner đang hiển thị</h2>
          <p className="m-0 text-sm text-[#7b1d1d]">Quản lý banner khuyến mãi trên trang chủ</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="relative h-[150px] overflow-hidden rounded-2xl bg-[#1b0f0d] shadow-sm">
            <img
              src={getImageUrl(activeBanner.image, '/images/home/hero-burger.png')}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
            <span className="absolute right-4 top-4 rounded-full bg-[#c20d1e] px-3 py-1 text-xs font-black text-white">Đang chạy</span>
            <div className="absolute bottom-5 left-5 text-white">
              <h3 className="m-0 text-xl font-black">{featuredPromotion?.name || activeBanner.title}</h3>
              <p className="m-0 text-sm font-bold">Hiệu lực đến: {formatDateText(featuredPromotion?.endDate)}</p>
            </div>
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
              title="Đổi banner"
            >
              <Pencil size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="flex h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-white text-[#7b1d1d] hover:bg-red-50/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-[#c20d1e]">
              <ImagePlus size={18} />
            </span>
            <span className="text-sm font-black">{uploadingBanner ? 'Đang tải banner...' : 'Tải banner mới'}</span>
            <span className="mt-1 text-xs font-semibold text-red-900/60">JPG, PNG hoặc WEBP</span>
          </button>
        </div>

        <input
          ref={bannerInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleBannerUpload}
          className="hidden"
        />

        {banners.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {banners.map((banner, index) => (
              <div
                key={`${banner.image}-${index}`}
                className={`group relative h-16 w-28 overflow-hidden rounded-xl border ${index === activeBannerIndex ? 'border-[#c20d1e]' : 'border-transparent'}`}
              >
                <button type="button" onClick={() => selectBanner(index)} className="h-full w-full">
                  <img src={getImageUrl(banner.image, '/images/home/hero-burger.png')} alt="" className="h-full w-full object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBanner(index)}
                  className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                  title="Xóa banner"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="m-0 text-xl font-black text-gray-950">Mã giảm giá</h2>
            <p className="m-0 text-sm text-[#7b1d1d]">Quản lý các mã còn hiệu lực và đã tạm tắt</p>
          </div>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className="rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-bold text-[#7b1d1d] outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang chạy">Đang chạy</option>
            <option value="Sắp chạy">Sắp chạy</option>
            <option value="Tạm tắt">Tạm tắt</option>
            <option value="Hết hạn">Hết hạn</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-gray-500">Đang tải mã giảm giá...</div>
        ) : filteredPromotions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-gray-500">Chưa có mã giảm giá phù hợp.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paginatedPromotions.map(promotion => (
                <PromotionCard
                  key={promotion._id}
                  promotion={promotion}
                  onEdit={() => handleEdit(promotion)}
                  onDelete={() => handleDelete(promotion)}
                />
              ))}
            </div>
            <PaginationFooter
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredPromotions.length}
              totalPages={totalPages}
              label="mã giảm giá"
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'banner' ? 'Xóa banner?' : 'Xóa mã khuyến mãi?'}
        message={deleteModal.type === 'banner'
          ? 'Bạn có chắc chắn muốn xóa banner này khỏi hệ thống không?'
          : `Bạn có chắc chắn muốn xóa "${deleteModal.target?.name || 'mã khuyến mãi này'}" khỏi hệ thống không?`}
        loading={deleteModal.loading}
        onCancel={() => setDeleteModal({ isOpen: false, type: '', target: null, loading: false })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const PromotionCard = ({ promotion, onEdit, onDelete }) => {
  const status = getPromotionStatus(promotion);
  const inactive = status.disabled;

  return (
    <div className={`relative min-h-[245px] overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 ${inactive ? 'opacity-70' : ''}`}>
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[48px] bg-red-50" />
      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${status.tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <MoreVertical size={17} />
          </button>
        </div>

        <h3 className={`mb-1 text-2xl font-black uppercase ${inactive ? 'text-gray-500' : 'text-[#c20d1e]'}`}>
          {promotion.name}
        </h3>
        <p className="min-h-[48px] text-sm font-semibold text-gray-800">
          {promotion.description || getDiscountText(promotion)}
        </p>

        <div className="mt-7 border-t border-gray-100 pt-4 text-[11px] text-[#3a1111]">
          <div className="flex justify-between">
            <span>Ưu đãi:</span>
            <strong>{getDiscountText(promotion)}</strong>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Đơn tối thiểu:</span>
            <strong>{formatCurrency(promotion.minOrderValue)}</strong>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Hết hạn:</span>
            <strong>{formatDateText(promotion.endDate)}</strong>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button onClick={onEdit} className="h-10 flex-1 rounded-xl bg-[#f1eded] text-sm font-black text-[#3a1111] hover:bg-red-50">
            Sửa
          </button>
          <button onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-[#c20d1e] hover:bg-red-50">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#c0392b] focus:ring-2 focus:ring-red-100';

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-500">{label}</span>
    {children}
  </label>
);

const PaginationFooter = ({ currentPage, pageSize, totalItems, totalPages, label, onPageChange }) => (
  <div className="mt-6 flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-xs font-bold text-gray-500 shadow-sm ring-1 ring-gray-100">
    <span>
      Hiển thị {totalItems ? (currentPage - 1) * pageSize + 1 : 0}
      -{Math.min(currentPage * pageSize, totalItems)} của {totalItems} {label}
    </span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(page => Math.max(1, page - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
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
        onClick={() => onPageChange(page => Math.min(totalPages, page + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  </div>
);

export default PromotionManagementPage;
