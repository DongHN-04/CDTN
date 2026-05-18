const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export const getImageUrl = (image, fallback = '') => {
  if (!image) return fallback;
  if (image.startsWith('data:image') || image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  return `${assetBaseUrl}${image.startsWith('/') ? image : `/${image}`}`;
};
