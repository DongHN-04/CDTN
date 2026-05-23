import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/payment/`;

const paymentService = {
  createPayment: (data) => axios.post(API_URL + 'create', data).then(res => res.data),
};

export default paymentService;
