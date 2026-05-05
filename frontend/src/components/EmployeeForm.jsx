import React, { useState, useEffect } from 'react';

const EmployeeForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // không hiển thị mật khẩu cũ
        role: user.role || 'staff',
        phone: user.phone || '',
        address: user.address || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        phone: '',
        address: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Kiểm tra dữ liệu cơ bản
    if (!formData.name || !formData.email) {
      alert('Tên và email là bắt buộc');
      return;
    }
    // Nếu thêm mới hoặc có nhập mật khẩu mới
    const submitData = { ...formData };
    if (!user && !submitData.password) {
      alert('Mật khẩu là bắt buộc cho nhân viên mới');
      return;
    }
    if (user && !submitData.password) {
      delete submitData.password; // không gửi password nếu không muốn đổi
    }
    onSubmit(submitData);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{user ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Tên:</label>
          <input name="name" value={formData.name} onChange={handleChange} required /><br />

          <label>Email:</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required /><br />

          <label>Mật khẩu {user && '(để trống nếu không đổi)'}:</label>
          <input name="password" type="password" value={formData.password} onChange={handleChange} /><br />

          <label>Vai trò:</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select><br />

          <label>SĐT:</label>
          <input name="phone" value={formData.phone} onChange={handleChange} /><br />

          <label>Địa chỉ:</label>
          <input name="address" value={formData.address} onChange={handleChange} /><br />

          <div style={{ marginTop: '10px' }}>
            <button type="submit">Lưu</button>
            <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000,
};

const modalStyle = {
  backgroundColor: 'white', padding: '20px', borderRadius: '8px',
  width: '400px', maxWidth: '90%',
};

export default EmployeeForm;