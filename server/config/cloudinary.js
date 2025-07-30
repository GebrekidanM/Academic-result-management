require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'freedom_school_students',
    allowed_formats: ['jpeg', 'png', 'jpg'],
    transformation: [
      { width: 150, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
});

module.exports = { cloudinary, storage };
