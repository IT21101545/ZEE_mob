const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create a mock cloudinary object so we don't break code importing it
const cloudinary = {
  uploader: {
    destroy: async () => {
      // do nothing
    }
  }
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

module.exports = { cloudinary, upload };
