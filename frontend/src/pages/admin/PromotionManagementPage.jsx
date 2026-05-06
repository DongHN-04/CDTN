import React, { useState, useEffect } from 'react';
import promotionService from '../../services/promotionService';

const PromotionManagementPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', type: 'percent', value: 0,
    minOrderValue: 0, startDate: '', endDate: '', isActive: true
  });

  useEffect(() => {
    promotionService.getPromotions().then(data => setPromotions(data)).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', type: 'percent', value: 0, minOrderValue: 0, startDate: '', endDate: '', isActive: true });
    setEditingId(null);
  };

  const handleEdit = (promo) => {
    setEditingId(promo._id);
    setForm({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      value: promo.value,
      minOrderValue: promo.minOrderValue,
      startDate: promo.startDate?.slice(0,10),
      endDate: promo.endDate?.slice(0,10),
      isActive: promo.isActive
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa khuyến mãi?')) {
      await promotionService.deletePromotion(id);
      setPromotions(promotions.filter(p => p._id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await promotionService.updatePromotion(editingId, form);
        setPromotions(promotions.map(p => p._id === updated._id ? updated : p));
      } else {
        const created = await promotionService.createPromotion(form);
        setPromotions([...promotions, created]);
      }
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý Khuyến mãi</h2>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h3>{editingId ? 'Sửa' : 'Thêm'} khuyến mãi</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <input placeholder="Tên chương trình" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={inputStyle} />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
            <option value="percent">Giảm %</option>
            <option value="fixed">Giảm tiền</option>
            <option value="buyXgetY">Mua X tặng Y</option>
          </select>
          <input type="number" placeholder="Giá trị" value={form.value} onChange={e => setForm({...form, value: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="Đơn tối thiểu" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: e.target.value})} style={inputStyle} />
          <div>
            <label>Từ ngày:</label>
            <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required style={inputStyle} />
          </div>
          <div>
            <label>Đến ngày:</label>
            <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required style={inputStyle} />
          </div>
          <label>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} /> Kích hoạt
          </label>
          <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
            <button type="submit" style={btnPrimary}>{editingId ? 'Cập nhật' : 'Tạo'}</button>
            {editingId && <button type="button" onClick={resetForm} style={btnSecondary}>Hủy</button>}
          </div>
        </form>
      </div>

      {loading ? <p>Đang tải...</p> : (
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>Tên</th><th>Loại</th><th>Giá trị</th><th>Đơn tối thiểu</th><th>Hiệu lực</th><th>Trạng thái</th><th></th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{p.name}</td>
                <td>{p.type === 'percent' ? '%' : p.type === 'fixed' ? 'VNĐ' : 'Tặng'}</td>
                <td>{p.value}</td>
                <td>{p.minOrderValue?.toLocaleString()}₫</td>
                <td>{p.startDate?.slice(0,10)} - {p.endDate?.slice(0,10)}</td>
                <td style={{ color: p.isActive ? 'green' : 'red' }}>{p.isActive ? 'Hoạt động' : 'Tắt'}</td>
                <td>
                  <button onClick={() => handleEdit(p)} style={{ marginRight: 5 }}>Sửa</button>
                  <button onClick={() => handleDelete(p._id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const inputStyle = { padding: 8, border: '1px solid #ccc', borderRadius: 4 };
const btnPrimary = { padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10 };
const btnSecondary = { padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };

export default PromotionManagementPage;