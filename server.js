const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));

app.get('/', (req, res) => res.json({ message: 'ShopMate API running' }));

// One-time migration: fix broken Windows file paths in DB
const Review = require('./models/Review');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
app.get('/api/fix-urls', async (req, res) => {
  try {
    const baseUrl = process.env.SERVER_URL || 'http://192.168.1.3:5000';
    const fixed = { products: 0, reviews: 0, users: 0 };

    // Fix products
    const products = await Product.find({});
    for (const p of products) {
      let changed = false;
      if (p.image && (p.image.startsWith('C:') || p.image.startsWith('c:'))) {
        const filename = p.image.split('\\').pop().split('/').pop();
        p.image = `${baseUrl}/uploads/${filename}`;
        changed = true;
      }
      if (!p.image && p.imagePublicId) {
        p.image = `${baseUrl}/uploads/${p.imagePublicId}`;
        changed = true;
      }
      if (changed) { await p.save(); fixed.products++; }
    }

    // Fix reviews
    const reviews = await Review.find({});
    for (const r of reviews) {
      let changed = false;
      if (r.image && (r.image.startsWith('C:') || r.image.startsWith('c:'))) {
        const filename = r.image.split('\\').pop().split('/').pop();
        r.image = `${baseUrl}/uploads/${filename}`;
        changed = true;
      }
      if (changed) { await r.save(); fixed.reviews++; }
    }

    // Fix users
    const users = await User.find({});
    for (const u of users) {
      let changed = false;
      if (u.avatar && (u.avatar.startsWith('C:') || u.avatar.startsWith('c:'))) {
        const filename = u.avatar.split('\\').pop().split('/').pop();
        u.avatar = `${baseUrl}/uploads/${filename}`;
        changed = true;
      }
      if (changed) { await u.save(); fixed.users++; }
    }

    res.json({ message: 'Migration complete', fixed, baseUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Connect DB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    
    // Auto-seed products if empty
    Product.countDocuments().then(async count => {
      if (count === 0) {
        console.log('No products found. Seeding sample products...');
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
           admin = new User({
              name: 'Admin Seeder',
              email: 'admin@admin.com',
              password: 'password123',
              role: 'admin'
           });
           await admin.save();
        }
        const sampleProducts = [
          {
            name: 'Premium Cotton Shirt Fabric',
            description: 'High-quality 100% cotton fabric perfect for formal shirts. Breathable and comfortable.',
            price: 25.99,
            category: 'Cotton',
            sizes: ['S', 'M', 'L', 'XL'],
            stock: 150,
            image: 'https://images.unsplash.com/photo-1528318269466-69f94356e9f6?q=80&w=800&auto=format&fit=crop',
            createdBy: admin._id
          },
          {
            name: 'Silk Blend Saree Material',
            description: 'Elegant silk blend material with intricate zari work. Ideal for festive wear and weddings.',
            price: 85.50,
            category: 'Silk',
            sizes: ['M', 'L'],
            stock: 50,
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
            createdBy: admin._id
          },
          {
            name: 'Organic Linen Trouser Fabric',
            description: 'Lightweight organic linen, pre-shrunk and dyed with eco-friendly colors. Perfect for summer trousers.',
            price: 35.00,
            category: 'Linen',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
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
      }
    });

    // Auto-fix broken Windows file paths in DB
    const fixUrls = async () => {
      const baseUrl = process.env.SERVER_URL || 'http://192.168.1.3:5000';
      let totalFixed = 0;

      // Fix products
      const products = await Product.find({});
      for (const p of products) {
        if (p.image && (p.image.startsWith('C:') || p.image.startsWith('c:'))) {
          const filename = p.image.replace(/\\/g, '/').split('/').pop();
          p.image = `${baseUrl}/uploads/${filename}`;
          await p.save();
          totalFixed++;
        } else if (!p.image && p.imagePublicId) {
          p.image = `${baseUrl}/uploads/${p.imagePublicId}`;
          await p.save();
          totalFixed++;
        }
      }

      // Fix reviews
      const reviews = await Review.find({});
      for (const r of reviews) {
        if (r.image && (r.image.startsWith('C:') || r.image.startsWith('c:'))) {
          const filename = r.image.replace(/\\/g, '/').split('/').pop();
          r.image = `${baseUrl}/uploads/${filename}`;
          await r.save();
          totalFixed++;
        }
      }

      // Fix users
      const users = await User.find({});
      for (const u of users) {
        if (u.avatar && (u.avatar.startsWith('C:') || u.avatar.startsWith('c:'))) {
          const filename = u.avatar.replace(/\\/g, '/').split('/').pop();
          u.avatar = `${baseUrl}/uploads/${filename}`;
          await u.save();
          totalFixed++;
        }
      }

      if (totalFixed > 0) console.log(`Fixed ${totalFixed} broken image URLs`);
    };
    fixUrls().catch(err => console.error('URL fix error:', err.message));

    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error(err));
