import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/`;

// Đăng ký
const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Đăng nhập
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Đăng xuất
const logout = () => {
  localStorage.removeItem('user');
};

// Lấy thông tin user hiện tại từ localStorage
const getCurrentUser = () => {
  try {
    // LocalStorage có thể bị người dùng/sandbox ghi sai JSON, nên cần fallback an toàn.
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService;
