const express = require('express');
const router  = express.Router();
const {
  createPayment,
  uploadReceipt,
  getPayments,
  getPaymentById,
  confirmPayment,
  cancelPayment,
  refundPayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/',                 protect, createPayment);
router.post('/:id/receipt',      protect, upload.single('receipt'), uploadReceipt);
router.get ('/',                 protect, getPayments);
router.get ('/:id',              protect, getPaymentById);
router.put ('/:id/confirm',      protect, adminOnly, confirmPayment);
router.put ('/:id/cancel',       protect, adminOnly, cancelPayment);
router.put ('/:id/refund',       protect, adminOnly, refundPayment);
router.delete('/:id',            protect, adminOnly, deletePayment);

module.exports = router;
