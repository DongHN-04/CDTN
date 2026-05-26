import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

const getUsers = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

const getProfile = async () => {
  // Endpoint này dùng cho cả khách hàng và nhân viên đang đăng nhập.
  const response = await axios.get(API_URL + 'me', { headers: getAuthHeader() });
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await axios.put(API_URL + 'me', profileData, { headers: getAuthHeader() });
  return response.data;
};

const changePassword = async (passwordData) => {
  const response = await axios.put(API_URL + 'me/password', passwordData, { headers: getAuthHeader() });
  return response.data;
};

const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData, { headers: getAuthHeader() });
  return response.data;
};

const updateUser = async (id, userData) => {
  const response = await axios.put(API_URL + id, userData, { headers: getAuthHeader() });
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(API_URL + id, { headers: getAuthHeader() });
  return response.data;
};

const userService = { getUsers, getProfile, updateProfile, changePassword, createUser, updateUser, deleteUser };
export default userService;
