import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL}/public/`;

const publicService = {
  getMenu: () => axios.get(API_URL + 'menu').then(res => res.data),
  createOrder: (data) => axios.post(API_URL + 'orders', data).then(res => res.data),
};

export default publicService;