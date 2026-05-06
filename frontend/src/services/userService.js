import axios from 'axios';

// Thay đổi tùy theo việc dùng Create React App hay Vite
const API_URL = `${process.env.REACT_APP_API_URL}/users/`; 

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

const getUsers = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData, { headers: getAuthHeader() });
  return response.data;
};

const updateUser = async (id, userData) => {
  const response = await axios.put(API_URL + id, userData, { headers: getAuthHeader() });
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(API_URL + id, { headers: getAuthHeader() });
  return response.data;
};

const userService = { getUsers, createUser, updateUser, deleteUser };
export default userService;