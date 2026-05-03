const express = require('express');
const router  = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/',              protect, createOrder);
router.get ('/',              protect, getOrders);
router.get ('/:id',           protect, getOrderById);
router.put ('/:id/status',    protect, adminOnly, updateOrderStatus);
router.put ('/:id/cancel',    protect, cancelOrder);

module.exports = router;
