import React, { useEffect, useState } from 'react';
import { ErrorBox } from '../utils/apiError';

const emptyForm = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

const SupplierForm = ({ supplier, onSubmit, onCancel, error }) => {
  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setForm(supplier ? {
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    } : emptyForm);
    setLocalError('');
  }, [supplier]);

  const handleChange = event => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = event => {
    event.preventDefault();
    setLocalError('');
    if (!form.name.trim()) return setLocalError('name: Tên nhà cung cấp là bắt buộc');
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-black text-gray-950">{supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">Lưu thông tin liên hệ và ghi chú làm việc với nhà cung cấp.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">
            Đóng
          </button>
        </div>

        <ErrorBox message={localError || error} />

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên nhà cung cấp">
            <input name="name" value={form.name} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Người liên hệ">
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Số điện thoại">
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Địa chỉ">
            <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Ghi chú">
            <textarea name="notes" value={form.notes} onChange={handleChange} className={`${inputClass} min-h-[90px] resize-none`} />
          </Field>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 md:col-span-2">
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

export default SupplierForm;
