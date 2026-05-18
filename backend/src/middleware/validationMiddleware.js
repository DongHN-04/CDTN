const mongoose = require('mongoose');
const { ApiError } = require('./errorMiddleware');

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const trimString = (value) => (typeof value === 'string' ? value.trim() : value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const toNumber = (value) => (value === '' || value === null || value === undefined ? NaN : Number(value));
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const hasField = (body, field) => Object.prototype.hasOwnProperty.call(body, field);

const validateBody = (schema) => (req, res, next) => {
  const errors = [];
  const sanitized = schema(req.body || {}, errors);

  if (errors.length > 0) {
    return next(new ApiError(400, 'Du lieu khong hop le', errors));
  }

  req.body = sanitized;
  next();
};

const requireNonEmpty = (errors, field, value, message) => {
  if (!isNonEmptyString(value)) errors.push({ field, message });
};

const normalizeNonNegativeNumber = (errors, field, value, message, { integer = false } = {}) => {
  const number = toNumber(value);
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
    errors.push({ field, message });
  }
  return number;
};

const normalizePositiveNumber = (errors, field, value, message, { integer = false } = {}) => {
  const number = toNumber(value);
  if (!Number.isFinite(number) || number <= 0 || (integer && !Number.isInteger(number))) {
    errors.push({ field, message });
  }
  return number;
};

const startOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const endOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const validateAuthRegister = validateBody((body, errors) => {
  const name = trimString(body.name);
  const email = trimString(body.email)?.toLowerCase();
  const password = body.password;
  const phone = trimString(body.phone || '');
  const address = trimString(body.address || '');

  requireNonEmpty(errors, 'name', name, 'Ten la bat buoc');
  if (!isEmail(email)) errors.push({ field: 'email', message: 'Email khong hop le' });
  if (typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Mat khau phai co it nhat 6 ky tu' });
  }

  return { name, email, password, phone, address };
});

const validateAuthLogin = validateBody((body, errors) => {
  const email = trimString(body.email)?.toLowerCase();
  const password = body.password;

  if (!isEmail(email)) errors.push({ field: 'email', message: 'Email khong hop le' });
  requireNonEmpty(errors, 'password', password, 'Mat khau la bat buoc');

  return { email, password };
});

const normalizePromotion = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten khuyen mai la bat buoc');
    payload.name = name;
  }

  if (hasField(body, 'description')) payload.description = trimString(body.description || '');

  if (!partial || hasField(body, 'type')) {
    const type = trimString(body.type);
    if (!['percent', 'fixed', 'buyXgetY'].includes(type)) {
      errors.push({ field: 'type', message: 'Loai khuyen mai khong hop le' });
    }
    payload.type = type;
  }

  if (!partial || hasField(body, 'value')) {
    const value = normalizeNonNegativeNumber(errors, 'value', body.value, 'Gia tri giam phai >= 0');
    if ((body.type || payload.type) === 'percent' && value > 100) {
      errors.push({ field: 'value', message: 'Giam phan tram khong duoc vuot qua 100' });
    }
    payload.value = value;
  }

  if (hasField(body, 'minOrderValue') || !partial) {
    payload.minOrderValue = normalizeNonNegativeNumber(
      errors,
      'minOrderValue',
      body.minOrderValue || 0,
      'Gia tri don toi thieu phai >= 0'
    );
  }

  if (!partial || hasField(body, 'startDate')) {
    const startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) errors.push({ field: 'startDate', message: 'Ngay bat dau khong hop le' });
    payload.startDate = startOfDay(startDate);
  }

  if (!partial || hasField(body, 'endDate')) {
    const endDate = new Date(body.endDate);
    if (Number.isNaN(endDate.getTime())) errors.push({ field: 'endDate', message: 'Ngay ket thuc khong hop le' });
    payload.endDate = endOfDay(endDate);
  }

  if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
    errors.push({ field: 'endDate', message: 'Ngay ket thuc phai sau ngay bat dau' });
  }

  if (hasField(body, 'isActive')) payload.isActive = Boolean(body.isActive);

  return payload;
};

const validatePromotionCreate = validateBody((body, errors) => normalizePromotion(body, errors));
const validatePromotionUpdate = validateBody((body, errors) => normalizePromotion(body, errors, { partial: true }));

