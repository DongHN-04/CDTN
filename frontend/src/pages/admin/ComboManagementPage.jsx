import React, { useState, useEffect } from 'react';
import comboService from '../../services/comboService';
import menuService from '../../services/menuService';

const ComboManagementPage = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: 0, image: '', isActive: true,
    items: [] // [{ menuItem: '', quantity: 1 }]
  });
  const [allMenuItems, setAllMenuItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [combosData, menuData] = await Promise.all([
        comboService.getCombos(),
        menuService.getMenuItems()
      ]);
      setCombos(combosData);
      setAllMenuItems(menuData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', price: 0, image: '', isActive: true, items: [] });
    setEditingId(null);
  };

  const handleEdit = (combo) => {
    setEditingId(combo._id);
    setForm({
      name: combo.name,
      description: combo.description || '',
      price: combo.price,
      image: combo.image || '',
      isActive: combo.isActive,
      items: combo.items.map(it => ({
        menuItem: it.menuItem._id || it.menuItem,
        quantity: it.quantity
      }))
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa combo?')) {
      await comboService.deleteCombo(id);
      setCombos(combos.filter(c => c._id !== id));
    }
  };

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { menuItem: '', quantity: 1 }] });
  };

  const handleRemoveItem = (idx) => {
    const newItems = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items: newItems });
  };

  const handleItemChange = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || form.items.length === 0) {
      return alert('Tên, giá và ít nhất một món là bắt buộc');
    }
    try {
      if (editingId) {
        const updated = await comboService.updateCombo(editingId, form);
        setCombos(combos.map(c => c._id === updated._id ? updated : c));
      } else {
        const created = await comboService.createCombo(form);
        setCombos([...combos, created]);
      }
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi lưu combo');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý Combo/Set Menu</h2>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h3>{editingId ? 'Sửa' : 'Thêm'} combo</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label>Tên combo</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label>Giá combo (VND)</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} required style={inputStyle} />
            </div>
            <div>
              <label>Mô tả</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} rows={2} />
            </div>
            <div>
              <label>Ảnh URL</label>
              <input value={form.image} onChange={e => setForm({...form, image: e.target.value})} style={inputStyle} placeholder="http://..." />
            </div>
          </div>

          <div>
            <label>Danh sách món trong combo:</label>
            {form.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 5, alignItems: 'center' }}>
                <select
                  value={item.menuItem}
                  onChange={e => handleItemChange(idx, 'menuItem', e.target.value)}
                  required
                  style={{ flex: 2, ...inputStyle }}
                >
                  <option value="">-- Chọn món --</option>
                  {allMenuItems.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.price.toLocaleString()}₫)</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="SL"
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                  min={1}
                  style={{ width: 80, ...inputStyle }}
                />
                <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '5px 10px' }}>Xóa</button>
              </div>
            ))}
            <button type="button" onClick={handleAddItem} style={{ background: '#2ecc71', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '8px 15px', marginTop: 5 }}>
              + Thêm món
            </button>
          </div>

          <label>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} /> Kích hoạt
          </label>

          <div style={{ textAlign: 'right' }}>
            <button type="submit" style={btnPrimary}>{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
            {editingId && <button type="button" onClick={resetForm} style={btnSecondary}>Hủy</button>}
          </div>
        </form>
      </div>

      {loading ? <p>Đang tải...</p> : (
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>Tên</th><th>Giá</th><th>Món</th><th>Trạng thái</th><th></th>
            </tr>
          </thead>
          <tbody>
            {combos.map(c => (
              <tr key={c._id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{c.name}</td>
                <td>{c.price?.toLocaleString()}₫</td>
                <td>
                  {c.items?.map(it => (
                    <div key={it._id || it.menuItem?._id || it.menuItem}>
                      {it.menuItem?.name || '?'} x{it.quantity}
                    </div>
                  ))}
                </td>
                <td style={{ color: c.isActive ? 'green' : 'red' }}>{c.isActive ? 'Hoạt động' : 'Tắt'}</td>
                <td>
                  <button onClick={() => handleEdit(c)} style={{ marginRight: 5 }}>Sửa</button>
                  <button onClick={() => handleDelete(c._id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const inputStyle = { padding: 8, border: '1px solid #ccc', borderRadius: 4, width: '100%' };
const btnPrimary = { padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10 };
const btnSecondary = { padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };

export default ComboManagementPage;