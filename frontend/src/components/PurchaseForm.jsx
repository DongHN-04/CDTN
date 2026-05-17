import React, { useState, useEffect } from 'react';
import supplierService from '../services/supplierService';
import inventoryService from '../services/inventoryService';
import { ErrorBox, formatApiError } from '../utils/apiError';

const PurchaseForm = ({ onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([{ ingredient: '', quantity: '', unitPrice: '' }]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    supplierService.getSuppliers().then(setSuppliers);
    inventoryService.getIngredients().then(list => {
      setIngredients(list.filter(item => item && item._id));
    });
  }, []);

  const addRow = () => setItems([...items, { ingredient: '', quantity: '', unitPrice: '' }]);
  const removeRow = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleItemChange = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const buildPayloadItems = () => {
    return items
      .map(it => ({
        ingredient: it.ingredient,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      }))
      // Bo qua dong rong hoan toan, tranh gui ingredient rong/quantity 0 len backend.
      .filter(it => it.ingredient || it.quantity || it.unitPrice);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedSupplier) return setFormError('supplierId: Chon nha cung cap');

    const payloadItems = buildPayloadItems();
    if (payloadItems.length === 0) {
      return setFormError('items: Vui long them it nhat mot nguyen lieu');
    }

    const invalidItem = payloadItems.find(item =>
      !item.ingredient ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0
    );

    if (invalidItem) {
      return setFormError('items: Moi dong nhap hang phai chon nguyen lieu, so luong > 0 va don gia >= 0');
    }

    try {
      await supplierService.createPurchase({
        supplierId: selectedSupplier,
        items: payloadItems,
        paidAmount: Number(paidAmount || 0),
        notes,
        purchaseDate: new Date().toISOString(),
      });
      onSuccess();
    } catch (error) {
      setFormError(formatApiError(error, 'Loi nhap hang'));
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>Nhap hang</h3>
        <ErrorBox message={formError} />
        <form onSubmit={handleSubmit}>
          <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} style={inputStyle} required>
            <option value="">-- Chon nha cung cap --</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          {items.map((item, idx) => (
            <div key={idx} style={rowStyle}>
              <select value={item.ingredient} onChange={e => handleItemChange(idx, 'ingredient', e.target.value)} style={inputStyle}>
                <option value="">-- Chon nguyen lieu --</option>
                {ingredients.map(ing => (
                  <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="SL"
                value={item.quantity}
                onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Don gia"
                value={item.unitPrice}
                onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                style={inputStyle}
              />
              <button type="button" onClick={() => removeRow(idx)} style={deleteButtonStyle}>Xoa</button>
            </div>
          ))}

          <button type="button" onClick={addRow} style={addButtonStyle}>+ Them dong</button>

          <input
            type="number"
            min="0"
            step="any"
            placeholder="Thanh toan truoc"
            value={paidAmount}
            onChange={e => setPaidAmount(e.target.value)}
            style={inputStyle}
          />
          <textarea placeholder="Ghi chu" value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} rows={2} />

          <div style={{ textAlign: 'right' }}>
            <button type="submit" style={saveButtonStyle}>Luu</button>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>Huy</button>
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

const modalStyle = {
  background: 'white',
  padding: 20,
  borderRadius: 8,
  width: '90%',
  maxWidth: 700,
  maxHeight: '80vh',
  overflow: 'auto',
};

const rowStyle = { display: 'flex', gap: 10, marginBottom: 10 };
const inputStyle = { padding: 8, borderRadius: 4, border: '1px solid #ccc' };
const addButtonStyle = { marginBottom: 10, background: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' };
const deleteButtonStyle = { background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
const saveButtonStyle = { padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10 };
const cancelButtonStyle = { padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };

export default PurchaseForm;
