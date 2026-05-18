import React, { useEffect, useMemo, useRef, useState } from 'react';
import comboService from '../../services/comboService';
import menuService from '../../services/menuService';
import uploadService from '../../services/uploadService';
import { getImageUrl } from '../../utils/imageUrl';

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  image: '',
  isActive: true,
  items: [],
};

const fallbackImages = [
  '/images/home/hero-collage.png',
  '/images/home/hero-burger.png',
  '/images/home/product-burger.png',
];

const formatPrice = (value = 0) => `${Number(value).toLocaleString('vi-VN')} VNĐ`;

const ComboManagementPage = () => {
  const [combos, setCombos] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [comboData, menuData] = await Promise.all([
          comboService.getCombos(),
          menuService.getMenuItems(),
        ]);
        setCombos(comboData || []);
        setAllMenuItems(menuData || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu combo');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => ({
    total: combos.length,
    active: combos.filter(combo => combo.isActive).length,
    paused: combos.filter(combo => !combo.isActive).length,
  }), [combos]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (combo) => {
    setEditingId(combo._id);
    setForm({
      name: combo.name || '',
      description: combo.description || '',
      price: combo.price || 0,
      image: combo.image || '',
      isActive: combo.isActive,
      items: (combo.items || []).map(item => ({
        menuItem: item.menuItem?._id || item.menuItem || '',
        quantity: item.quantity || 1,
      })),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleAddItem = () => {
    setForm(current => ({
      ...current,
      items: [...current.items, { menuItem: '', quantity: 1 }],
    }));
  };

  const handleRemoveItem = (index) => {
    setForm(current => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setForm(current => {
      const nextItems = [...current.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...current, items: nextItems };
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const image = await uploadService.uploadImage(file);
      setForm(current => ({ ...current, image }));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải ảnh combo');
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      ...form,
      price: Number(form.price),
      items: form.items.filter(item => item.menuItem).map(item => ({
        menuItem: item.menuItem,
        quantity: Number(item.quantity) || 1,
      })),
    };

    if (!payload.name.trim() || payload.price <= 0 || payload.items.length === 0) {
      setError('Tên combo, giá bán và ít nhất một món là bắt buộc');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        const updated = await comboService.updateCombo(editingId, payload);
        setCombos(current => current.map(combo => combo._id === updated._id ? updated : combo));
      } else {
        const created = await comboService.createCombo(payload);
        setCombos(current => [created, ...current]);
      }
      closeForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu combo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (combo) => {
    if (!window.confirm(`Xóa combo "${combo.name}"?`)) return;

    try {
      await comboService.deleteCombo(combo._id);
      setCombos(current => current.filter(item => item._id !== combo._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa combo');
    }
  };

  const getComboImage = (combo, index) => (
    getImageUrl(combo.image, fallbackImages[index % fallbackImages.length])
  );

  const getOldPrice = (combo, index) => {
    const multiplier = index === 0 ? 1.18 : index === 1 ? 1.22 : 1.15;
    return Math.round((combo.price || 0) * multiplier / 1000) * 1000;
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-900">Quản lý Combo</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Quản lý các gói sản phẩm và ưu đãi kết hợp.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-red-50 px-3 py-1 text-[#c0392b]">{stats.total} combo</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{stats.active} đang bán</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{stats.paused} tạm ngừng</span>
          </div>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#a90b16]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-base leading-none">+</span>
          Tạo Combo Mới
        </button>
      </div>

      {error && !showForm && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm font-bold text-gray-500 shadow-sm">Đang tải combo...</div>
      ) : combos.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="mb-4 text-sm font-bold text-gray-500">Chưa có combo nào.</p>
          <button onClick={openCreateForm} className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white">
            Tạo combo đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {combos.map((combo, index) => (
            <ComboCard
              key={combo._id}
              combo={combo}
              index={index}
              image={getComboImage(combo, index)}
              oldPrice={getOldPrice(combo, index)}
              onEdit={() => openEditForm(combo)}
              onDelete={() => handleDelete(combo)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-xl font-black text-gray-900">{editingId ? 'Sửa combo' : 'Tạo combo mới'}</h2>
                <p className="mt-1 text-sm text-gray-500">Chọn món, số lượng, giá bán và ảnh đại diện cho combo.</p>
              </div>
              <button onClick={closeForm} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">Đóng</button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Tên combo">
                  <input
                    value={form.name}
                    onChange={event => setForm({ ...form, name: event.target.value })}
                    className={inputClass}
                    placeholder="Ví dụ: Combo Gia Đình"
                  />
                </Field>
                <Field label="Giá bán">
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={event => setForm({ ...form, price: event.target.value })}
                    className={inputClass}
                    placeholder="390000"
                  />
                </Field>
              </div>

              <Field label="Mô tả">
                <textarea
                  value={form.description}
                  onChange={event => setForm({ ...form, description: event.target.value })}
                  className={`${inputClass} min-h-[88px] resize-none`}
                  placeholder="Mô tả ngắn cho combo"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
                <div className="h-36 overflow-hidden rounded-2xl bg-gray-100">
                  <img
                    src={getImageUrl(form.image, '/images/home/hero-collage.png')}
                    alt="Ảnh combo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Field label="Ảnh combo">
                    <input
                      value={form.image}
                      onChange={event => setForm({ ...form, image: event.target.value })}
                      className={inputClass}
                      placeholder="/uploads/combo.jpg hoặc URL ảnh"
                    />
                  </Field>
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className="rounded-xl border border-red-100 px-4 py-2 text-sm font-black text-[#c0392b] disabled:opacity-60"
                    >
                      Tải ảnh lên
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500">Thành phần combo</label>
                  <button type="button" onClick={handleAddItem} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                    + Thêm món
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr_90px_auto] items-center gap-3">
                      <select
                        value={item.menuItem}
                        onChange={event => handleItemChange(index, 'menuItem', event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Chọn món</option>
                        {allMenuItems.map(menuItem => (
                          <option key={menuItem._id} value={menuItem._id}>
                            {menuItem.name} ({formatPrice(menuItem.price)})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={event => handleItemChange(index, 'quantity', event.target.value)}
                        className={inputClass}
                      />
                      <button type="button" onClick={() => handleRemoveItem(index)} className="rounded-xl bg-red-50 px-3 py-3 text-xs font-black text-red-600">
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={event => setForm({ ...form, isActive: event.target.checked })}
                  className="h-4 w-4 accent-[#c0392b]"
                />
                Đang bán
              </label>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button type="button" onClick={closeForm} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ComboCard = ({ combo, index, image, oldPrice, onEdit, onDelete }) => {
  const items = combo.items || [];
  const visibleItems = items.slice(0, 4);
  const badge = !combo.isActive
    ? { text: 'Tạm Ngừng', className: 'bg-gray-100 text-gray-500' }
    : index === 0
      ? { text: 'Bán Chạy', className: 'bg-[#c70d1a] text-white' }
      : { text: 'Mới', className: 'bg-cyan-500 text-white' };

  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-xl ${!combo.isActive ? 'opacity-60' : ''}`}>
      <div className="relative h-[170px] bg-gray-100">
        <img src={image} alt={combo.name} className="h-full w-full object-cover" />
        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-black ${badge.className}`}>
          {badge.text}
        </span>
      </div>

      <div className="p-5">
        <h3 className="mb-1 line-clamp-2 min-h-[48px] text-xl font-black leading-tight text-gray-950">{combo.name}</h3>
        <p className="mb-4 line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-gray-500">
          {combo.description || 'Gói combo tiết kiệm cho khách hàng.'}
        </p>

        <div className="mb-5 rounded-xl bg-[#f6f1ef] p-4">
          <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-red-950">Thành phần:</div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {visibleItems.map(item => (
              <li key={item._id || `${item.menuItem?._id || item.menuItem}-${item.quantity}`} className="flex items-start gap-2 text-xs font-semibold text-red-950">
                <span className="mt-0.5 text-[#c0392b]">⊗</span>
                <span>{item.quantity}x {item.menuItem?.name || item.name || 'Món ăn'}</span>
              </li>
            ))}
            {items.length > visibleItems.length && (
              <li className="text-xs font-bold text-gray-500">+{items.length - visibleItems.length} món khác</li>
            )}
          </ul>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
          <div>
            {oldPrice > combo.price && (
              <div className="text-xs font-bold text-gray-400 line-through">{formatPrice(oldPrice)}</div>
            )}
            <div className="text-2xl font-black leading-none text-[#c0392b]">{formatPrice(combo.price)}</div>
          </div>

          <div className="flex gap-2">
            <button onClick={onEdit} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-black text-gray-700 hover:bg-gray-200" title="Sửa combo">
              ✎
            </button>
            <button onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-sm font-black text-red-600 hover:bg-red-100" title="Xóa combo">
              🗑
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-black uppercase tracking-wider text-gray-500">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#c0392b] focus:ring-2 focus:ring-red-100';

export default ComboManagementPage;
