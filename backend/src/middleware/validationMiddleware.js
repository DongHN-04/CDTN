const mongoose = require('mongoose');
const { ApiError } = require('./errorMiddleware');

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const trimString = (value) => (typeof value === 'string' ? value.trim() : value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isPhone = (value) => /^(0|\+84)[0-9]{9,10}$/.test(String(value || '').replace(/\s/g, ''));
const isImagePath = (value) => {
  const text = String(value || '').trim();
  return /^(https?:\/\/|\/uploads\/|uploads\/|\/images\/|images\/).+\.(jpe?g|png|webp)(\?.*)?$/i.test(text);
};
const toNumber = (value) => (value === '' || value === null || value === undefined ? NaN : Number(value));
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const hasField = (body, field) => Object.prototype.hasOwnProperty.call(body, field);

const LIMITS = {
  money: 100_000_000,
  quantity: 100_000,
  text: 255,
  description: 1000,
  notes: 1000,
};

const validateBody = (schema) => (req, res, next) => {
  const errors = [];
  const sanitized = schema(req.body || {}, errors);

  if (errors.length > 0) {
    return next(new ApiError(400, 'Dữ liệu không hợp lệ', errors));
  }

  req.body = sanitized;
  next();
};

const requireNonEmpty = (errors, field, value, message) => {
  if (!isNonEmptyString(value)) errors.push({ field, message });
};

const validateTextLength = (errors, field, value, max = LIMITS.text) => {
  if (typeof value === 'string' && value.length > max) {
    errors.push({ field, message: `Không được vượt quá ${max} ký tự` });
  }
};

const validateOptionalPhone = (errors, field, value) => {
  if (isNonEmptyString(value) && !isPhone(value)) {
    errors.push({ field, message: 'Số điện thoại không hợp lệ' });
  }
};

const normalizeNonNegativeNumber = (errors, field, value, message, { integer = false, max } = {}) => {
  const number = toNumber(value);
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number)) || (max !== undefined && number > max)) {
    errors.push({ field, message });
  }
  return number;
};

const normalizePositiveNumber = (errors, field, value, message, { integer = false, max } = {}) => {
  const number = toNumber(value);
  if (!Number.isFinite(number) || number <= 0 || (integer && !Number.isInteger(number)) || (max !== undefined && number > max)) {
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

  requireNonEmpty(errors, 'name', name, 'Tên là bắt buộc');
  validateTextLength(errors, 'name', name);
  if (!isEmail(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
  validateOptionalPhone(errors, 'phone', phone);
  validateTextLength(errors, 'address', address, LIMITS.description);
  if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số' });
  }

  return { name, email, password, phone, address };
});

const validateAuthLogin = validateBody((body, errors) => {
  const email = trimString(body.email)?.toLowerCase();
  const password = body.password;

  if (!isEmail(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
  requireNonEmpty(errors, 'password', password, 'Mật khẩu là bắt buộc');

  return { email, password };
});

const normalizePromotion = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên khuyến mãi là bắt buộc');
    validateTextLength(errors, 'name', name, 120);
    payload.name = name;
  }

  if (hasField(body, 'description')) {
    payload.description = trimString(body.description || '');
    validateTextLength(errors, 'description', payload.description, 500);
  }

  if (!partial || hasField(body, 'type')) {
    const type = trimString(body.type);
    if (!['percent', 'fixed'].includes(type)) {
      errors.push({ field: 'type', message: 'Loại khuyến mãi không hợp lệ' });
    }
    payload.type = type;
  }

  if (!partial || hasField(body, 'value')) {
    const type = body.type || payload.type;
    const value = normalizePositiveNumber(errors, 'value', body.value, 'Giá trị giảm phải > 0', { max: LIMITS.money });
    if (type === 'percent' && value > 100) {
      errors.push({ field: 'value', message: 'Giảm phần trăm phải từ 1 đến 100' });
    }
    payload.value = value;
  }

  if (hasField(body, 'minOrderValue') || !partial) {
    payload.minOrderValue = normalizeNonNegativeNumber(
      errors,
      'minOrderValue',
      body.minOrderValue || 0,
      'Giá trị đơn tối thiểu phải >= 0 và không vượt quá 100.000.000',
      { max: LIMITS.money }
    );
  }

  if (!partial || hasField(body, 'startDate')) {
    const startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) errors.push({ field: 'startDate', message: 'Ngày bắt đầu không hợp lệ' });
    payload.startDate = startOfDay(startDate);
  }

  if (!partial || hasField(body, 'endDate')) {
    const endDate = new Date(body.endDate);
    if (Number.isNaN(endDate.getTime())) errors.push({ field: 'endDate', message: 'Ngày kết thúc không hợp lệ' });
    payload.endDate = endOfDay(endDate);
  }

  if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
    errors.push({ field: 'endDate', message: 'Ngày kết thúc phải sau ngày bắt đầu' });
  }

  if (!partial && payload.endDate && payload.endDate < startOfDay(new Date())) {
    errors.push({ field: 'endDate', message: 'Ngày kết thúc không được ở quá khứ' });
  }

  if (hasField(body, 'isActive')) payload.isActive = Boolean(body.isActive);

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
    const quantity = normalizePositiveNumber(
      errors,
      `items.${index}.quantity`,
      item.quantity,
      'Số lượng phải là số nguyên dương',
      { integer: true, max: LIMITS.quantity }
    );
    const hasMenuItem = isNonEmptyString(item.menuItem);
    const hasCombo = isNonEmptyString(item.comboId);

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

