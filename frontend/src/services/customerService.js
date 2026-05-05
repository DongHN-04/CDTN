import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL}/customers/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const customerService = {
  getCustomers: () => axios.get(API_URL, { headers: getAuthHeader() }).then(res => res.data),
  createCustomer: (data) => axios.post(API_URL, data, { headers: getAuthHeader() }).then(res => res.data),
  updateCustomer: (id, data) => axios.put(API_URL + id, data, { headers: getAuthHeader() }).then(res => res.data),
  deleteCustomer: (id) => axios.delete(API_URL + id, { headers: getAuthHeader() }).then(res => res.data),
};

export default customerService;