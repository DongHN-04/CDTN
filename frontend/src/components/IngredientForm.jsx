import React, { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const emptyForm = { name: '', stock: 0, unit: '', pricePerUnit: 0 };
const MAX_MONEY = 100000000;
const MAX_QUANTITY = 100000;

const IngredientForm = ({ ingredient, onSubmit, onCancel }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(ingredient ? {
      name: ingredient.name || '',
      stock: ingredient.stock ?? 0,
      unit: ingredient.unit || '',
      pricePerUnit: ingredient.pricePerUnit ?? 0,
    } : emptyForm);
  }, [ingredient]);

  const handleChange = event => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = event => {
    event.preventDefault();
    if (!form.name.trim()) return showToast('Tên nguyên liệu là bắt buộc', 'error');
    if (!form.unit.trim()) return showToast('Đơn vị tính là bắt buộc', 'error');
    if (Number(form.stock) < 0 || Number(form.stock) > MAX_QUANTITY) return showToast('Tồn kho phải từ 0 đến 100.000', 'error');
    if (Number(form.pricePerUnit) <= 0 || Number(form.pricePerUnit) > MAX_MONEY) return showToast('Giá nhập phải lớn hơn 0 và không vượt quá 100.000.000', 'error');

    onSubmit({
      ...form,
      stock: Number(form.stock),
      pricePerUnit: Number(form.pricePerUnit),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-black text-gray-950">{ingredient ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">Cập nhật tồn kho, đơn vị tính và giá nhập.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên nguyên liệu">
            <input name="name" value={form.name} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Đơn vị tính">
            <input name="unit" value={form.unit} onChange={handleChange} className={inputClass} placeholder="kg, lon, cai..." />
          </Field>
          <Field label="Tồn kho">
            <input name="stock" type="number" min="0" step="any" value={form.stock} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Giá nhập / đơn vị">
            <input name="pricePerUnit" type="number" min="0" value={form.pricePerUnit} onChange={handleChange} className={inputClass} />
          </Field>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 sm:col-span-2">
            <button type="button" onClick={onCancel} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">
              Hủy
            </button>
            <button type="submit" className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white">
              Lưu
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

export default IngredientForm;