const normalizeOrderItems = (items, errors) => {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'Don hang phai co it nhat 1 mon' });
    return [];
  }

  return items.map((item, index) => {
    const quantity = normalizePositiveNumber(
      errors,
      `items.${index}.quantity`,
      item.quantity,
      'So luong phai la so nguyen duong',
      { integer: true }
    );
    const hasMenuItem = isNonEmptyString(item.menuItem);
    const hasCombo = isNonEmptyString(item.comboId);

    if (hasMenuItem === hasCombo) {
      errors.push({ field: `items.${index}`, message: 'Moi dong chi duoc chon mon le hoac combo' });
    }

    if (hasMenuItem && !isObjectId(item.menuItem)) {
      errors.push({ field: `items.${index}.menuItem`, message: 'Ma mon khong hop le' });
    }

    if (hasCombo && !isObjectId(item.comboId)) {
      errors.push({ field: `items.${index}.comboId`, message: 'Ma combo khong hop le' });
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
    return { name: 'Khach le', phone: '', address: '' };
  }

  return {
    name: trimString(customer.name || 'Khach le'),
    phone: trimString(customer.phone || ''),
    address: trimString(customer.address || ''),
  };
};

const validateOrderCreate = validateBody((body, errors) => {
  const discount = normalizeNonNegativeNumber(errors, 'discount', body.discount || 0, 'Giam gia phai >= 0');
  const paymentMethod = trimString(body.paymentMethod || 'cash');

  if (!['cash', 'card', 'qr'].includes(paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Phuong thuc thanh toan khong hop le' });
  }

  return {
    customer: normalizeCustomer(body.customer),
    items: normalizeOrderItems(body.items, errors),
    discount,
    paymentMethod,
  };
});

const validatePublicOrderCreate = validateBody((body, errors) => {
  const paymentMethod = trimString(body.paymentMethod || 'cash');

  if (!['cash', 'vnpay', 'momo'].includes(paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Phuong thuc thanh toan khong hop le' });
  }

  return {
    customer: normalizeCustomer(body.customer),
    items: normalizeOrderItems(body.items, errors),
    tableNumber: trimString(body.tableNumber || ''),
    notes: trimString(body.notes || ''),
    paymentMethod,
    promoCode: trimString(body.promoCode || '').toUpperCase(),
  };
});

const normalizeIngredient = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten nguyen lieu la bat buoc');
    payload.name = name;
  }

  if (!partial || hasField(body, 'stock')) {
    payload.stock = normalizeNonNegativeNumber(errors, 'stock', body.stock, 'Ton kho phai >= 0');
  }

  if (!partial || hasField(body, 'unit')) {
    const unit = trimString(body.unit);
    requireNonEmpty(errors, 'unit', unit, 'Don vi tinh la bat buoc');
    payload.unit = unit;
  }

  if (hasField(body, 'pricePerUnit') || !partial) {
    payload.pricePerUnit = normalizeNonNegativeNumber(errors, 'pricePerUnit', body.pricePerUnit || 0, 'Gia nhap phai >= 0');
  }

  return payload;
};

const validateIngredientCreate = validateBody((body, errors) => normalizeIngredient(body, errors));
const validateIngredientUpdate = validateBody((body, errors) => normalizeIngredient(body, errors, { partial: true }));

const normalizeMenuIngredients = (items, errors) => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    if (!isObjectId(item.ingredient)) {
      errors.push({ field: `ingredients.${index}.ingredient`, message: 'Ma nguyen lieu khong hop le' });
    }

    return {
      ingredient: item.ingredient,
      quantity: normalizePositiveNumber(errors, `ingredients.${index}.quantity`, item.quantity, 'Dinh luong phai > 0'),
    };
  });
};

const normalizeMenuItem = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten mon la bat buoc');
    payload.name = name;
  }

  if (!partial || hasField(body, 'price')) {
    payload.price = normalizeNonNegativeNumber(errors, 'price', body.price, 'Gia ban phai >= 0');
  }

  if (hasField(body, 'description')) payload.description = trimString(body.description || '');

  if (!partial || hasField(body, 'category')) {
    const category = trimString(body.category);
    requireNonEmpty(errors, 'category', category, 'Danh muc la bat buoc');
    payload.category = category;
  }

  if (hasField(body, 'image')) payload.image = trimString(body.image || '');
  if (hasField(body, 'ingredients')) payload.ingredients = normalizeMenuIngredients(body.ingredients, errors);

  return payload;
};

const validateMenuItemCreate = validateBody((body, errors) => normalizeMenuItem(body, errors));
const validateMenuItemUpdate = validateBody((body, errors) => normalizeMenuItem(body, errors, { partial: true }));