const normalizeCustomer = (customer, errors = [], { deliveryRequired = false } = {}) => {
  if (!isPlainObject(customer)) {
    if (deliveryRequired) {
      errors.push({ field: 'customer', message: 'Thông tin người nhận là bắt buộc' });
    }
    return { name: 'Khách lẻ', phone: '', email: '', address: '' };
  }

  const payload = {
    name: trimString(customer.name || (deliveryRequired ? '' : 'Khách lẻ')),
    phone: trimString(customer.phone || ''),
    email: trimString(customer.email || '').toLowerCase(),
    address: trimString(customer.address || ''),
  };

  if (deliveryRequired) {
    requireNonEmpty(errors, 'customer.name', payload.name, 'Tên người nhận là bắt buộc');
    requireNonEmpty(errors, 'customer.phone', payload.phone, 'Số điện thoại là bắt buộc');
    requireNonEmpty(errors, 'customer.address', payload.address, 'Địa chỉ giao hàng là bắt buộc');

    const normalizedPhone = payload.phone.replace(/\s/g, '');
    if (payload.phone && !isPhone(normalizedPhone)) {
      errors.push({ field: 'customer.phone', message: 'Số điện thoại không hợp lệ' });
    }
    if (payload.email && !isEmail(payload.email)) {
      errors.push({ field: 'customer.email', message: 'Email không hợp lệ' });
    }
    validateTextLength(errors, 'customer.name', payload.name);
    validateTextLength(errors, 'customer.address', payload.address, LIMITS.description);
  }

  return payload;
};

