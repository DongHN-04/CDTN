import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/suppliers/`;
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const supplierService = {
    getSuppliers: () => axios.get(API_URL, { headers: getAuthHeader() }).then(r => r.data),
    getSupplierById: (id) => axios.get(API_URL + id, { headers: getAuthHeader() }).then(r => r.data),
    createSupplier: (data) => axios.post(API_URL, data, { headers: getAuthHeader() }).then(r => r.data),
    updateSupplier: (id, data) => axios.put(API_URL + id, data, { headers: getAuthHeader() }).then(r => r.data),
    deleteSupplier: (id) => axios.delete(API_URL + id, { headers: getAuthHeader() }).then(r => r.data),
    createPurchase: (data) => axios.post(API_URL + 'purchase', data, { headers: getAuthHeader() }).then(r => r.data),
    getPurchases: (params) => axios.get(API_URL + 'purchases', { headers: getAuthHeader(), params }).then(r => r.data),
    payDebt: (id, amount) => axios.put(API_URL + id + '/pay-debt', { amount }, { headers: getAuthHeader() }).then(r => r.data),
};

export default supplierService;
