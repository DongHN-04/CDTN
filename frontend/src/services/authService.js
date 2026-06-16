import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/`;

// Đăng ký
const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
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
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

// Quên mật khẩu
const forgotPassword = async (email) => {
  const response = await axios.post(API_URL + 'forgot-password', { email });
  return response.data;
};

// Đặt lại mật khẩu
const resetPassword = async (email, otp, password) => {
  const response = await axios.post(API_URL + 'reset-password', { email, otp, password });
  return response.data;
};

// Xác minh OTP
const verifyOTP = async (email, otp) => {
  const response = await axios.post(API_URL + 'verify-otp', { email, otp });
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
};

export default authService;
