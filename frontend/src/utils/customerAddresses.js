export const parseSavedAddress = (fullAddress = '', districts = []) => {
  const matchedDistrict = districts.find(item => fullAddress.toLowerCase().includes(item.toLowerCase())) || '';
  const addressWithoutDistrict = matchedDistrict
    ? fullAddress.replace(new RegExp(`,?\\s*${matchedDistrict}`, 'i'), '')
    : fullAddress;
  const address = addressWithoutDistrict
    .replace(/,?\s*Hồ Chí Minh/i, '')
    .trim()
    .replace(/,\s*$/, '');

  return { address, district: matchedDistrict, city: 'Hồ Chí Minh' };
};

export const normalizeCustomerAddresses = (addresses = []) => (
  Array.isArray(addresses) ? addresses : []
).map((item, index) => ({
  id: item.id || item._id || `${Date.now()}-${index}`,
  label: item.label || 'Địa chỉ nhận hàng',
  address: item.address || '',
  district: item.district || '',
  city: item.city || 'Hồ Chí Minh',
  fullAddress: item.fullAddress || [item.address, item.district, item.city || 'Hồ Chí Minh'].filter(Boolean).join(', '),
  isDefault: Boolean(item.isDefault),
}));

export const buildAddressOption = ({ label, address, district, city = 'Hồ Chí Minh', isDefault = false }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: label?.trim() || 'Địa chỉ nhận hàng',
  address: address?.trim() || '',
  district: district || '',
  city,
  fullAddress: [address?.trim(), district, city].filter(Boolean).join(', '),
  isDefault,
});
