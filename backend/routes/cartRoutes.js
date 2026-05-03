const express = require('express');
const router  = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/CartController');
const { protect } = require('../middleware/authMiddleware');

router.get   ('/',                    protect, getCart);
router.post  ('/add',                 protect, addToCart);
router.put   ('/update',              protect, updateCartItem);
router.delete('/remove/:productId',   protect, removeFromCart);
router.delete('/clear',               protect, clearCart);

module.exports = router;
