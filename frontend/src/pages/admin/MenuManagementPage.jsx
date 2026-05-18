import React, { useState, useEffect } from 'react';
import menuService from '../../services/menuService';
import MenuForm from '../../components/MenuForm';
import { getImageUrl } from '../../utils/imageUrl';

const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // món đang sửa
  const [showForm, setShowForm] = useState(false); // điều khiển ẩn/hiện form

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const data = await menuService.getMenuItems();
      setMenuItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Mở form thêm mới
  const handleAddNew = () => {
    setSelected(null); // không có món => thêm mới
    setShowForm(true);
  };

  // Mở form sửa
  const handleEdit = (item) => {
    setSelected(item);
    setShowForm(true);
  };

  // Xử lý khi form submit (thêm hoặc sửa)
  const handleFormSubmit = async (formData) => {
    try {
      if (selected) {
        // Cập nhật món
        const updated = await menuService.updateMenuItem(selected._id, formData);
        setMenuItems(menuItems.map(item => item._id === updated._id ? updated : item));
      } else {
        // Thêm mới
        const created = await menuService.createMenuItem(formData);
        setMenuItems([...menuItems, created]);
      }
      // Ẩn form sau khi lưu thành công
      setShowForm(false);
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu món');
    }
  };

  // Hủy form
  const handleCancel = () => {
    setShowForm(false);
    setSelected(null);
  };

  // Xóa món
  const handleDelete = async (id) => {
    if (window.confirm('Xóa món này?')) {
      await menuService.deleteMenuItem(id);
      setMenuItems(menuItems.filter(item => item._id !== id));
      if (selected?._id === id) {
        setShowForm(false);
        setSelected(null);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Quản lý Thực đơn</h2>

      {/* Nút Thêm món chỉ hiển thị khi form đang ẩn */}
      {!showForm && (
        <button
          onClick={handleAddNew}
          style={{
            background: '#e74c3c', color: 'white', border: 'none',
            padding: '10px 25px', borderRadius: '4px', fontWeight: 'bold',
            marginBottom: '20px', cursor: 'pointer'
          }}
        >
          + Thêm món mới
        </button>
      )}

      {/* Form Thêm/Sửa (ẩn/hiện theo showForm) */}
      {showForm && (
        <div style={{
          background: '#fff', padding: '20px', borderRadius: '8px',
          marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>
            {selected ? 'Sửa món' : 'Thêm món mới'}
          </h3>
          <MenuForm
            menuItem={selected}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Bảng danh sách món */}
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <p style={{ padding: '20px' }}>Đang tải...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={thStyle}>Ảnh</th>
                <th style={thStyle}>Tên món</th>
                <th style={thStyle}>Danh mục</th>
                <th style={thStyle}>Giá</th>
                <th style={thStyle}>Nguyên liệu</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>
                    {item.image ? (
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      <span style={{ color: '#999' }}>Chưa có</span>
                    )}
                  </td>
                  <td style={tdStyle}>{item.name}</td>
                  <td style={tdStyle}>{item.category}</td>
                  <td style={tdStyle}>{item.price.toLocaleString()}₫</td>
                  <td style={{ ...tdStyle, fontSize: '13px' }}>
                    {item.ingredients?.map(ing => {
                      const name = ing.ingredient?.name || '?';
                      const qty = ing.quantity;
                      const unit = ing.ingredient?.unit || '';
                      return `${name} (${qty} ${unit})`;
                    }).join(', ')}
                  </td>
                  <td style={{ ...tdStyle, color: '#2ecc71' }}>Đang bán</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleEdit(item)}
                      style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '3px', marginRight: '5px' }}>
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(item._id)}
                      style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '3px' }}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {menuItems.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    Chưa có món nào trong thực đơn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '14px'
};
const tdStyle = {
  padding: '10px 8px',
  fontSize: '14px',
  verticalAlign: 'middle'
};

export default MenuManagementPage;
