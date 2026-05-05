require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a user to act as the creator, or create an admin if none exists
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne({});
      if (!admin) {
        admin = new User({
          name: 'Admin Seeder',
          email: 'admin@admin.com',
          password: 'password123',
          role: 'admin'
        });
        await admin.save();
      }
    }

    const sampleProducts = [
      {
        name: 'Premium Cotton Shirt Fabric',
        description: 'High-quality 100% cotton fabric perfect for formal shirts. Breathable and comfortable.',
        price: 25.99,
        category: 'Cotton',
        stock: 150,
        image: 'https://images.unsplash.com/photo-1528318269466-69f94356e9f6?q=80&w=800&auto=format&fit=crop',
        createdBy: admin._id
      },
      {
        name: 'Silk Blend Saree Material',
        description: 'Elegant silk blend material with intricate zari work. Ideal for festive wear and weddings.',
        price: 85.50,
        category: 'Silk',
        stock: 50,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
        createdBy: admin._id
      },
      {
        name: 'Organic Linen Trouser Fabric',
        description: 'Lightweight organic linen, pre-shrunk and dyed with eco-friendly colors. Perfect for summer trousers.',
        price: 35.00,
        category: 'Linen',
        stock: 200,
        image: 'https://images.unsplash.com/photo-1596755498863-7c3858c857dd?q=80&w=800&auto=format&fit=crop',
        createdBy: admin._id
      },
      {
        name: 'Velvet Upholstery Cloth',
        description: 'Plush velvet fabric suitable for luxury furniture upholstery and heavy drapery.',
        price: 45.00,
        category: 'Velvet',
        stock: 80,
        image: 'https://images.unsplash.com/photo-1574342261621-e23363df023e?q=80&w=800&auto=format&fit=crop',
        createdBy: admin._id
      },
      {
        name: 'Georgette Floral Print',
        description: 'Flowy georgette fabric with vibrant floral digital prints. Great for summer dresses.',
        price: 18.50,
        category: 'Georgette',
        stock: 300,
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=800&auto=format&fit=crop',
        createdBy: admin._id
      }
    ];

    await Product.insertMany(sampleProducts);
    console.log('Sample products added successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
};

seedProducts();
