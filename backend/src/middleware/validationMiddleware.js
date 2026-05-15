const mongoose = require('mongoose');
const { ApiError } = require('./errorMiddleware');

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const trimString = (value) => (typeof value === 'string' ? value.trim() : value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const toNumber = (value) => (value === '' || value === null || value === undefined ? NaN : Number(value));
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateBody = (schema) => (req, res, next) => {
  const errors = [];
  const sanitized = schema(req.body || {}, errors);

  if (errors.length > 0) {
    return next(new ApiError(400, 'Dữ liệu không hợp lệ', errors));
  }

  req.body = sanitized;
  next();
};

const validateAuthRegister = validateBody((body, errors) => {
  const name = trimString(body.name);
  const email = trimString(body.email)?.toLowerCase();
  const password = body.password;
  const phone = trimString(body.phone || '');
  const address = trimString(body.address || '');

  if (!isNonEmptyString(name)) errors.push({ field: 'name', message: 'Tên là bắt buộc' });
  if (!isEmail(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
  if (typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  return { name, email, password, phone, address };
});

const validateAuthLogin = validateBody((body, errors) => {
  const email = trimString(body.email)?.toLowerCase();
  const password = body.password;

  if (!isEmail(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
  if (!isNonEmptyString(password)) errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc' });

  return { email, password };
});

const normalizePromotion = (body, errors, { partial = false } = {}) => {
  const payload = {};
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);

  if (!partial || has('name')) {
    const name = trimString(body.name);
    if (!isNonEmptyString(name)) errors.push({ field: 'name', message: 'Tên khuyến mãi là bắt buộc' });
    payload.name = name;
  }

  if (has('description')) payload.description = trimString(body.description || '');

  if (!partial || has('type')) {
    const type = trimString(body.type);
    if (!['percent', 'fixed', 'buyXgetY'].includes(type)) {
      errors.push({ field: 'type', message: 'Loại khuyến mãi không hợp lệ' });
    }
    payload.type = type;
  }

  if (!partial || has('value')) {
    const value = toNumber(body.value);
    if (!Number.isFinite(value) || value < 0) errors.push({ field: 'value', message: 'Giá trị giảm phải >= 0' });
    if (body.type === 'percent' && value > 100) errors.push({ field: 'value', message: 'Giảm phần trăm không được vượt quá 100' });
    payload.value = value;
  }

  if (has('minOrderValue') || !partial) {
    const minOrderValue = toNumber(body.minOrderValue || 0);
    if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
      errors.push({ field: 'minOrderValue', message: 'Giá trị đơn tối thiểu phải >= 0' });
    }
    payload.minOrderValue = minOrderValue;
  }

  if (!partial || has('startDate')) {
    const startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) errors.push({ field: 'startDate', message: 'Ngày bắt đầu không hợp lệ' });
    payload.startDate = startDate;
  }

  if (!partial || has('endDate')) {
    const endDate = new Date(body.endDate);
    if (Number.isNaN(endDate.getTime())) errors.push({ field: 'endDate', message: 'Ngày kết thúc không hợp lệ' });
    payload.endDate = endDate;
  }

  if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
    errors.push({ field: 'endDate', message: 'Ngày kết thúc phải sau ngày bắt đầu' });
  }

  if (has('isActive')) payload.isActive = Boolean(body.isActive);

  return payload;
};

const validatePromotionCreate = validateBody((body, errors) => normalizePromotion(body, errors));
const validatePromotionUpdate = validateBody((body, errors) => normalizePromotion(body, errors, { partial: true }));

const normalizeOrderItems = (items, errors) => {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'Đơn hàng phải có ít nhất 1 món' });
    return [];
  }

  return items.map((item, index) => {
    const quantity = toNumber(item.quantity);
    const hasMenuItem = isNonEmptyString(item.menuItem);
    const hasCombo = isNonEmptyString(item.comboId);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.push({ field: `items.${index}.quantity`, message: 'Số lượng phải là số nguyên dương' });
    }

    if (hasMenuItem === hasCombo) {
      errors.push({ field: `items.${index}`, message: 'Mỗi dòng chỉ được chọn món lẻ hoặc combo' });
    }

    if (hasMenuItem && !isObjectId(item.menuItem)) {
      errors.push({ field: `items.${index}.menuItem`, message: 'Mã món không hợp lệ' });
    }

    if (hasCombo && !isObjectId(item.comboId)) {
      errors.push({ field: `items.${index}.comboId`, message: 'Mã combo không hợp lệ' });
    }

    return {
      menuItem: hasMenuItem ? item.menuItem : undefined,
      comboId: hasCombo ? item.comboId : undefined,
      quantity,
    };
  });
};

const normalizeCustomer = (customer) => {
  if (!isPlainObject(customer)) {
    return { name: 'Khách lẻ', phone: '' };
  }

  return {
    name: trimString(customer.name || 'Khách lẻ'),
    phone: trimString(customer.phone || ''),
  };
};

const validateOrderCreate = validateBody((body, errors) => {
  const discount = toNumber(body.discount || 0);
  if (!Number.isFinite(discount) || discount < 0) errors.push({ field: 'discount', message: 'Giảm giá phải >= 0' });

  const paymentMethod = trimString(body.paymentMethod || 'cash');
  if (!['cash', 'card', 'qr'].includes(paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Phương thức thanh toán không hợp lệ' });
  }

  return {
    customer: normalizeCustomer(body.customer),
    items: normalizeOrderItems(body.items, errors),
    discount,
    paymentMethod,
  };
});

const validatePublicOrderCreate = validateBody((body, errors) => ({
  customer: normalizeCustomer(body.customer),
  items: normalizeOrderItems(body.items, errors),
  tableNumber: trimString(body.tableNumber || ''),
  notes: trimString(body.notes || ''),
}));

module.exports = {
  validateAuthRegister,
  validateAuthLogin,
  validatePromotionCreate,
  validatePromotionUpdate,
  validateOrderCreate,
  validatePublicOrderCreate,
};
