const express = require('express');
const router  = express.Router();
const { createPayment, getPayments, getPaymentById, refundPayment, deletePayment } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/',              protect, createPayment);
router.get ('/',              protect, getPayments);
router.get ('/:id',           protect, getPaymentById);
router.put ('/:id/refund',    protect, adminOnly, refundPayment);
router.delete('/:id',         protect, adminOnly, deletePayment);

module.exports = router;
