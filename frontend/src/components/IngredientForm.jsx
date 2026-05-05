import React, { useState, useEffect } from 'react';

const IngredientForm = ({ ingredient, onSubmit, onCancel }) => {
  const [form, setForm] = useState({ name: '', stock: 0, unit: '', pricePerUnit: 0 });

  useEffect(() => {
    if (ingredient) setForm({ name: ingredient.name, stock: ingredient.stock, unit: ingredient.unit, pricePerUnit: ingredient.pricePerUnit });
    else setForm({ name: '', stock: 0, unit: '', pricePerUnit: 0 });
  }, [ingredient]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.unit) return alert('Tên và đơn vị là bắt buộc');
    onSubmit(form);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 300 }}>
        <h3>{ingredient ? 'Sửa' : 'Thêm'} nguyên liệu</h3>
        <form onSubmit={handleSubmit}>
          <label>Tên:</label><input name="name" value={form.name} onChange={handleChange} required /><br/>
          <label>Tồn kho:</label><input name="stock" type="number" value={form.stock} onChange={handleChange} /><br/>
          <label>Đơn vị:</label><input name="unit" value={form.unit} onChange={handleChange} required /><br/>
          <label>Giá nhập/đơn vị:</label><input name="pricePerUnit" type="number" value={form.pricePerUnit} onChange={handleChange} /><br/>
          <button type="submit">Lưu</button>
          <button type="button" onClick={onCancel}>Hủy</button>
        </form>
      </div>
    </div>
  );
};
export default IngredientForm;