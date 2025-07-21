const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

// Add item to cart
router.post('/add', authMiddleware, cartController.addToCart);

// Get user's cart - Fixed route path
router.get('/', authMiddleware, cartController.getCart);

// Update cart item quantity
router.put('/update', authMiddleware, cartController.updateCartItem);

// Remove item from cart
router.delete('/remove', authMiddleware, cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', authMiddleware, cartController.clearCart);

module.exports = router;