const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Create new order
router.post('/', authMiddleware, orderController.createOrder);

// Get user's orders
router.get('/', authMiddleware, orderController.getUserOrders);

// Get order statistics
router.get('/stats', authMiddleware, orderController.getOrderStats);

// Get single order by ID
router.get('/:orderId', authMiddleware, orderController.getOrderById);

// Update order status (for admin/system use)
router.put('/:orderId/status', authMiddleware, orderController.updateOrderStatus);

// Cancel order
router.put('/:orderId/cancel', authMiddleware, orderController.cancelOrder);

module.exports = router;