const validateOrderCreate = validateBody((body, errors) => {
  const paymentMethod = trimString(body.paymentMethod || 'cash');
  const promotionId = trimString(body.promotionId || '');

  if (!['cash', 'card', 'qr'].includes(paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Phương thức thanh toán không hợp lệ' });
  }

  if (promotionId && !isObjectId(promotionId)) {
    errors.push({ field: 'promotionId', message: 'Mã khuyến mãi không hợp lệ' });
  }

  return {
    customer: normalizeCustomer(body.customer, errors),
    items: normalizeOrderItems(body.items, errors),
    promotionId: promotionId || '',
    paymentMethod,
  };
});

const validatePublicOrderCreate = validateBody((body, errors) => {
  const paymentMethod = trimString(body.paymentMethod || 'cash');

  if (!['cash', 'vnpay'].includes(paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Phương thức thanh toán không hợp lệ' });
  }

  return {
    customer: normalizeCustomer(body.customer, errors, { deliveryRequired: true }),
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
    requireNonEmpty(errors, 'name', name, 'Tên nguyên liệu là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }

  if (!partial || hasField(body, 'stock')) {
    payload.stock = normalizeNonNegativeNumber(errors, 'stock', body.stock, 'Tồn kho phải >= 0 và không vượt quá 100.000', { max: LIMITS.quantity });
  }

  if (!partial || hasField(body, 'unit')) {
    const unit = trimString(body.unit);
    requireNonEmpty(errors, 'unit', unit, 'Đơn vị tính là bắt buộc');
    validateTextLength(errors, 'unit', unit, 50);
    payload.unit = unit;
  }

  if (hasField(body, 'pricePerUnit') || !partial) {
    payload.pricePerUnit = normalizePositiveNumber(errors, 'pricePerUnit', body.pricePerUnit || 0, 'Giá nhập phải > 0 và không vượt quá 100.000.000', { max: LIMITS.money });
  }

  return payload;
};

const validateIngredientCreate = validateBody((body, errors) => normalizeIngredient(body, errors));
const validateIngredientUpdate = validateBody((body, errors) => normalizeIngredient(body, errors, { partial: true }));

const normalizeMenuIngredients = (items, errors) => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    if (!isObjectId(item.ingredient)) {
      errors.push({ field: `ingredients.${index}.ingredient`, message: 'Mã nguyên liệu không hợp lệ' });
    }

    return {
      ingredient: item.ingredient,
      quantity: normalizePositiveNumber(errors, `ingredients.${index}.quantity`, item.quantity, 'Định lượng phải > 0 và không vượt quá 100.000', { max: LIMITS.quantity }),
    };
  });
};

const normalizeMenuItem = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên món là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }

  if (!partial || hasField(body, 'price')) {
    payload.price = normalizePositiveNumber(errors, 'price', body.price, 'Giá bán phải > 0 và không vượt quá 100.000.000', { max: LIMITS.money });
  }

  if (hasField(body, 'description')) {
    payload.description = trimString(body.description || '');
    validateTextLength(errors, 'description', payload.description, LIMITS.description);
  }

  if (!partial || hasField(body, 'category')) {
    const category = trimString(body.category);
    requireNonEmpty(errors, 'category', category, 'Danh mục là bắt buộc');
    validateTextLength(errors, 'category', category, 80);
    payload.category = category;
  }

  if (hasField(body, 'image')) {
    payload.image = trimString(body.image || '');
    if (payload.image && !isImagePath(payload.image)) {
      errors.push({ field: 'image', message: 'Ảnh món ăn phải là JPG, PNG hoặc WEBP hợp lệ' });
    }
  }
  if (hasField(body, 'isActive')) payload.isActive = Boolean(body.isActive);
  if (hasField(body, 'soldCount')) {
    payload.soldCount = normalizeNonNegativeNumber(errors, 'soldCount', body.soldCount || 0, 'Số lượng đã bán phải >= 0 và không vượt quá 100.000', { integer: true, max: LIMITS.quantity });
  }
  if (hasField(body, 'ingredients')) payload.ingredients = normalizeMenuIngredients(body.ingredients, errors);

  return payload;
};

const validateMenuItemCreate = validateBody((body, errors) => normalizeMenuItem(body, errors));
const validateMenuItemUpdate = validateBody((body, errors) => normalizeMenuItem(body, errors, { partial: true }));

const normalizeCustomerRecord = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên khách hàng là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }

  if (hasField(body, 'phone')) {
    payload.phone = trimString(body.phone || '');
    validateOptionalPhone(errors, 'phone', payload.phone);
  }
  if (hasField(body, 'email')) {
    const email = trimString(body.email || '');
    if (email && !isEmail(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
    payload.email = email;
  }
  if (hasField(body, 'type')) {
    const type = trimString(body.type);
    if (!['VIP', 'Regular', 'Thường'].includes(type)) {
      errors.push({ field: 'type', message: 'Loại khách hàng không hợp lệ' });
    }
    payload.type = type === 'VIP' ? 'VIP' : 'Thường';
  }
  if (hasField(body, 'notes')) {
    payload.notes = trimString(body.notes || '');
    validateTextLength(errors, 'notes', payload.notes, LIMITS.notes);
  }

  return payload;
};

const validateCustomerCreate = validateBody((body, errors) => normalizeCustomerRecord(body, errors));
const validateCustomerUpdate = validateBody((body, errors) => normalizeCustomerRecord(body, errors, { partial: true }));

const normalizeComboItems = (items, errors) => {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'Combo phải có ít nhất 1 món' });
    return [];
  }

  return items.map((item, index) => {
    if (!isObjectId(item.menuItem)) {
      errors.push({ field: `items.${index}.menuItem`, message: 'Mã món không hợp lệ' });
    }

    return {
      menuItem: item.menuItem,
      quantity: normalizePositiveNumber(errors, `items.${index}.quantity`, item.quantity || 1, 'Số lượng phải > 0 và không vượt quá 100.000', { integer: true, max: LIMITS.quantity }),
    };
  });
};

