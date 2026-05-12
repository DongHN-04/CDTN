import React, { useState, useEffect, useCallback } from 'react';
import shiftService from '../../services/shiftService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

const ShiftManagementPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [form, setForm] = useState({ name: '', startTime: '', endTime: '' });
  const [selectedShiftForAssign, setSelectedShiftForAssign] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const fetchShifts = useCallback(async () => {
    try {
      let data;
      if (isAdmin) {
        data = await shiftService.getShifts();
      } else {
        data = await shiftService.getMyShifts();
      }
      setShifts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchStaff = useCallback(async () => {
    try {
      const users = await userService.getUsers();
      setStaffList(users.filter(u => u.role === 'staff' || u.role === 'admin'));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
    if (isAdmin) fetchStaff();
  }, [fetchShifts, fetchStaff, isAdmin]);

  const resetForm = () => {
    setForm({ name: '', startTime: '', endTime: '' });
    setEditingShift(null);
    setShowForm(false);
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setForm({
      name: shift.name,
      startTime: shift.startTime?.slice(0, 16),
      endTime: shift.endTime?.slice(0, 16),
    });
    setShowForm(true);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingShift) {
        await shiftService.updateShift(editingShift._id, form);
      } else {
        await shiftService.createShift(form);
      }
      resetForm();
      fetchShifts();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa ca này?')) {
      try {
        await shiftService.deleteShift(id);
        fetchShifts();
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi xóa');
      }
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      alert('Vui lòng chọn nhân viên');
      return;
    }
    try {
      await shiftService.assignStaff(selectedShiftForAssign._id, selectedStaffId);
      setSelectedShiftForAssign(null);
      setSelectedStaffId('');
      fetchShifts();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi phân ca');
    }
  };

  const handleCloseShift = async (shift) => {
    const confirmMsg = `Đóng ca "${shift.name}"?\nBắt đầu: ${new Date(shift.startTime).toLocaleString()}\nKết thúc dự kiến: ${shift.endTime ? new Date(shift.endTime).toLocaleString() : 'Chưa có'}\nNhân viên: ${shift.staff?.map(s => s.name).join(', ') || 'Chưa có'}`;
    if (!window.confirm(confirmMsg)) return;

    const actualCash = prompt('Nhập tổng tiền mặt thực tế (VNĐ):', '0');
    if (actualCash === null) return;

    const endTime = new Date().toISOString();
    try {
      const closedShift = await shiftService.closeShift(shift._id, {
        endTime,
        actualCash: Number(actualCash),
      });
      alert(
        `✅ Đã đóng ca "${closedShift.name}"\n` +
        `Tổng tiền mặt hệ thống: ${closedShift.totalCash?.toLocaleString()}₫\n` +
        `Tiền thực tế: ${closedShift.actualCash?.toLocaleString()}₫\n` +
        `Chênh lệch: ${closedShift.difference?.toLocaleString()}₫`
      );
      fetchShifts();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi đóng ca');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Quản lý Ca làm việc {!isAdmin && '(Ca của tôi)'}</h2>

      {isAdmin && (
        <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>
          + Mở ca mới
        </button>
      )}

      {/* Modal thêm/sửa ca (chỉ Admin) */}
      {isAdmin && showForm && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{editingShift ? 'Sửa ca' : 'Mở ca mới'}</h3>
            <form onSubmit={handleCreateOrUpdate}>
              <input type="text" placeholder="Tên ca" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
              <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required style={inputStyle} />
              <input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required style={inputStyle} />
              <button type="submit" style={btnPrimary}>Lưu</button>
              <button type="button" onClick={resetForm} style={btnSecondary}>Hủy</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal phân ca (chỉ Admin) */}
      {isAdmin && selectedShiftForAssign && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Phân ca cho "{selectedShiftForAssign.name}"</h3>
            <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} style={inputStyle}>
              <option value="">-- Chọn nhân viên --</option>
              {staffList.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
            <div style={{ marginTop: '10px' }}>
              <button onClick={handleAssignStaff} style={btnPrimary}>Xác nhận</button>
              <button onClick={() => setSelectedShiftForAssign(null)} style={btnSecondary}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Bảng danh sách ca */}
      {loading ? <p>Đang tải...</p> : (
        <table style={{ width: '100%', background: '#fff', marginTop: 20, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={th}>Tên ca</th>
              <th style={th}>Bắt đầu</th>
              <th style={th}>Kết thúc (dự kiến)</th>
              {isAdmin && <th style={th}>Nhân viên</th>}
              <th style={th}>Trạng thái</th>
              <th style={th}>Tiền mặt HT</th>
              <th style={th}>Thực tế</th>
              <th style={th}>Chênh lệch</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift._id} style={{
                borderBottom: '1px solid #eee',
                opacity: shift.status === 'closed' ? 0.7 : 1
              }}>
                <td style={td}>{shift.name}</td>
                <td style={td}>{new Date(shift.startTime).toLocaleString('vi-VN')}</td>
                <td style={td}>
                  {shift.endTime ? new Date(shift.endTime).toLocaleString('vi-VN') : 'Chưa kết thúc'}
                </td>
                {isAdmin && (
                  <td style={td}>
                    {shift.staff?.map(s => s.name || s.email).join(', ') || 'Chưa có'}
                  </td>
                )}
                <td style={{ ...td, color: shift.status === 'open' ? 'green' : 'red' }}>
                  {shift.status === 'open' ? '🟢 Mở' : '🔴 Đã đóng'}
                </td>
                <td style={td}>{shift.totalCash?.toLocaleString()}₫</td>
                <td style={td}>{shift.actualCash?.toLocaleString()}₫</td>
                <td style={{ ...td, color: shift.difference < 0 ? 'red' : 'green' }}>
                  {shift.difference?.toLocaleString()}₫
                </td>
                <td style={td}>
                  {shift.status === 'open' && (
                    <>
                      {isAdmin && (
                        <>
                          <button onClick={() => setSelectedShiftForAssign(shift)} style={actionBtn}>Phân ca</button>
                          <button onClick={() => handleEdit(shift)} style={editBtn}>Sửa</button>
                        </>
                      )}
                      <button onClick={() => handleCloseShift(shift)} style={closeBtn}>Đóng ca</button>
                    </>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(shift._id)} style={deleteBtn}>Xóa</button>
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
const inputStyle = { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' };
const btnPrimary = { padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 5 };
const btnSecondary = { padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
const th = { padding: '12px 8px', textAlign: 'left' };
const td = { padding: '10px 8px' };
const actionBtn = { padding: '5px 8px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: 3, marginRight: 3, cursor: 'pointer' };
const editBtn = { padding: '5px 8px', background: '#f39c12', color: 'white', border: 'none', borderRadius: 3, marginRight: 3, cursor: 'pointer' };
const closeBtn = { padding: '5px 8px', background: '#e67e22', color: 'white', border: 'none', borderRadius: 3, marginRight: 3, cursor: 'pointer' };
const deleteBtn = { padding: '5px 8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: 20, borderRadius: 8, width: '90%', maxWidth: 500 };

export default ShiftManagementPage;