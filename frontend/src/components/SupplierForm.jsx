import React, { useState, useEffect } from 'react';

const SupplierForm = ({ supplier, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', notes: ''
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
    }
  }, [supplier]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h3>
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Tên *" value={form.name} onChange={handleChange} required style={inputStyle} />
          <input name="contactPerson" placeholder="Người liên hệ" value={form.contactPerson} onChange={handleChange} style={inputStyle} />
          <input name="phone" placeholder="SĐT" value={form.phone} onChange={handleChange} style={inputStyle} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={inputStyle} />
          <input name="address" placeholder="Địa chỉ" value={form.address} onChange={handleChange} style={inputStyle} />
          <textarea name="notes" placeholder="Ghi chú" value={form.notes} onChange={handleChange} style={inputStyle} rows={2} />
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <button type="submit" style={btnPrimary}>Lưu</button>
            <button type="button" onClick={onCancel} style={btnSecondary}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', padding: 20, borderRadius: 8, width: '90%', maxWidth: 500 };
const inputStyle = { display: 'block', width: '100%', marginBottom: 10, padding: 8, borderRadius: 4, border: '1px solid #ccc' };
const btnPrimary = { padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10 };
const btnSecondary = { padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };

export default SupplierForm;