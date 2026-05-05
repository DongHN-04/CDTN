import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/upload/`;

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await axios.post(API_URL, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.image;
};

const uploadService = { uploadImage };
export default uploadService;