const normalizeCombo = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên combo là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }
  if (hasField(body, 'description')) {
    payload.description = trimString(body.description || '');
    validateTextLength(errors, 'description', payload.description, LIMITS.description);
  }
  if (!partial || hasField(body, 'items')) payload.items = normalizeComboItems(body.items, errors);
  if (!partial || hasField(body, 'price')) payload.price = normalizePositiveNumber(errors, 'price', body.price, 'Giá combo phải > 0 và không vượt quá 100.000.000', { max: LIMITS.money });
  if (hasField(body, 'image')) {
    payload.image = trimString(body.image || '');
    if (payload.image && !isImagePath(payload.image)) {
      errors.push({ field: 'image', message: 'Ảnh combo phải là JPG, PNG hoặc WEBP hợp lệ' });
    }
  }
  if (hasField(body, 'isActive')) payload.isActive = Boolean(body.isActive);

  return payload;
};

const validateComboCreate = validateBody((body, errors) => normalizeCombo(body, errors));
const validateComboUpdate = validateBody((body, errors) => normalizeCombo(body, errors, { partial: true }));

const normalizeSupplier = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên nhà cung cấp là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }
  if (hasField(body, 'contactPerson')) {
    payload.contactPerson = trimString(body.contactPerson || '');
    validateTextLength(errors, 'contactPerson', payload.contactPerson);
  }
  if (hasField(body, 'phone')) {
    payload.phone = trimString(body.phone || '');
    validateOptionalPhone(errors, 'phone', payload.phone);
  }
  if (hasField(body, 'email')) {
    const email = trimString(body.email || '');
    if (email && !isEmail(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
    payload.email = email;
  }
  if (hasField(body, 'address')) {
    payload.address = trimString(body.address || '');
    validateTextLength(errors, 'address', payload.address, LIMITS.description);
  }
  if (hasField(body, 'debt')) payload.debt = normalizeNonNegativeNumber(errors, 'debt', body.debt, 'Công nợ phải >= 0 và không vượt quá 100.000.000', { max: LIMITS.money });
  if (hasField(body, 'notes')) {
    payload.notes = trimString(body.notes || '');
    validateTextLength(errors, 'notes', payload.notes, LIMITS.notes);
  }

  return payload;
};

const validateSupplierCreate = validateBody((body, errors) => normalizeSupplier(body, errors));
const validateSupplierUpdate = validateBody((body, errors) => normalizeSupplier(body, errors, { partial: true }));

const validatePurchaseCreate = validateBody((body, errors) => {
  const supplierId = trimString(body.supplierId);
  if (!isObjectId(supplierId)) errors.push({ field: 'supplierId', message: 'Mã nhà cung cấp không hợp lệ' });
  const seenIngredients = new Set();

  const items = Array.isArray(body.items) ? body.items.map((item, index) => {
    if (!isObjectId(item.ingredient)) {
      errors.push({ field: `items.${index}.ingredient`, message: 'Mã nguyên liệu không hợp lệ' });
    }
    if (item.ingredient && seenIngredients.has(String(item.ingredient))) {
      errors.push({ field: `items.${index}.ingredient`, message: 'Nguyên liệu bị lặp trong phiếu nhập' });
    }
    seenIngredients.add(String(item.ingredient));

    return {
      ingredient: item.ingredient,
      quantity: normalizePositiveNumber(errors, `items.${index}.quantity`, item.quantity, 'Số lượng nhập phải > 0 và không vượt quá 100.000', { max: LIMITS.quantity }),
      unitPrice: normalizePositiveNumber(errors, `items.${index}.unitPrice`, item.unitPrice, 'Đơn giá nhập phải > 0 và không vượt quá 100.000.000', { max: LIMITS.money }),
    };
  }) : [];

  if (items.length === 0) errors.push({ field: 'items', message: 'Phiếu nhập phải có ít nhất 1 dòng' });

  const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : undefined;
  if (body.purchaseDate && Number.isNaN(purchaseDate.getTime())) {
    errors.push({ field: 'purchaseDate', message: 'Ngày nhập hàng không hợp lệ' });
  }
  const notes = trimString(body.notes || '');
  validateTextLength(errors, 'notes', notes, LIMITS.notes);

  return {
    supplierId,
    items,
    paidAmount: normalizeNonNegativeNumber(errors, 'paidAmount', body.paidAmount || 0, 'Số tiền đã trả phải >= 0 và không vượt quá 100.000.000', { max: LIMITS.money }),
    purchaseDate: purchaseDate || undefined,
    notes,
  };
});

const validatePayDebt = validateBody((body, errors) => ({
  amount: normalizePositiveNumber(errors, 'amount', body.amount, 'Số tiền thanh toán phải > 0 và không vượt quá 100.000.000', { max: LIMITS.money }),
}));

const normalizeUser = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên nhân viên là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }

  if (!partial || hasField(body, 'email')) {
    const email = trimString(body.email)?.toLowerCase();
    if (!isEmail(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
    payload.email = email;
  }

  if (!partial || hasField(body, 'password')) {
    const password = body.password;
    if (!partial || isNonEmptyString(password)) {
      if (typeof password !== 'string' || password.length < 6) {
        errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      payload.password = password;
    }
  }

  if (!partial || hasField(body, 'role')) {
    const role = trimString(body.role || 'staff');
    if (!['admin', 'staff', 'Nhân viên'].includes(role)) {
      errors.push({ field: 'role', message: 'Chức vụ nhân viên không hợp lệ' });
    }
    payload.role = role === 'admin' ? 'admin' : role;
  }

  if (hasField(body, 'phone')) {
    payload.phone = trimString(body.phone || '');
    validateOptionalPhone(errors, 'phone', payload.phone);
  }
  if (hasField(body, 'salary')) {
    payload.salary = normalizeNonNegativeNumber(errors, 'salary', body.salary || 0, 'Lương phải >= 0 và không vượt quá 100.000.000', { max: LIMITS.money });
  }
  if (hasField(body, 'status')) {
    const status = trimString(body.status || 'Đang làm việc');
    if (!['Đang làm việc', 'Đang nghỉ phép', 'Đã nghỉ việc'].includes(status)) {
      errors.push({ field: 'status', message: 'Trạng thái nhân viên không hợp lệ' });
    }
    payload.status = status;
  }

  return payload;
};

const validateUserCreate = validateBody((body, errors) => normalizeUser(body, errors));
const validateUserUpdate = validateBody((body, errors) => normalizeUser(body, errors, { partial: true }));

const validateProfileUpdate = validateBody((body, errors) => {
  const payload = {};

  if (hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên người dùng là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }
  if (hasField(body, 'phone')) {
    payload.phone = trimString(body.phone || '');
    validateOptionalPhone(errors, 'phone', payload.phone);
  }
  if (hasField(body, 'address')) {
    payload.address = trimString(body.address || '');
    validateTextLength(errors, 'address', payload.address, LIMITS.description);
  }
  if (hasField(body, 'addresses')) {
    const addresses = Array.isArray(body.addresses) ? body.addresses : [];
    payload.addresses = addresses.slice(0, 10).map((item = {}, index) => {
      const address = trimString(item.address || '');
      const district = trimString(item.district || '');
      const city = trimString(item.city || 'Hà Nội');
      const fullAddress = trimString(item.fullAddress || [address, district, city].filter(Boolean).join(', '));
      validateTextLength(errors, `addresses.${index}.label`, trimString(item.label || 'Địa chỉ nhận hàng'));
      validateTextLength(errors, `addresses.${index}.address`, address, LIMITS.description);
      validateTextLength(errors, `addresses.${index}.fullAddress`, fullAddress, LIMITS.description);
      return {
        id: trimString(item.id || ''),
        label: trimString(item.label || 'Địa chỉ nhận hàng'),
        address,
        district,
        city,
        fullAddress,
        isDefault: Boolean(item.isDefault),
      };
    });
  }
  if (hasField(body, 'avatar')) {
    payload.avatar = trimString(body.avatar || '');
    if (payload.avatar && !isImagePath(payload.avatar)) {
      errors.push({ field: 'avatar', message: 'Ảnh đại diện phải là JPG, PNG hoặc WEBP hợp lệ' });
    }
  }

  return payload;
});

const validatePasswordChange = validateBody((body, errors) => {
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;

  requireNonEmpty(errors, 'currentPassword', currentPassword, 'Mật khẩu hiện tại là bắt buộc');
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push({ field: 'newPassword', message: 'Mật khẩu mới không được trùng mật khẩu hiện tại' });
  }

  return { currentPassword, newPassword };
});

const normalizeShift = (body, errors, { partial = false } = {}) => {
  const payload = {};

  if (!partial || hasField(body, 'name')) {
    const name = trimString(body.name);
    requireNonEmpty(errors, 'name', name, 'Tên ca là bắt buộc');
    validateTextLength(errors, 'name', name);
    payload.name = name;
  }

  if (!partial || hasField(body, 'startTime')) {
    const startTime = new Date(body.startTime);
    if (Number.isNaN(startTime.getTime())) errors.push({ field: 'startTime', message: 'Giờ bắt đầu không hợp lệ' });
    payload.startTime = startTime;
  }

  if (!partial || hasField(body, 'endTime')) {
    const endTime = new Date(body.endTime);
    if (Number.isNaN(endTime.getTime())) errors.push({ field: 'endTime', message: 'Giờ kết thúc không hợp lệ' });
    payload.endTime = endTime;
  }

  if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
    errors.push({ field: 'endTime', message: 'Giờ kết thúc phải sau giờ bắt đầu' });
  }

  if (!partial && payload.endTime && payload.endTime < new Date()) {
    errors.push({ field: 'endTime', message: 'Giờ kết thúc ca không được ở quá khứ' });
  }

  if (hasField(body, 'staff')) {
    if (!Array.isArray(body.staff)) {
      errors.push({ field: 'staff', message: 'Danh sách nhân viên không hợp lệ' });
      payload.staff = [];
    } else {
      payload.staff = body.staff.filter(Boolean);
      payload.staff.forEach((id, index) => {
        if (!isObjectId(id)) errors.push({ field: `staff.${index}`, message: 'Mã nhân viên không hợp lệ' });
      });
    }
  }

  return payload;
};

