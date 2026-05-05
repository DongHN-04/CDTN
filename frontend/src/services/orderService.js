import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL}/orders/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  console.warn('Không tìm thấy token trong localStorage');
  return {};
};

const orderService = {
  createOrder: async (orderData) => {
    const headers = getAuthHeader();
    console.log('Headers gửi đi:', headers); // debug
    const response = await axios.post(API_URL, orderData, { headers });
    return response.data;
  },
  getOrders: async (params) => {
    const response = await axios.get(API_URL, { headers: getAuthHeader(), params });
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await axios.get(API_URL + id, { headers: getAuthHeader() });
    return response.data;
  }
};

export default orderService;