const normalizeCustomerRecord = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten khach hang la bat buoc');
    payload.name = name;
  }

  if (hasField(body, 'phone')) payload.phone = trimString(body.phone || '');
  if (hasField(body, 'email')) {
    const email = trimString(body.email || '');
    if (email && !isEmail(email)) errors.push({ field: 'email', message: 'Email khong hop le' });
    payload.email = email;
  }
  if (hasField(body, 'type')) {
    const type = trimString(body.type);
    if (!['VIP', 'Regular', 'Thuong', 'Thường'].includes(type)) {
      errors.push({ field: 'type', message: 'Loai khach hang khong hop le' });
    }
    payload.type = type === 'VIP' ? 'VIP' : 'Thường';
  }
  if (hasField(body, 'notes')) payload.notes = trimString(body.notes || '');

  return payload;
};

const validateCustomerCreate = validateBody((body, errors) => normalizeCustomerRecord(body, errors));
const validateCustomerUpdate = validateBody((body, errors) => normalizeCustomerRecord(body, errors, { partial: true }));

const normalizeComboItems = (items, errors) => {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'Combo phai co it nhat 1 mon' });
    return [];
  }

  return items.map((item, index) => {
    if (!isObjectId(item.menuItem)) {
      errors.push({ field: `items.${index}.menuItem`, message: 'Ma mon khong hop le' });
    }

    return {
      menuItem: item.menuItem,
      quantity: normalizePositiveNumber(errors, `items.${index}.quantity`, item.quantity || 1, 'So luong phai > 0', { integer: true }),
    };
  });
};

const normalizeCombo = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten combo la bat buoc');
    payload.name = name;
  }
  if (hasField(body, 'description')) payload.description = trimString(body.description || '');
  if (!partial || hasField(body, 'items')) payload.items = normalizeComboItems(body.items, errors);
  if (!partial || hasField(body, 'price')) payload.price = normalizeNonNegativeNumber(errors, 'price', body.price, 'Gia combo phai >= 0');
  if (hasField(body, 'image')) payload.image = trimString(body.image || '');
  if (hasField(body, 'isActive')) payload.isActive = Boolean(body.isActive);

  return payload;
};

const validateComboCreate = validateBody((body, errors) => normalizeCombo(body, errors));
const validateComboUpdate = validateBody((body, errors) => normalizeCombo(body, errors, { partial: true }));

const normalizeSupplier = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten nha cung cap la bat buoc');
    payload.name = name;
  }
  if (hasField(body, 'contactPerson')) payload.contactPerson = trimString(body.contactPerson || '');
  if (hasField(body, 'phone')) payload.phone = trimString(body.phone || '');
  if (hasField(body, 'email')) {
    const email = trimString(body.email || '');
    if (email && !isEmail(email)) errors.push({ field: 'email', message: 'Email khong hop le' });
    payload.email = email;
  }
  if (hasField(body, 'address')) payload.address = trimString(body.address || '');
  if (hasField(body, 'debt')) payload.debt = normalizeNonNegativeNumber(errors, 'debt', body.debt, 'Cong no phai >= 0');
  if (hasField(body, 'notes')) payload.notes = trimString(body.notes || '');

  return payload;
};

const validateSupplierCreate = validateBody((body, errors) => normalizeSupplier(body, errors));
const validateSupplierUpdate = validateBody((body, errors) => normalizeSupplier(body, errors, { partial: true }));

const validatePurchaseCreate = validateBody((body, errors) => {
  const supplierId = trimString(body.supplierId);
  if (!isObjectId(supplierId)) errors.push({ field: 'supplierId', message: 'Ma nha cung cap khong hop le' });

  const items = Array.isArray(body.items) ? body.items.map((item, index) => {
    if (!isObjectId(item.ingredient)) {
      errors.push({ field: `items.${index}.ingredient`, message: 'Ma nguyen lieu khong hop le' });
    }

    return {
      ingredient: item.ingredient,
      quantity: normalizePositiveNumber(errors, `items.${index}.quantity`, item.quantity, 'So luong nhap phai > 0'),
      unitPrice: normalizeNonNegativeNumber(errors, `items.${index}.unitPrice`, item.unitPrice, 'Don gia nhap phai >= 0'),
    };
  }) : [];

  if (items.length === 0) errors.push({ field: 'items', message: 'Phieu nhap phai co it nhat 1 dong' });

  return {
    supplierId,
    items,
    paidAmount: normalizeNonNegativeNumber(errors, 'paidAmount', body.paidAmount || 0, 'So tien da tra phai >= 0'),
    purchaseDate: body.purchaseDate || undefined,
    notes: trimString(body.notes || ''),
  };
});

