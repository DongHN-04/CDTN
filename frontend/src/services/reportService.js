import axios from 'axios';
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reports`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const reportService = {
  getReports: async (params) => {
    const response = await axios.get(API_URL, { headers: getAuthHeader(), params });
    return response.data;
  }
};

export default reportService;
