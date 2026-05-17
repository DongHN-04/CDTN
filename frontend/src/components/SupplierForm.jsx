import React, { useState, useEffect } from 'react';
import { ErrorBox } from '../utils/apiError';

const SupplierForm = ({ supplier, onSubmit, onCancel, error }) => {
  const [form, setForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', notes: ''
  });
  const [localError, setLocalError] = useState('');

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
    } else {
      setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' });
    }
    setLocalError('');
  }, [supplier]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    setLocalError('');
    if (!form.name.trim()) return setLocalError('name: Ten nha cung cap la bat buoc');
    onSubmit(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{supplier ? 'Sua nha cung cap' : 'Them nha cung cap'}</h3>
        <ErrorBox message={localError || error} />
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Ten *" value={form.name} onChange={handleChange} style={inputStyle} />
          <input name="contactPerson" placeholder="Nguoi lien he" value={form.contactPerson} onChange={handleChange} style={inputStyle} />
          <input name="phone" placeholder="SDT" value={form.phone} onChange={handleChange} style={inputStyle} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={inputStyle} />
          <input name="address" placeholder="Dia chi" value={form.address} onChange={handleChange} style={inputStyle} />
          <textarea name="notes" placeholder="Ghi chu" value={form.notes} onChange={handleChange} style={inputStyle} rows={2} />
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <button type="submit" style={btnPrimary}>Luu</button>
            <button type="button" onClick={onCancel} style={btnSecondary}>Huy</button>
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
