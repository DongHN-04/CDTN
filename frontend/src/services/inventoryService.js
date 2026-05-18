import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ingredients/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const inventoryService = {
  getIngredients: () => axios.get(API_URL, { headers: getAuthHeader() }).then(res => res.data),
  createIngredient: (data) => axios.post(API_URL, data, { headers: getAuthHeader() }).then(res => res.data),
  updateIngredient: (id, data) => axios.put(API_URL + id, data, { headers: getAuthHeader() }).then(res => res.data),
  deleteIngredient: (id) => axios.delete(API_URL + id, { headers: getAuthHeader() }).then(res => res.data),
};

export default inventoryService;
