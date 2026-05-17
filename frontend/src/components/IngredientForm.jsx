import React, { useState, useEffect } from 'react';
import { ErrorBox } from '../utils/apiError';

const IngredientForm = ({ ingredient, onSubmit, onCancel, error }) => {
  const [form, setForm] = useState({ name: '', stock: 0, unit: '', pricePerUnit: 0 });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (ingredient) {
      setForm({
        name: ingredient.name || '',
        stock: ingredient.stock ?? 0,
        unit: ingredient.unit || '',
        pricePerUnit: ingredient.pricePerUnit ?? 0,
      });
    } else {
      setForm({ name: '', stock: 0, unit: '', pricePerUnit: 0 });
    }
    setLocalError('');
  }, [ingredient]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    setLocalError('');

    if (!form.name.trim()) return setLocalError('name: Ten nguyen lieu la bat buoc');
    if (!form.unit.trim()) return setLocalError('unit: Don vi tinh la bat buoc');
    if (Number(form.stock) < 0) return setLocalError('stock: Ton kho phai >= 0');
    if (Number(form.pricePerUnit) < 0) return setLocalError('pricePerUnit: Gia nhap phai >= 0');

    onSubmit({
      ...form,
      stock: Number(form.stock),
      pricePerUnit: Number(form.pricePerUnit),
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{ingredient ? 'Sua' : 'Them'} nguyen lieu</h3>
        <ErrorBox message={localError || error} />
        <form onSubmit={handleSubmit}>
          <label>Ten:</label>
          <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />

          <label>Ton kho:</label>
          <input name="stock" type="number" value={form.stock} onChange={handleChange} style={inputStyle} />

          <label>Don vi:</label>
          <input name="unit" value={form.unit} onChange={handleChange} style={inputStyle} />

          <label>Gia nhap/don vi:</label>
          <input name="pricePerUnit" type="number" value={form.pricePerUnit} onChange={handleChange} style={inputStyle} />

          <div style={{ marginTop: 12 }}>
            <button type="submit" style={primaryButtonStyle}>Luu</button>
            <button type="button" onClick={onCancel} style={secondaryButtonStyle}>Huy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle = { background: '#fff', padding: 20, borderRadius: 8, minWidth: 320 };
const inputStyle = { display: 'block', width: '100%', marginBottom: 8, padding: 8, border: '1px solid #ccc', borderRadius: 4 };
const primaryButtonStyle = { padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 };
const secondaryButtonStyle = { padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };

export default IngredientForm;