const validateShiftCreate = validateBody((body, errors) => normalizeShift(body, errors));
const validateShiftUpdate = validateBody((body, errors) => normalizeShift(body, errors, { partial: true }));
const validateAssignStaff = validateBody((body, errors) => {
  const userId = trimString(body.userId);
  if (!isObjectId(userId)) errors.push({ field: 'userId', message: 'Mã nhân viên không hợp lệ' });
  return { userId };
});

const validateCloseShift = validateBody((body, errors) => {
  const payload = {
    actualCash: normalizeNonNegativeNumber(errors, 'actualCash', body.actualCash || 0, 'Tiền thực tế phải >= 0 và không vượt quá 100.000.000', { max: LIMITS.money }),
    notes: trimString(body.notes || ''),
  };
  validateTextLength(errors, 'notes', payload.notes, LIMITS.notes);

  if (hasField(body, 'endTime')) {
    const endTime = new Date(body.endTime);
    if (Number.isNaN(endTime.getTime())) errors.push({ field: 'endTime', message: 'Giờ kết thúc không hợp lệ' });
    payload.endTime = endTime;
  }

  return payload;
});

const validatePaymentCreate = validateBody((body, errors) => {
  const orderId = trimString(body.orderId);
  if (!isObjectId(orderId)) errors.push({ field: 'orderId', message: 'Mã đơn hàng không hợp lệ' });
  return { orderId };
});

const validateOrderStatusUpdate = validateBody((body, errors) => {
  const status = trimString(body.status);
  const allowedStatuses = ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    errors.push({ field: 'status', message: 'Trạng thái đơn hàng không hợp lệ' });
  }
  return { status };
});

const validateBannerCreate = validateBody((body, errors) => {
  const image = trimString(body.image);
  const title = trimString(body.title || '');

  requireNonEmpty(errors, 'image', image, 'Hình ảnh banner là bắt buộc');
  if (image && !isImagePath(image)) {
    errors.push({ field: 'image', message: 'Ảnh banner phải là JPG, PNG hoặc WEBP hợp lệ' });
  }
  validateTextLength(errors, 'title', title, 120);

  return { image, title };
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
  validateProfileUpdate,
  validatePasswordChange,
  validateShiftCreate,
  validateShiftUpdate,
  validateAssignStaff,
  validateCloseShift,
  validatePaymentCreate,
  validateOrderStatusUpdate,
  validateBannerCreate,
};
