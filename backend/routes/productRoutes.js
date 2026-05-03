const express = require('express');
const router  = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get ('/',    getProducts);
router.get ('/:id', getProductById);
router.post('/',    protect, adminOnly, upload.single('image'), createProduct);
router.put ('/:id', protect, adminOnly, upload.single('image'), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
