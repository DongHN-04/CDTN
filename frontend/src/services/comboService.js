import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL}/combos/`;
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const comboService = {
  getCombos: () => axios.get(API_URL, { headers: getAuthHeader() }).then(r => r.data),
  createCombo: (data) => axios.post(API_URL, data, { headers: getAuthHeader() }).then(r => r.data),
  updateCombo: (id, data) => axios.put(API_URL + id, data, { headers: getAuthHeader() }).then(r => r.data),
  deleteCombo: (id) => axios.delete(API_URL + id, { headers: getAuthHeader() }).then(r => r.data),
};
export default comboService;