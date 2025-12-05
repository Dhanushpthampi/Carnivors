const Order = require('../models/Order')

// ================================
// ✅ GET SHOP ORDERS (SECURE)
// ================================
const getShopOrders = async (req, res) => {
  try {
    const shopId = req.user.id
    const { status, page = 1, limit = 10 } = req.query

    const query = {
      "items.shopId": shopId
    }

    if (status) query.status = status

    let orders = await Order.find(query)
      .populate("customerId", "name email phone")
      .populate("items.productId", "name image category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)

    const totalOrders = await Order.countDocuments(query)

    // ✅ FILTER EACH ORDER TO ONLY INCLUDE
    // ✅ ITEMS THAT BELONG TO THIS SHOP
    orders = orders.map(order => {
      const filteredItems = order.items.filter(
        item => item.shopId.toString() === shopId
      )

      const shopTotal = filteredItems.reduce(
        (sum, item) => sum + item.itemTotal,
        0
      )

      return {
        ...order.toObject(),
        items: filteredItems,
        totalAmount: shopTotal,   // ✅ Only shop revenue
      }
    })

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1,
      }
    })
  } catch (err) {
    console.error('❌ Get shop orders error:', err)
    res.status(500).json({ success: false })
  }
}



// ================================
// ✅ UPDATE ORDER STATUS
// ================================
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params
    const { status, notes } = req.body
    const shopId = req.user.id

    const validStatuses = [
      'Placed','Confirmed','Processing',
      'Packed','Shipped','Out for Delivery',
      'Delivered','Cancelled'
    ]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // ✅ ENSURE SHOP OWNS AT LEAST ONE ITEM
    const shopOwns = order.items.some(
      item => item.shopId.toString() === shopId
    )

    if (!shopOwns) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    const updateData = { status }

    if (notes) updateData.notes = notes
    if (status === 'Delivered')
      updateData.actualDelivery = new Date()

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
      .populate("customerId", "name email phone")
      .populate("items.productId", "name image category")

    // ✅ RETURN ONLY SHOP ITEMS
    updatedOrder.items = updatedOrder.items.filter(
      item => item.shopId.toString() === shopId
    )

    res.json({
      success: true,
      order: updatedOrder,
      message: "Order status updated"
    })

  } catch (err) {
    console.error("❌ Status update error:", err)
    res.status(500).json({
      success: false,
      message: "Update failed"
    })
  }
}



// ================================
// ✅ SHOP ORDER STATS
// ================================
const mongoose = require("mongoose")

const getShopOrderStats = async (req, res) => {
  try {
    const shopId = req.user.id
    const shopObjectId = new mongoose.Types.ObjectId(shopId)

    const stats = await Order.aggregate([
      { $unwind: "$items" },

      // ✅ FIXED MATCH
      { $match: { "items.shopId": shopObjectId } },

      {
        $group: {
          _id: {
            status: "$status",
            paymentStatus: "$paymentStatus"
          },
          orderCount: { $sum: 1 },
          revenue: { $sum: "$items.itemTotal" }
        }
      }
    ])

    console.log("==== RAW STATS FROM MONGO ====")
    console.dir(stats, { depth: null })
    console.log("================================")

    const totalRevenue = stats
      .filter(s => s._id.paymentStatus === "Paid")
      .reduce((sum, s) => sum + s.revenue, 0)

    console.log("✅ CALCULATED TOTAL REVENUE:", totalRevenue)

    const statusBreakdown = {}

    stats.forEach(s => {
      const status = s._id.status

      if (!statusBreakdown[status]) {
        statusBreakdown[status] = {
          count: 0,
          revenue: 0
        }
      }

      statusBreakdown[status].count += s.orderCount

      if (s._id.paymentStatus === "Paid") {
        statusBreakdown[status].revenue += s.revenue
      }
    })

    const totalOrders = await Order.countDocuments({
      "items.shopId": shopObjectId
    })

    return res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        statusBreakdown
      }
    })
  } catch (err) {
    console.error("❌ Stats error:", err)
    res.status(500).json({ success: false })
  }
}






// ================================
// ✅ ACCEPT / REJECT ORDER
// ================================
const handleOrderDecision = async (req, res) => {
  try {
    const { orderId } = req.params
    const { decision, reason } = req.body
    const shopId = req.user.id

    if (!["accept", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be accept or reject'
      })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    const ownsItems = order.items.some(
      item => item.shopId.toString() === shopId
    )

    if (!ownsItems) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      })
    }

    if (order.status !== "Placed") {
      return res.status(400).json({
        success: false,
        message: "Order already processed"
      })
    }

    const updateData = {
      status: decision === "accept" ? "Confirmed" : "Cancelled"
    }

    if (decision === "reject")
      updateData.cancellationReason = reason

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
      .populate("customerId", "name email phone")
      .populate("items.productId", "name image category")

    updatedOrder.items = updatedOrder.items.filter(
      item => item.shopId.toString() === shopId
    )

    res.json({
      success: true,
      order: updatedOrder,
      message: `Order ${decision}ed`
    })

  } catch (err) {
    console.error("❌ Decision error:", err)
    res.status(500).json({
      success: false
    })
  }
}



module.exports = {
  getShopOrders,
  updateOrderStatus,
  getShopOrderStats,
  handleOrderDecision
}
