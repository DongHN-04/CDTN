import React, { useState, useEffect } from 'react';
import supplierService from '../services/supplierService';
import inventoryService from '../services/inventoryService';

const PurchaseForm = ({ onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([{ ingredient: '', quantity: 0, unitPrice: 0 }]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supplierService.getSuppliers().then(setSuppliers);
    inventoryService.getIngredients().then(list => {
      // Lọc bỏ các nguyên liệu không có _id (bảo vệ)
      setIngredients(list.filter(item => item && item._id));
    });
  }, []);

  const addRow = () => setItems([...items, { ingredient: '', quantity: 0, unitPrice: 0 }]);
  const removeRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const handleItemChange = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return alert('Chọn nhà cung cấp');
    try {
      await supplierService.createPurchase({
        supplierId: selectedSupplier,
        items: items.map(it => ({
          ingredient: it.ingredient,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
        paidAmount: Number(paidAmount),
        notes,
        purchaseDate: new Date().toISOString(),
      });
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi nhập hàng');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '90%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}>
        <h3>Nhập hàng</h3>
        <form onSubmit={handleSubmit}>
          <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} style={inputStyle} required>
            <option value="">-- Chọn nhà cung cấp --</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <select value={item.ingredient} onChange={e => handleItemChange(idx, 'ingredient', e.target.value)} style={inputStyle} required>
                <option value="">-- Chọn nguyên liệu --</option>
                {ingredients.map(ing => ing && (
                  <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <input type="number" placeholder="SL" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Đơn giá" value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} style={inputStyle} />
              <button type="button" onClick={() => removeRow(idx)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Xóa</button>
            </div>
          ))}
          <button type="button" onClick={addRow} style={{ marginBottom: 10, background: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>+ Thêm dòng</button>

          <input type="number" placeholder="Thanh toán trước" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} style={inputStyle} />
          <textarea placeholder="Ghi chú" value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} rows={2} />

          <div style={{ textAlign: 'right' }}>
            <button type="submit" style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10 }}>Lưu</button>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputStyle = { padding: 8, borderRadius: 4, border: '1px solid #ccc' };

export default PurchaseForm;