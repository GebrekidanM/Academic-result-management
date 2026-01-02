const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

const libraryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    
    // --- CASE A: COVER IMAGE ---
    if (file.fieldname === 'cover') {
        return {
            folder: 'freedom_school_library_covers',
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            transformation: [{ width: 300, height: 400, crop: 'fill' }], // Resize for performance
            public_id: `cover-${Date.now()}`
        };
    }

    // --- CASE B: MAIN FILE (Book/Note) ---
    // If it's a PDF, treat as raw. If it's an image (e.g. worksheet photo), treat as image.
    if (file.mimetype === 'application/pdf') {
      return {
        folder: 'freedom_school_library_docs',
        resource_type: 'raw', 
        access_mode: 'public', // Important
        format: 'pdf',
        public_id: `doc-${Date.now()}-${file.originalname.split('.')[0]}`
      };
    }
    
    return {
      folder: 'freedom_school_library_images',
      resource_type: 'image',
      access_mode: 'public',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: `img-${Date.now()}`
    };
  },
});

const libraryUpload = multer({
  storage: libraryStorage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover') {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Cover must be an image file'), false);
        }
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 10 }
});

module.exports = libraryUpload;