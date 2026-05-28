import React, { useEffect, useState } from 'react';
import supplierService from '../services/supplierService';
import inventoryService from '../services/inventoryService';
import { formatApiError } from '../utils/apiError';
import { useToast } from '../contexts/ToastContext';

const emptyItem = { ingredient: '', quantity: '', unitPrice: '' };
const MAX_MONEY = 100000000;
const MAX_QUANTITY = 100000;

const PurchaseForm = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([emptyItem]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supplierService.getSuppliers().then(data => setSuppliers(data || []));
    inventoryService.getIngredients().then(list => {
      setIngredients((list || []).filter(item => item && item._id));
    });
  }, []);

  const addRow = () => setItems(current => [...current, emptyItem]);
  const removeRow = index => setItems(current => current.filter((_, itemIndex) => itemIndex !== index));

  const handleItemChange = (index, field, value) => {
    setItems(current => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const buildPayloadItems = () => (
    items
      .map(item => ({
        ingredient: item.ingredient,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))
      .filter(item => item.ingredient || item.quantity || item.unitPrice)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSupplier) return showToast('Chọn nhà cung cấp là bắt buộc', 'error');

    const payloadItems = buildPayloadItems();
    if (payloadItems.length === 0) return showToast('Vui lòng thêm ít nhất một nguyên liệu', 'error');
    const duplicatedIngredient = payloadItems.find((item, index) => (
      item.ingredient && payloadItems.findIndex(other => other.ingredient === item.ingredient) !== index
    ));
    if (duplicatedIngredient) return showToast('Nguyên liệu bị lặp trong phiếu nhập', 'error');

    const invalidItem = payloadItems.find(item =>
      !item.ingredient ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > MAX_QUANTITY ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice <= 0 ||
      item.unitPrice > MAX_MONEY
    );

    if (invalidItem) {
      return showToast('Mỗi dòng nhập hàng phải chọn nguyên liệu, số lượng > 0 và đơn giá > 0', 'error');
    }

    const paid = Number(paidAmount || 0);
    if (!Number.isFinite(paid) || paid < 0 || paid > MAX_MONEY) {
      return showToast('Số tiền đã trả không hợp lệ', 'error');
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
      const message = formatApiError(error, 'Lỗi nhập hàng');
      showToast(message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-black text-gray-950">Nhập hàng</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">Ghi nhận nguyên liệu nhập kho, đơn giá và số tiền đã thanh toán.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          <Field label="Nhà cung cấp">
            <select value={selectedSupplier} onChange={event => setSelectedSupplier(event.target.value)} className={inputClass} required>
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map(supplier => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
            </select>
          </Field>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="m-0 text-sm font-black text-gray-900">Nguyên liệu nhập</h3>
              <button type="button" onClick={addRow} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                + Thêm dòng
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_120px_150px_auto]">
                  <select value={item.ingredient} onChange={event => handleItemChange(index, 'ingredient', event.target.value)} className={inputClass}>
                    <option value="">Chọn nguyên liệu</option>
                    {ingredients.map(ingredient => (
                      <option key={ingredient._id} value={ingredient._id}>{ingredient.name} ({ingredient.unit})</option>
                    ))}
                  </select>
                  <input type="number" min="0" step="any" placeholder="Số lượng" value={item.quantity} onChange={event => handleItemChange(index, 'quantity', event.target.value)} className={inputClass} />
                  <input type="number" min="0" step="any" placeholder="Đơn giá" value={item.unitPrice} onChange={event => handleItemChange(index, 'unitPrice', event.target.value)} className={inputClass} />
                  <button type="button" onClick={() => removeRow(index)} disabled={items.length === 1} className="rounded-xl bg-red-50 px-3 py-3 text-xs font-black text-red-600 disabled:cursor-not-allowed disabled:opacity-40">
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Thanh toán trước">
              <input type="number" min="0" step="any" value={paidAmount} onChange={event => setPaidAmount(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Ghi chú">
              <textarea value={notes} onChange={event => setNotes(event.target.value)} className={`${inputClass} min-h-[90px] resize-none`} />
            </Field>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">
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

export default PurchaseForm;
