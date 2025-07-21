const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const productController = require('../controllers/productController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ IMPORTANT: Put specific routes BEFORE parameterized routes


// ✅ General routes
router.get('/', productController.getAllProducts);
router.post('/', authMiddleware, upload.single('image'), productController.createProduct);

router.get('/similar', productController.getSimilarProducts);
router.get('/more-from-shop', productController.getMoreFromShop);
// ✅ Parameterized routes should come LAST
router.get('/:id', productController.getProductById);

module.exports = router;