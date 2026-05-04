const express = require('express');
const router  = express.Router();
const { createReview, getProductReviews, getMyReviews, updateReview, deleteReview, getAllReviews, replyToReview, markReviewsAsRead } = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/',                          protect, upload.single('image'), createReview);
router.get ('/my',                        protect, getMyReviews);
router.get ('/product/:productId',        getProductReviews);

// Admin routes (must be before :id dynamic routes)
router.get ('/all',        protect, admin, getAllReviews);
router.put ('/mark-read',  protect, admin, markReviewsAsRead);

// Dynamic ID routes
router.put ('/:id',        protect, updateReview);
router.put ('/:id/reply',  protect, admin, replyToReview);
router.delete('/:id',      protect, admin, deleteReview);

module.exports = router;
