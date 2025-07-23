const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  }
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// ✅ IMPORTANT: Put specific routes BEFORE parameterized routes

// ✅ General routes
router.get('/', productController.getAllProducts);
router.post('/', authMiddleware, upload.single('image'), handleMulterError, productController.createProduct);

// ✅ Shop-specific routes (for shop dashboard)
router.get('/my-products', authMiddleware, productController.getShopProducts);

// ✅ Other specific routesb  
router.get('/similar', productController.getSimilarProducts);
router.get('/more-from-shop', productController.getMoreFromShop);

// ✅ Parameterized routes should come LAST
router.get('/:id', productController.getProductById);
router.put('/:id', authMiddleware, upload.single('image'), handleMulterError, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;