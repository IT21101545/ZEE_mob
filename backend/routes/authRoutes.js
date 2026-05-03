const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getAllUsers, deleteUser, requestOtp, verifyOtpAndReset } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtpAndReset);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.get('/users', protect, adminOnly, getAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
