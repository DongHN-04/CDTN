import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/public/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const publicService = {
  // Lấy toàn bộ thực đơn
  getMenu: () => axios.get(API_URL + 'menu').then(res => res.data),

  // Lấy combo đang hoạt động
  getCombos: () => axios.get(API_URL + 'combos').then(res => res.data),

  // Lấy khuyến mãi đang hoạt động
  getPromotions: () => axios.get(API_URL + 'promotions').then(res => res.data),

  // Lấy dữ liệu trang chủ (gộp: featured, categories, combos, promotions)
  getHomepageData: () => axios.get(API_URL + 'homepage').then(res => res.data),

  // Tạo đơn hàng từ khách
  getMyOrders: () => axios.get(API_URL + 'my-orders', { headers: getAuthHeader() }).then(res => res.data),

  createOrder: (data) => axios.post(API_URL + 'orders', data, { headers: getAuthHeader() }).then(res => res.data),
};

export default publicService;
