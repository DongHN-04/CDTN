import React, { useEffect, useState } from 'react';
import inventoryService from '../services/inventoryService';
import uploadService from '../services/uploadService';
import { useToast } from '../contexts/ToastContext';
import { getImageUrl } from '../utils/imageUrl';
import { MENU_CATEGORIES } from '../constants/menuCategories';

const emptyForm = { name: '', price: 0, description: '', category: MENU_CATEGORIES[0], image: '' };
const MAX_MONEY = 100000000;
const MAX_QUANTITY = 100000;

const MenuForm = ({ menuItem, onSubmit, onCancel }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    inventoryService.getIngredients().then(data => setIngredientsList(data || []));

    if (menuItem) {
      setForm({
        name: menuItem.name || '',
        price: menuItem.price ?? 0,
        description: menuItem.description || '',
        category: menuItem.category || MENU_CATEGORIES[0],
        image: menuItem.image || '',
      });
      setSelectedIngredients(
        (menuItem.ingredients || [])
          .filter(ing => ing.ingredient)
          .map(ing => ({ ingredient: ing.ingredient._id, quantity: ing.quantity }))
      );
      setImagePreview(getImageUrl(menuItem.image));
    } else {
      setForm(emptyForm);
      setSelectedIngredients([]);
      setImagePreview('');
    }

    setImageFile(null);
  }, [menuItem]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const addRow = () => setSelectedIngredients(current => [...current, { ingredient: '', quantity: 0 }]);
  const removeRow = index => setSelectedIngredients(current => current.filter((_, itemIndex) => itemIndex !== index));

  const handleIngredientChange = (index, field, value) => {
    setSelectedIngredients(current => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return showToast('Tên món là bắt buộc', 'error');
    if (!form.category.trim()) return showToast('Danh mục là bắt buộc', 'error');
    if (Number(form.price) <= 0 || Number(form.price) > MAX_MONEY) return showToast('Giá bán phải lớn hơn 0 và không vượt quá 100.000.000', 'error');

    for (const ing of selectedIngredients) {
      if (!ing.ingredient || Number(ing.quantity) <= 0 || Number(ing.quantity) > MAX_QUANTITY) {
        return showToast('Chọn nguyên liệu và số lượng phải từ 1 đến 100.000', 'error');
      }
    }

    let imageUrl = form.image;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadService.uploadImage(imageFile);
      } catch (uploadError) {
        showToast(`Upload ảnh thất bại: ${uploadError.response?.data?.message || uploadError.message}`, 'error');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      ...form,
      price: Number(form.price),
      image: imageUrl,
      ingredients: selectedIngredients.map(ing => ({
        ingredient: ing.ingredient,
        quantity: Number(ing.quantity),
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-black text-gray-950">{menuItem ? 'Sửa món' : 'Thêm món mới'}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">Nhập thông tin món, ảnh và công thức nguyên liệu.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên món">
              <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Giá bán">
              <input type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Danh mục">
              <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className={inputClass}>
                {MENU_CATEGORIES.map(category => <option key={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="Ảnh món ăn">
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className={fileClass} />
            </Field>
          </div>

          <Field label="Mô tả">
            <textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={`${inputClass} min-h-[90px] resize-none`} />
          </Field>

          {imagePreview && (
            <div className="h-36 w-52 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-100">
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="m-0 text-sm font-black text-gray-900">Nguyên liệu</h3>
              <button type="button" onClick={addRow} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                + Thêm nguyên liệu
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {selectedIngredients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-sm font-semibold text-gray-500">
                  Chưa có nguyên liệu nào.
                </div>
              ) : selectedIngredients.map((ing, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_130px_auto]">
                  <select value={ing.ingredient} onChange={event => handleIngredientChange(index, 'ingredient', event.target.value)} className={inputClass}>
                    <option value="">Chọn nguyên liệu</option>
                    {ingredientsList.map(item => <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>)}
                  </select>
                  <input type="number" min="0" step="any" placeholder="Số lượng" value={ing.quantity} onChange={event => handleIngredientChange(index, 'quantity', event.target.value)} className={inputClass} />
                  <button type="button" onClick={() => removeRow(index)} className="rounded-xl bg-red-50 px-3 py-3 text-xs font-black text-red-600">
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={onCancel} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">
              Hủy
            </button>
            <button type="submit" disabled={uploading} className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              {uploading ? 'Đang upload ảnh...' : 'Lưu món'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-black uppercase tracking-wider text-gray-500">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#c0392b] focus:ring-2 focus:ring-red-100';
const fileClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-[#c70d1a]';

export default MenuForm;
