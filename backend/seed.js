const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const User = require('./models/User');

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get an admin user or any user to assign as creator
    let user = await User.findOne();
    if (!user) {
      console.log('Creating dummy admin user...');
      user = await User.create({
        name: 'Admin',
        email: 'admin@shopmate.com',
        password: 'password123',
        role: 'admin'
      });
    }

    const dummyProducts = [
      {
        name: 'Premium Silk Saree',
        description: 'Elegant pure silk saree with intricate gold zari work, perfect for weddings and festive occasions.',
        price: 150.00,
        category: 'Women',
        stock: 25,
        image: 'https://picsum.photos/seed/saree/800/800',
        createdBy: user._id
      },
      {
        name: 'Classic Cotton Shirt',
        description: 'Breathable, 100% pure cotton button-down shirt for men. Ideal for office or casual wear.',
        price: 35.50,
        category: 'Men',
        stock: 100,
        image: 'https://picsum.photos/seed/shirt/800/800',
        createdBy: user._id
      },
      {
        name: 'Vintage Denim Jacket',
        description: 'Rugged, high-quality denim jacket with a classic vintage wash and durable stitching.',
        price: 85.00,
        category: 'Outerwear',
        stock: 40,
        image: 'https://picsum.photos/seed/jacket/800/800',
        createdBy: user._id
      },
      {
        name: 'Linen Summer Trousers',
        description: 'Lightweight and comfortable linen trousers, designed to keep you cool during the summer heat.',
        price: 45.00,
        category: 'Men',
        stock: 60,
        image: 'https://picsum.photos/seed/trousers/800/800',
        createdBy: user._id
      },
      {
        name: 'Floral Chiffon Dress',
        description: 'Beautiful flowing chiffon dress featuring a vibrant floral print and a flattering waistline.',
        price: 65.99,
        category: 'Women',
        stock: 35,
        image: 'https://picsum.photos/seed/dress/800/800',
        createdBy: user._id
      },
      {
        name: 'Handwoven Woolen Scarf',
        description: 'Cozy and warm handwoven scarf made from premium merino wool.',
        price: 25.00,
        category: 'Accessories',
        stock: 80,
        image: 'https://picsum.photos/seed/scarf/800/800',
        createdBy: user._id
      }
    ];

    // Clear existing products
    await Product.deleteMany();
    console.log('Cleared existing products');

    // Insert dummy products
    await Product.insertMany(dummyProducts);
    console.log('Successfully seeded 6 dummy products');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedProducts();
