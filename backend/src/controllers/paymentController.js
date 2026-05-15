const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const Order = require('../models/Order');

const getVNPay = () => new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE,
  secureSecret: process.env.VNPAY_HASH_SECRET,
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
  enableLog: false,
  loggerFn: ignoreLogger,
});

const createPayment = async (req, res) => {
  try {
    if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_HASH_SECRET) {
      return res.status(500).json({ message: 'Cấu hình VNPAY chưa đúng' });
    }

    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    // Fix IPv6 ::1 → 127.0.0.1
    let ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }

    const txnRef = `${Date.now()}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpay = getVNPay();

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL, // Phải là URL backend
      vnp_Locale: VnpLocale.VN,
      vnp_CurrCode: 'VND',
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    await Order.findByIdAndUpdate(orderId, { txnRef });

    console.log('IP:', ipAddr);
    console.log('Payment URL:', paymentUrl);
    res.json({ paymentUrl });
  } catch (error) {
    console.error('Lỗi createPayment:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const paymentReturn = async (req, res) => {
  try {
    const vnpay = getVNPay();
    const verify = vnpay.verifyReturnUrl(req.query);

    console.log('Verify result:', verify);

    if (!verify.isVerified) {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment-result?status=invalid`
      );
    }

    if (!verify.isSuccess) {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment-result?status=failed&code=${verify.vnp_ResponseCode}`
      );
    }

    await Order.findOneAndUpdate(
      { txnRef: verify.vnp_TxnRef },
      { status: 'confirmed' }
    );

    return res.redirect(
      `${process.env.CLIENT_URL}/payment-result?status=success&txnRef=${verify.vnp_TxnRef}`
    );
  } catch (error) {
    console.error('Lỗi paymentReturn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { createPayment, paymentReturn };