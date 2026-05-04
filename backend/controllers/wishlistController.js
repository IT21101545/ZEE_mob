const User = require('../models/User');

// GET /api/wishlist (protected)
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/wishlist (protected)
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    
    const populatedUser = await User.findById(req.user._id).populate('wishlist');
    res.json(populatedUser.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/wishlist/:productId (protected)
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();
    
    const populatedUser = await User.findById(req.user._id).populate('wishlist');
    res.json(populatedUser.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
