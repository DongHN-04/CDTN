import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  console.warn('Không tìm thấy token trong localStorage');
  return {};
};

const orderService = {
  // Tạo đơn hàng (cho POS)
  createOrder: async (orderData) => {
    const headers = getAuthHeader();
    const response = await axios.post(API_URL, orderData, { headers });
    return response.data;
  },

  // Lấy danh sách hóa đơn (có hỗ trợ lọc)
  getOrders: async (params) => {
    const response = await axios.get(API_URL, { headers: getAuthHeader(), params });
    return response.data;
  },

  // Lấy chi tiết một hóa đơn
  getOrderById: async (id) => {
    const response = await axios.get(API_URL + id, { headers: getAuthHeader() });
    return response.data;
  },

  // 🆕 Lấy danh sách đơn hàng từ khách đang chờ xác nhận
  getPendingOrders: async () => {
    const response = await axios.get(API_URL + 'pending', { headers: getAuthHeader() });
    return response.data;
  },

  // 🆕 Xác nhận đơn hàng từ khách (trừ kho)
  confirmOrder: async (id) => {
    const response = await axios.put(API_URL + id + '/confirm', {}, { headers: getAuthHeader() });
    return response.data;
  },

  updateOrderStatus: async (id, status, extra = {}) => {
    const response = await axios.put(API_URL + id + '/status', { status, ...extra }, { headers: getAuthHeader() });
    return response.data;
  }
};

export default orderService;
