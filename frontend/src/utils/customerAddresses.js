export const parseSavedAddress = (fullAddress = '', districts = []) => {
  const matchedDistrict = districts.find(item => fullAddress.toLowerCase().includes(item.toLowerCase())) || '';
  const addressWithoutDistrict = matchedDistrict
    ? fullAddress.replace(new RegExp(`,?\\s*${matchedDistrict}`, 'i'), '')
    : fullAddress;
  const address = addressWithoutDistrict
    .replace(/,?\s*(Hà Nội)/i, '')
    .trim()
    .replace(/,\s*$/, '');

  return { address, district: matchedDistrict, city: 'Hà Nội' };
};

export const normalizeCustomerAddresses = (addresses = []) => (
  Array.isArray(addresses) ? addresses : []
).map((item, index) => ({
  id: item.id || item._id || `${Date.now()}-${index}`,
  label: item.label || 'Địa chỉ nhận hàng',
  address: item.address || '',
  district: item.district || '',
  city: item.city || 'Hà Nội',
  fullAddress: item.fullAddress || [item.address, item.district, item.city || 'Hà Nội'].filter(Boolean).join(', '),
  isDefault: Boolean(item.isDefault),
}));

export const buildAddressOption = ({ label, address, district, city = 'Hà Nội', isDefault = false }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: label?.trim() || 'Địa chỉ nhận hàng',
  address: address?.trim() || '',
  district: district || '',
  city,
  fullAddress: [address?.trim(), district, city].filter(Boolean).join(', '),
  isDefault,
});
