const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    // Create a dummy image
    fs.writeFileSync('dummy.jpg', 'fake image content');

    const form = new FormData();
    form.append('name', 'Test Product');
    form.append('description', 'Test Description');
    form.append('price', '10');
    form.append('category', 'Test Category');
    form.append('stock', '5');
    form.append('image', fs.createReadStream('dummy.jpg'));

    // We need an admin token to create a product.
    // Let's bypass auth for a second or create a dummy user.
    // Actually it's easier to just test if multer throws.
    // I will mock the route.
  } catch (err) {
    console.error(err);
  }
}
testUpload();
