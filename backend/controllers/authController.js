const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    // Automatically assign admin role if email ends with @admin.com
    let assignedRole = role || 'user';
    if (email.toLowerCase().endsWith('@admin.com')) {
      assignedRole = 'admin';
    }

    const user = await User.create({ name, email, password, role: assignedRole });

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/profile  (protected)
const getProfile = async (req, res) => {
  res.json(req.user);
};

// PUT /api/auth/profile  (protected)
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name   = req.body.name   || user.name;
    user.email  = req.body.email  || user.email;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.password) user.password = req.body.password;

    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/users  (admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/auth/users/:id  (admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/request-otp
const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send real email using nodemailer
    try {
      await sendEmail({
        email: user.email,
        subject: 'ShopMate - Your Password Reset OTP',
        message: `Your One-Time Password (OTP) for resetting your ShopMate account is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`
      });
      console.log(`Email successfully sent to ${user.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }

    res.json({ message: 'OTP sent successfully to your email!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp
const verifyOtpAndReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify OTP and Expiration
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }
    
    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ message: 'OTP code has expired' });
    }

    // Valid OTP, reset password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers, deleteUser, requestOtp, verifyOtpAndReset };
