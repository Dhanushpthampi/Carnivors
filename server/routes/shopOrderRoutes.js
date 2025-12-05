const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const shopOrderController = require('../controllers/shopOrderController');

// ✅ Correct role check
const isShopOwner = (req, res, next) => {
  if (req.user.role !== 'shop') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Shop privileges required.'
    });     
  }
  next();
};

// Get all orders for shop
router.get('/', authMiddleware, isShopOwner, shopOrderController.getShopOrders);

// Get shop order statistics
router.get('/stats', authMiddleware, isShopOwner, shopOrderController.getShopOrderStats);

// Accept or reject an order
router.put('/:orderId/decision', authMiddleware, isShopOwner, shopOrderController.handleOrderDecision);

// Update order status
router.put('/:orderId/status', authMiddleware, isShopOwner, shopOrderController.updateOrderStatus);

module.exports = router;
