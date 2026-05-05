import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/users/`;

// Lấy token từ localStorage
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// Lấy danh sách nhân viên
const getUsers = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

// Tạo nhân viên mới
const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData, { headers: getAuthHeader() });
  return response.data;
};

// Cập nhật nhân viên
const updateUser = async (id, userData) => {
  const response = await axios.put(API_URL + id, userData, { headers: getAuthHeader() });
  return response.data;
};

// Xóa nhân viên
const deleteUser = async (id) => {
  const response = await axios.delete(API_URL + id, { headers: getAuthHeader() });
  return response.data;
};

const userService = { getUsers, createUser, updateUser, deleteUser };
export default userService;