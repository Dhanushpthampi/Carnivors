const Order = require('../models/Order');
const Product = require('../models/Product');

// Get orders for shop owner
const getShopOrders = async (req, res) => {
  try {
    const shopId = req.user.id; // Assuming shop owner is logged in
    const { status, page = 1, limit = 10 } = req.query;

    // Find all products belonging to this shop
    const shopProducts = await Product.find({ shopId }).select('_id');
    const productIds = shopProducts.map(p => p._id);

    // Build query to find orders containing shop's products
    let matchQuery = {
      'items.productId': { $in: productIds }
    };

    if (status) {
      matchQuery.status = status;
    }

    // Aggregate to get orders with shop's products only
    const orders = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$_id',
          orderNumber: { $first: '$orderNumber' },
          customerId: { $first: '$customerId' },
          address: { $first: '$address' },
          status: { $first: '$status' },
          paymentStatus: { $first: '$paymentStatus' },
          paymentMethod: { $first: '$paymentMethod' },
          totalAmount: { $first: '$totalAmount' },
          orderType: { $first: '$orderType' },
          createdAt: { $first: '$createdAt' },
          items: { $push: '$items' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    // Populate customer and product details
    await Order.populate(orders, [
      { path: 'customerId', select: 'name email phone' },
      { path: 'items.productId', select: 'name image category' }
    ]);

    const totalOrders = await Order.countDocuments(matchQuery);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get shop orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Update order status by shop owner
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const shopId = req.user.id;

    const validStatuses = ['Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // Verify this shop owns products in this order
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if shop owns any products in this order
    const shopOwnsProducts = order.items.some(item => 
      item.productId.shopId.toString() === shopId
    );

    if (!shopOwnsProducts) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order'
      });
    }

    // Update order
    const updateData = { status };
    if (notes) updateData.notes = notes;

    // Set delivery date if delivered
    if (status === 'Delivered') {
      updateData.actualDelivery = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Get order statistics for shop
const getShopOrderStats = async (req, res) => {
  try {
    const shopId = req.user.id;

    // Find all products belonging to this shop
    const shopProducts = await Product.find({ shopId }).select('_id');
    const productIds = shopProducts.map(p => p._id);

    const stats = await Order.aggregate([
      { $match: { 'items.productId': { $in: productIds } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$items.itemTotal' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments({
      'items.productId': { $in: productIds }
    });

    const totalRevenue = await Order.aggregate([
      { $match: { 'items.productId': { $in: productIds }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      { $group: { _id: null, total: { $sum: '$items.itemTotal' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount
          };
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get shop stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shop statistics',
      error: error.message
    });
  }
};

// Accept/Reject order
const handleOrderDecision = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { decision, reason } = req.body; // decision: 'accept' or 'reject'
    const shopId = req.user.id;

    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be "accept" or "reject"'
      });
    }

    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if shop owns products in this order
    const shopOwnsProducts = order.items.some(item => 
      item.productId.shopId.toString() === shopId
    );

    if (!shopOwnsProducts) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to handle this order'
      });
    }

    // Only allow this for newly placed orders
    if (order.status !== 'Placed') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been processed'
      });
    }

    const updateData = {
      status: decision === 'accept' ? 'Confirmed' : 'Cancelled'
    };

    if (decision === 'reject' && reason) {
      updateData.cancellationReason = reason;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category');

    res.json({
      success: true,
      message: `Order ${decision}ed successfully`,
      order: updatedOrder
    });

  } catch (error) {
    console.error('Handle order decision error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing order decision',
      error: error.message
    });
  }
};

module.exports = {
  getShopOrders,
  updateOrderStatus,
  getShopOrderStats,
  handleOrderDecision
};