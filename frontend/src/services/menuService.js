import axios from 'axios';

// Đảm bảo đường dẫn này khớp với route ở backend của bạn
const API_URL = 'http://localhost:5000/api/menu/';

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// Lấy danh sách thực đơn
const getMenu = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

// Thêm món mới
const createMenu = async (menuData) => {
  const response = await axios.post(API_URL, menuData, { headers: getAuthHeader() });
  return response.data;
};

// Cập nhật món
const updateMenu = async (id, menuData) => {
  const response = await axios.put(API_URL + id, menuData, { headers: getAuthHeader() });
  return response.data;
};

// Xóa món
const deleteMenu = async (id) => {
  const response = await axios.delete(API_URL + id, { headers: getAuthHeader() });
  return response.data;
};

// Gán vào biến trước khi export để tránh lỗi cảnh báo màu vàng của ESLint
const menuService = { getMenu, createMenu, updateMenu, deleteMenu };
export default menuService;