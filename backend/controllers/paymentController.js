const Payment      = require('../models/Payment');
const Order        = require('../models/Order');
const Notification = require('../models/Notification');
const crypto       = require('crypto');
const path         = require('path');

// POST /api/payments
const createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId || !method)
      return res.status(400).json({ message: 'orderId and method are required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });

    const existing = await Payment.findOne({ order: orderId, status: { $in: ['Completed', 'PendingReview'] } });
    if (existing) return res.status(400).json({ message: 'Order already paid or awaiting review' });

    let status = 'Pending';
    let transactionId = '';

    if (method === 'Cash') {
      // Cash on Delivery — stays Pending until admin confirms
      status = 'Pending';
    } else if (method === 'BankTransfer') {
      // Bank Transfer — awaits admin review of receipt
      status = 'PendingReview';
    } else {
      // CreditCard / DebitCard — simulate payment processing (100% success)
      const success = true;
      status = success ? 'Completed' : 'Failed';
      transactionId = success ? crypto.randomUUID() : '';

      // Update order status immediately if card payment succeeded
      if (success) {
        order.status = 'Processing';
        await order.save();
      }
    }

    const payment = await Payment.create({
      user: req.user._id,
      order: orderId,
      amount: order.totalAmount,
      method,
      status,
      transactionId,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payments/:id/receipt  (customer uploads bank transfer receipt)
const uploadReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    if (payment.method !== 'BankTransfer')
      return res.status(400).json({ message: 'Receipt upload only for BankTransfer payments' });
    if (!req.file)
      return res.status(400).json({ message: 'Receipt image is required' });

    const getBaseUrl = req => `${req.protocol}://${req.get('host')}`;
    payment.receiptImage = `${getBaseUrl(req)}/uploads/${req.file.filename}`;
    payment.status = 'PendingReview';
    await payment.save();

    res.json({ message: 'Receipt uploaded successfully', receiptImage: payment.receiptImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments  (admin all, user own)
const getPayments = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('order', 'totalAmount status address')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/:id
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('order');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/payments/:id/confirm  (admin) — confirms payment, updates order to Processing
const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (!['Pending', 'PendingReview'].includes(payment.status))
      return res.status(400).json({ message: 'Only Pending or PendingReview payments can be confirmed' });

    payment.status = 'Completed';
    if (!payment.transactionId) {
      payment.transactionId = crypto.randomUUID();
    }
    await payment.save();

    // Update order status to Processing
    const order = await Order.findById(payment.order);
    if (order && order.status === 'Pending') {
      order.status = 'Processing';
      await order.save();
    }

    // Notify the customer
    await Notification.create({
      user:    payment.user,
      title:   '✅ Payment Confirmed',
      message: `Your payment of $${payment.amount.toFixed(2)} has been confirmed by admin. Your order is now being processed!`,
      type:    'payment_confirmed',
    });

    res.json({ message: 'Payment confirmed', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/payments/:id/cancel  (admin) — cancels payment and order
const cancelPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (['Completed', 'Refunded', 'Cancelled'].includes(payment.status))
      return res.status(400).json({ message: 'Payment cannot be cancelled in its current state' });

    payment.status = 'Cancelled';
    await payment.save();

    // Cancel associated order
    const order = await Order.findById(payment.order);
    if (order && order.status !== 'Cancelled') {
      // Restore stock
      const Product = require('../models/Product');
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
      order.status = 'Cancelled';
      await order.save();
    }

    // Notify the customer
    await Notification.create({
      user:    payment.user,
      title:   '❌ Payment Cancelled',
      message: `Your payment of $${payment.amount.toFixed(2)} has been cancelled by admin. Please contact support if you have any questions.`,
      type:    'payment_deleted',
    });

    res.json({ message: 'Payment cancelled', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/payments/:id/refund  (admin)
const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'Completed')
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    payment.status = 'Refunded';
    await payment.save();

    // Notify the customer
    await Notification.create({
      user:    payment.user,
      title:   '💰 Refund Processed',
      message: `Your refund of $${payment.amount.toFixed(2)} has been processed. Please allow 3-5 business days for it to reflect in your account.`,
      type:    'payment_refunded',
    });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/payments/:id  (admin)
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Notify the customer before deleting
    await Notification.create({
      user:    payment.user,
      title:   '🗑️ Payment Record Removed',
      message: `Your payment record of $${payment.amount.toFixed(2)} has been removed by admin. If you believe this is an error, please contact support.`,
      type:    'payment_deleted',
    });

    await payment.deleteOne();
    res.json({ message: 'Payment record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPayment, uploadReceipt, getPayments, getPaymentById, confirmPayment, cancelPayment, refundPayment, deletePayment };
