const Payment = require('../models/Payment');
const Order   = require('../models/Order');
const crypto  = require('crypto');

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

    const existing = await Payment.findOne({ order: orderId, status: 'Completed' });
    if (existing) return res.status(400).json({ message: 'Order already paid' });

    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate
    const status  = success ? 'Completed' : 'Failed';
    const transactionId = success ? crypto.randomUUID() : '';

    const payment = await Payment.create({
      user: req.user._id,
      order: orderId,
      amount: order.totalAmount,
      method,
      status,
      transactionId,
    });

    // Update order status if payment succeeded
    if (success) {
      order.status = 'Processing';
      await order.save();
    }

    res.status(201).json(payment);
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
      .populate('order', 'totalAmount status')
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

// PUT /api/payments/:id/refund  (admin)
const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'Completed')
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    payment.status = 'Refunded';
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/payments/:id  (admin)
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPayment, getPayments, getPaymentById, refundPayment, deletePayment };
