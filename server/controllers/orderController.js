const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require("mongoose");
// Create new order (Buy Now or Checkout)
const createOrder = async (req, res) => {
  try {
    const { items, address, totalAmount, orderType = 'direct' } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    // Validate each item and calculate total
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Find the variant
      const variant = product.variants.find(v => v.weight === item.variant?.weight);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant not found for product: ${product.name}`
        });
      }

      const itemTotal = variant.price * item.quantity;
      calculatedTotal += itemTotal;

 validatedItems.push({
  productId: product._id,

  shopId: product.shopId,   // ✅ COPY shopId FROM PRODUCT

  variant: {
    weight: variant.weight,
    price: variant.price
  },

  quantity: item.quantity,
  itemTotal
});
    }

    // Create the order
const order = new Order({
  customerId: userId,
  items: validatedItems,
  address,
  status: "Placed",
  totalAmount: calculatedTotal,
  orderType,
  paymentStatus: "Paid",             // ✅ mark paid here
  paymentMethod: "Online",

  razorpayOrderId: req.body.razorpayOrderId,   // ✅ attach Razorpay order id
  razorpayPaymentId: req.body.razorpayPaymentId, // ✅ payment id

  orderNumber: generateOrderNumber()
});



    await order.save();

    // Populate the order with product details
    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category');

    // If this was a cart checkout, clear the cart
    if (orderType === 'checkout') {
      await Cart.findOneAndUpdate(
        { user: userId },
        { items: [] }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let query = { customerId: userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get single order details
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      customerId: userId
    })
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status (for admin or system)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const validStatuses = ['Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      customerId: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['Placed', 'Confirmed', 'Processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'Cancelled';
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category');

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Get order statistics


const getOrderStats = async (req, res) => {
  try {
    // ✅ Convert string id to ObjectId for aggregation
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 🔍 DEBUG: Check stored orders
    const allOrders = await Order.find({ customerId: userId });

    console.log("==== ALL USER ORDERS ====");
    allOrders.forEach(o => {
      console.log({
        id: o._id,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount
      });
    });
    console.log("==========================");

    // ✅ Count all user orders
    const totalOrders = await Order.countDocuments({
      customerId: userId
    });

    // ✅ Breakdown by order status
    const stats = await Order.aggregate([
      { $match: { customerId: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // ✅ Revenue ONLY from PAID orders
    const totalSpentAgg = await Order.aggregate([
      {
        $match: {
          customerId: userId,
          paymentStatus: "Paid"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalSpent = totalSpentAgg[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalSpent,
        statusBreakdown: stats.reduce((acc, s) => {
          acc[s._id] = {
            count: s.count,
            totalAmount: s.totalAmount
          };
          return acc;
        }, {})
      }
    });

  } catch (err) {
    console.error("❌ getOrderStats error:", err);
    res.status(500).json({ success: false });
  }
};


// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-8)}${random}`;
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
};