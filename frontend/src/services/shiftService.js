import axios from 'axios';
const API_URL = 'http://localhost:5000/api/shifts/';

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const shiftService = {
  // Admin lấy tất cả ca
  getShifts: () => axios.get(API_URL, { headers: getAuthHeader() }).then(res => res.data),
  // Nhân viên lấy ca của mình
  getMyShifts: () => axios.get(API_URL + 'mine', { headers: getAuthHeader() }).then(res => res.data),
  // Tạo ca (Admin)
  createShift: (data) => axios.post(API_URL, data, { headers: getAuthHeader() }).then(res => res.data),
  // Cập nhật ca (Admin)
  updateShift: (id, data) => axios.put(API_URL + id, data, { headers: getAuthHeader() }).then(res => res.data),
  // Phân ca (Admin)
  assignStaff: (shiftId, userId) =>
    axios.put(API_URL + shiftId + '/assign', { userId }, { headers: getAuthHeader() }).then(res => res.data),
  // Đóng ca (Admin hoặc nhân viên trong ca)
  closeShift: (id, data) => axios.put(API_URL + id + '/close', data, { headers: getAuthHeader() }).then(res => res.data),
  // Xóa ca (Admin)
  deleteShift: (id) => axios.delete(API_URL + id, { headers: getAuthHeader() }).then(res => res.data),
};

export default shiftService;