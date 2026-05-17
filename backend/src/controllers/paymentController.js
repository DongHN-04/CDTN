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
    if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_HASH_SECRET || !process.env.VNPAY_RETURN_URL) {
      return res.status(500).json({ message: 'Cau hinh VNPAY chua dung' });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Khong tim thay don hang' });
    if (order.total <= 0) return res.status(400).json({ message: 'Gia tri don hang khong hop le' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Chi thanh toan online cho don dang cho xac nhan' });
    if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Don hang da duoc thanh toan' });

    let ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }

    const txnRef = `${Date.now()}-${order._id}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpay = getVNPay();

    const paymentUrl = vnpay.buildPaymentUrl({
      // Khong tin amount tu client; so tien thanh toan lay tu don hang trong DB.
      vnp_Amount: order.total,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_Locale: VnpLocale.VN,
      vnp_CurrCode: 'VND',
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    await Order.findByIdAndUpdate(orderId, {
      txnRef,
      paymentMethod: 'qr',
      paymentStatus: 'unpaid',
    });

    res.json({ paymentUrl });
  } catch (error) {
    console.error('Loi createPayment:', error);
    res.status(500).json({ message: 'Loi server' });
  }
};

const paymentReturn = async (req, res) => {
  try {
    if (!process.env.CLIENT_URL) {
      return res.status(500).json({ message: 'Chua cau hinh CLIENT_URL' });
    }

    const vnpay = getVNPay();
    const verify = vnpay.verifyReturnUrl(req.query);

    if (!verify.isVerified) {
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=invalid`);
    }

    if (!verify.isSuccess) {
      await Order.findOneAndUpdate(
        { txnRef: verify.vnp_TxnRef },
        { paymentStatus: 'failed' }
      );

      return res.redirect(
        `${process.env.CLIENT_URL}/payment-result?status=failed&code=${verify.vnp_ResponseCode}`
      );
    }

    const order = await Order.findOne({ txnRef: verify.vnp_TxnRef });
    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=invalid`);
    }

    // Thu vien vnpay tra vnp_Amount ve don vi VND; phai khop tong tien trong DB.
    if (Number(verify.vnp_Amount) !== Number(order.total)) {
      order.paymentStatus = 'failed';
      await order.save();
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=invalid-amount`);
    }

    // Thanh toan thanh cong chi danh dau paid; staff van can confirm de tru kho.
    order.paymentStatus = 'paid';
    await order.save();

    return res.redirect(
      `${process.env.CLIENT_URL}/payment-result?status=success&txnRef=${verify.vnp_TxnRef}`
    );
  } catch (error) {
    console.error('Loi paymentReturn:', error);
    res.status(500).json({ message: 'Loi server' });
  }
};

module.exports = { createPayment, paymentReturn };
