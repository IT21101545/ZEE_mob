const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log('No admin found');
    process.exit(1);
  }
  const products = await Product.find({ createdBy: { $exists: false } });
  console.log('Products missing createdBy:', products.length);
  for (let p of products) {
    p.createdBy = admin._id;
    await p.save();
  }
  console.log('Fixed missing createdBy fields');
  process.exit(0);
}).catch(console.error);
