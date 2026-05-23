import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/promotions/`;
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const promotionService = {
  getPromotions: () => axios.get(API_URL, { headers: getAuthHeader() }).then(r => r.data),
  createPromotion: (data) => axios.post(API_URL, data, { headers: getAuthHeader() }).then(r => r.data),
  updatePromotion: (id, data) => axios.put(API_URL + id, data, { headers: getAuthHeader() }).then(r => r.data),
  deletePromotion: (id) => axios.delete(API_URL + id, { headers: getAuthHeader() }).then(r => r.data),

  // Banner APIs
  getBanners: () => axios.get(API_URL + 'banners', { headers: getAuthHeader() }).then(r => r.data),
  createBanner: (data) => axios.post(API_URL + 'banners', data, { headers: getAuthHeader() }).then(r => r.data),
  deleteBanner: (id) => axios.delete(API_URL + 'banners/' + id, { headers: getAuthHeader() }).then(r => r.data),
  setActiveBanner: (id) => axios.put(API_URL + 'banners/' + id + '/active', {}, { headers: getAuthHeader() }).then(r => r.data),
};
export default promotionService;
