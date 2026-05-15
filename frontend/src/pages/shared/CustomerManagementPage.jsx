import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';

const CustomerManagementPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', type: 'Regular', notes: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', type: 'Regular', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (customer) => {
    setEditingId(customer._id);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      type: customer.type,
      notes: customer.notes || '',
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa khách hàng này?')) {
      await customerService.deleteCustomer(id);
      fetchCustomers();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert('Tên khách hàng là bắt buộc');
    try {
      if (editingId) {
        await customerService.updateCustomer(editingId, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      resetForm();
      fetchCustomers();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi lưu khách hàng');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Quản lý Khách hàng</h2>

      {/* Form thêm/sửa */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>{editingId ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Tên *"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            style={inputStyle}
          />
          <select
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            style={inputStyle}
          >
            <option value="Regular">Thường</option>
            <option value="VIP">VIP</option>
          </select>
          <textarea
            placeholder="Ghi chú"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            style={{ gridColumn: 'span 2', ...inputStyle }}
            rows={2}
          />
          <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
            <button type="submit" style={buttonPrimaryStyle}>
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={buttonSecondaryStyle}>
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bảng danh sách */}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={thStyle}>Tên</th>
              <th style={thStyle}>SĐT</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Loại</th>
              <th style={thStyle}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{c.phone || '-'}</td>
                <td style={tdStyle}>{c.email || '-'}</td>
                <td style={tdStyle}>
                  <span style={{ color: c.type === 'VIP' ? '#e67e22' : '#2ecc71' }}>{c.type}</span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(c)} style={editBtnStyle}>Sửa</button>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(c._id)} style={deleteBtnStyle}>Xóa</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Styles
const inputStyle = {
  padding: '8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
};

const buttonPrimaryStyle = {
  padding: '10px 20px',
  background: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '10px',
};

const buttonSecondaryStyle = {
  padding: '10px 20px',
  background: '#95a5a6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const thStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tdStyle = {
  padding: '10px 8px',
};

const editBtnStyle = {
  background: '#f39c12',
  border: 'none',
  color: 'white',
  padding: '5px 12px',
  borderRadius: '3px',
  marginRight: '5px',
  cursor: 'pointer',
};

const deleteBtnStyle = {
  background: '#e74c3c',
  border: 'none',
  color: 'white',
  padding: '5px 12px',
  borderRadius: '3px',
  cursor: 'pointer',
};

export default CustomerManagementPage;