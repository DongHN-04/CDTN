const fieldLabels = {
  name: 'Tên',
  username: 'Tên đăng nhập',
  email: 'Email',
  phone: 'Số điện thoại',
  password: 'Mật khẩu',
  confirmPassword: 'Xác nhận mật khẩu',
  currentPassword: 'Mật khẩu hiện tại',
  newPassword: 'Mật khẩu mới',
  address: 'Địa chỉ',
  avatar: 'Ảnh đại diện',
  price: 'Giá bán',
  pricePerUnit: 'Giá nhập',
  stock: 'Tồn kho',
  unit: 'Đơn vị tính',
  category: 'Danh mục',
  image: 'Hình ảnh',
  items: 'Danh sách món',
  paymentMethod: 'Phương thức thanh toán',
  promotionId: 'Khuyến mãi',
  promoCode: 'Mã giảm giá',
  value: 'Giá trị giảm',
  minOrderValue: 'Đơn tối thiểu',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  supplierId: 'Nhà cung cấp',
  paidAmount: 'Số tiền đã trả',
  amount: 'Số tiền',
  salary: 'Lương',
  status: 'Trạng thái',
  role: 'Chức vụ',
  staff: 'Nhân viên',
  actualCash: 'Tiền thực tế',
};

const getFieldLabel = (field = '') => {
  if (fieldLabels[field]) return fieldLabels[field];
  const normalized = String(field).replace(/\.\d+\./g, '.').replace(/\.\d+$/g, '');
  if (fieldLabels[normalized]) return fieldLabels[normalized];
  if (normalized.startsWith('customer.')) {
    return fieldLabels[normalized.replace('customer.', '')] || 'Thông tin khách hàng';
  }
  if (normalized.startsWith('items.')) return 'Dòng món';
  if (normalized.startsWith('ingredients.')) return 'Nguyên liệu';
  return field || 'Dữ liệu';
};

export const formatApiError = (error, fallback = 'Có lỗi xảy ra') => {
  const details = error?.response?.data?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details
      .map(item => `${getFieldLabel(item.field)}: ${item.message}`)
      .join('\n');
  }

  return error?.response?.data?.message || fallback;
};
