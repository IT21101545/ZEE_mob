const Product  = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search)   filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/products  (admin)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    if (!name || !description || !price || !category)
      return res.status(400).json({ message: 'All fields are required' });

    const getBaseUrl = req => `${req.protocol}://${req.get('host')}`;
    const imageUrl      = req.file ? `${getBaseUrl(req)}/uploads/${req.file.filename}` : '';
    const imagePublicId = req.file ? req.file.filename   : '';

    const product = await Product.create({
      name, description, price, category, stock,
      image: imageUrl, imagePublicId,
      createdBy: req.user._id,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, price, category, stock } = req.body;
    product.name        = name        || product.name;
    product.description = description || product.description;
    product.price       = price       !== undefined ? price : product.price;
    product.category    = category    || product.category;
    product.stock       = stock       !== undefined ? stock : product.stock;

    if (req.file) {
      if (product.imagePublicId)
        await cloudinary.uploader.destroy(product.imagePublicId);
      const getBaseUrl = req => `${req.protocol}://${req.get('host')}`;
      product.image        = `${getBaseUrl(req)}/uploads/${req.file.filename}`;
      product.imagePublicId = req.file.filename;
    }

    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/products/:id  (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.imagePublicId)
      await cloudinary.uploader.destroy(product.imagePublicId);

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
