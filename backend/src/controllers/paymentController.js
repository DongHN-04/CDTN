const crypto = require('crypto');
const Order = require('../models/Order');

// @desc    Tạo URL thanh toán VNPay
// @route   POST /api/payment/create
// @access  Public
const createPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Debug
    console.log('Tạo payment - orderId:', orderId, 'amount:', amount);
    console.log('VNPAY_TMN_CODE:', process.env.VNPAY_TMN_CODE);
    console.log('VNPAY_HASH_SECRET:', process.env.VNPAY_HASH_SECRET ? 'OK' : 'MISSING');

    // Kiểm tra đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    // Cho phép thanh toán nếu đơn hàng đang pending hoặc completed (tránh rắc rối)
    // Bỏ dòng kiểm tra status cũ

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    if (!tmnCode || !hashSecret) {
      return res.status(500).json({ message: 'Cấu hình VNPay thiếu, kiểm tra file .env' });
    }

    const createDate = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: amount * 100,
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: orderId,
    };

    // Sắp xếp params
    const sortedParams = {};
    Object.keys(params).sort().forEach(key => {
      sortedParams[key] = params[key];
    });

    // Tạo chữ ký
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    sortedParams.vnp_SecureHash = signed;

    // Tạo URL
    const queryString = Object.keys(sortedParams)
      .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
      .join('&');
    const paymentUrl = vnpUrl + '?' + queryString;

    res.json({ paymentUrl });
  } catch (error) {
    console.error('Lỗi createPayment:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// @desc    Xử lý kết quả trả về từ VNPay
// @route   GET /api/payment/return
// @access  Public
const paymentReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = {};
    Object.keys(vnp_Params).sort().forEach(key => {
      sortedParams[key] = vnp_Params[key];
    });

    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      if (responseCode === '00') {
        await Order.findByIdAndUpdate(orderId, { status: 'confirmed' });
        res.redirect(`http://localhost:3000/payment-result?status=success&orderId=${orderId}`);
      } else {
        res.redirect(`http://localhost:3000/payment-result?status=failed&orderId=${orderId}`);
      }
    } else {
      res.status(400).json({ message: 'Chữ ký không hợp lệ' });
    }
  } catch (error) {
    console.error('Lỗi paymentReturn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};


module.exports = { createPayment, paymentReturn };