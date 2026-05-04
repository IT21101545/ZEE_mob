const Review  = require('../models/Review');
const Product = require('../models/Product');
const User    = require('../models/User');
const { toBase64 } = require('../config/cloudinary');
const { createNotification } = require('./notificationController');

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await Review.findOne({ user: req.user._id, product: productId });
    if (exists)
      return res.status(400).json({ message: 'You already reviewed this product' });

    const image = toBase64(req.file);

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating: Number(rating),
      comment,
      image,
    });

    await review.populate('user', 'name');

    // Notify all admins about new review
    const product = await Product.findById(productId);
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        type: 'new_review',
        title: 'New Review',
        message: `${req.user.name} rated "${product?.name || 'a product'}" ${rating}★: "${comment}"`,
        product: productId,
        review: review._id
      });
    }

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/product/:productId
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ reviews, avgRating, total: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/my
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name image');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/reviews/:id
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });

    review.rating  = req.body.rating  || review.rating;
    review.comment = req.body.comment || review.comment;
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/all (admin)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/reviews/:id/reply (admin)
const replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ message: 'Reply cannot be empty' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.adminReply = reply;
    await review.save();

    // Notify the customer about admin reply
    const product = await Product.findById(review.product);
    await createNotification({
      recipient: review.user,
      type: 'review_reply',
      title: 'Admin Replied to Your Review',
      message: `Admin replied: "${reply}" on "${product?.name || 'your review'}"`,
      product: review.product,
      review: review._id
    });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Allow deletion if user is admin OR the one who wrote the review
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/reviews/mark-read (admin)
const markReviewsAsRead = async (req, res) => {
  try {
    await Review.updateMany({ isAdminRead: false }, { isAdminRead: true });
    res.json({ message: 'Reviews marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReview, getProductReviews, getMyReviews, updateReview, getAllReviews, replyToReview, deleteReview, markReviewsAsRead };
