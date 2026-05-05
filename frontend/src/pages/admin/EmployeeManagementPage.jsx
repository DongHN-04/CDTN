import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import EmployeeForm from '../../components/EmployeeForm'; // sẽ tạo sau

const EmployeeManagementPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null); // user đang sửa
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setEmployees(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách nhân viên');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      try {
        await userService.deleteUser(id);
        setEmployees(employees.filter(emp => emp._id !== id));
      } catch (err) {
        alert('Xóa thất bại');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingUser(null); // không có user => thêm mới
    setShowForm(true);
  };

  const handleFormSubmit = async (userData) => {
    try {
      if (editingUser) {
        // Cập nhật
        const updated = await userService.updateUser(editingUser._id, userData);
        setEmployees(employees.map(emp => (emp._id === updated._id ? updated : emp)));
      } else {
        // Tạo mới
        const newUser = await userService.createUser(userData);
        setEmployees([...employees, newUser]);
      }
      setShowForm(false);
      setEditingUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <h2>Quản lý Nhân sự</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={handleAddNew} style={{ marginBottom: '15px', padding: '8px 16px' }}>
        + Thêm nhân viên
      </button>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>SĐT</th>
              <th>Địa chỉ</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp._id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.role}</td>
                <td>{emp.phone || '-'}</td>
                <td>{emp.address || '-'}</td>
                <td>
                  <button onClick={() => handleEdit(emp)}>Sửa</button>
                  <button onClick={() => handleDelete(emp._id)} style={{ marginLeft: '5px' }}>Xóa</button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>Chưa có nhân viên nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <EmployeeForm
          user={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployeeManagementPage;