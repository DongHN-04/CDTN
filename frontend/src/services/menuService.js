import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/menu/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const menuService = {
  getMenuItems: () => axios.get(API_URL, { headers: getAuthHeader() }).then(res => res.data),
  createMenuItem: (data) => axios.post(API_URL, data, { headers: getAuthHeader() }).then(res => res.data),
  updateMenuItem: (id, data) => axios.put(API_URL + id, data, { headers: getAuthHeader() }).then(res => res.data),
  deleteMenuItem: (id) => axios.delete(API_URL + id, { headers: getAuthHeader() }).then(res => res.data),
};

export default menuService;
