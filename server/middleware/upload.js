const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new Error('File is not an image.'), false);
    }
  },
  limits: { fileSize: 1024 * 1024 * 5 }
});

module.exports = upload;