const validatePayDebt = validateBody((body, errors) => ({
  amount: normalizePositiveNumber(errors, 'amount', body.amount, 'So tien thanh toan phai > 0'),
}));

const normalizeUser = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten nhan vien la bat buoc');
    payload.name = name;
  }

  if (!partial || hasField(body, 'email')) {
    const email = trimString(body.email)?.toLowerCase();
    if (!isEmail(email)) errors.push({ field: 'email', message: 'Email khong hop le' });
    payload.email = email;
  }

  if (!partial || hasField(body, 'password')) {
    const password = body.password;
    if (!partial || isNonEmptyString(password)) {
      if (typeof password !== 'string' || password.length < 6) {
        errors.push({ field: 'password', message: 'Mat khau phai co it nhat 6 ky tu' });
      }
      payload.password = password;
    }
  }

  if (!partial || hasField(body, 'role')) {
    const role = trimString(body.role || 'staff');
    payload.role = role === 'admin' ? 'admin' : role;
  }

  if (hasField(body, 'phone')) payload.phone = trimString(body.phone || '');
  if (hasField(body, 'salary')) payload.salary = normalizeNonNegativeNumber(errors, 'salary', body.salary, 'Luong phai >= 0');

  return payload;
};

const validateUserCreate = validateBody((body, errors) => normalizeUser(body, errors));
const validateUserUpdate = validateBody((body, errors) => normalizeUser(body, errors, { partial: true }));

const normalizeShift = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Ten ca la bat buoc');
    payload.name = name;
  }

  if (!partial || hasField(body, 'startTime')) {
    const startTime = new Date(body.startTime);
    if (Number.isNaN(startTime.getTime())) errors.push({ field: 'startTime', message: 'Gio bat dau khong hop le' });
    payload.startTime = startTime;
  }

  if (!partial || hasField(body, 'endTime')) {
    const endTime = new Date(body.endTime);
    if (Number.isNaN(endTime.getTime())) errors.push({ field: 'endTime', message: 'Gio ket thuc khong hop le' });
    payload.endTime = endTime;
  }

  if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
    errors.push({ field: 'endTime', message: 'Gio ket thuc phai sau gio bat dau' });
  }

  if (hasField(body, 'staff')) {
    if (!Array.isArray(body.staff)) {
      errors.push({ field: 'staff', message: 'Danh sach nhan vien khong hop le' });
      payload.staff = [];
    } else {
      payload.staff = body.staff.filter(Boolean);
      payload.staff.forEach((id, index) => {
        if (!isObjectId(id)) errors.push({ field: `staff.${index}`, message: 'Ma nhan vien khong hop le' });
      });
    }
  }

  return payload;
};

const validateShiftCreate = validateBody((body, errors) => normalizeShift(body, errors));
const validateShiftUpdate = validateBody((body, errors) => normalizeShift(body, errors, { partial: true }));
const validateAssignStaff = validateBody((body, errors) => {
  const userId = trimString(body.userId);
  if (!isObjectId(userId)) errors.push({ field: 'userId', message: 'Ma nhan vien khong hop le' });
  return { userId };
});

const validateCloseShift = validateBody((body, errors) => {
  const payload = {
    actualCash: normalizeNonNegativeNumber(errors, 'actualCash', body.actualCash || 0, 'Tien thuc te phai >= 0'),
    notes: trimString(body.notes || ''),
  };

  if (hasField(body, 'endTime')) {
    const endTime = new Date(body.endTime);
    if (Number.isNaN(endTime.getTime())) errors.push({ field: 'endTime', message: 'Gio ket thuc khong hop le' });
    payload.endTime = endTime;
  }

  return payload;
});

const validatePaymentCreate = validateBody((body, errors) => {
  const orderId = trimString(body.orderId);
  if (!isObjectId(orderId)) errors.push({ field: 'orderId', message: 'Ma don hang khong hop le' });
  return { orderId };
});

module.exports = {
  validateAuthRegister,
  validateAuthLogin,
  validatePromotionCreate,
  validatePromotionUpdate,
  validateOrderCreate,
  validatePublicOrderCreate,
  validateIngredientCreate,
  validateIngredientUpdate,
  validateMenuItemCreate,
  validateMenuItemUpdate,
  validateCustomerCreate,
  validateCustomerUpdate,
  validateComboCreate,
  validateComboUpdate,
  validateSupplierCreate,
  validateSupplierUpdate,
  validatePurchaseCreate,
  validatePayDebt,
  validateUserCreate,
  validateUserUpdate,
  validateShiftCreate,
  validateShiftUpdate,
  validateAssignStaff,
  validateCloseShift,
  validatePaymentCreate,
};
