const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
items: [
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    shopId: {    // ✅ ADD THIS
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    variant: {
      weight: { type: String, required: true },
      price: { type: Number, required: true }
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1
    },

    itemTotal: {
      type: Number,
      required: true
    }
  }
],
  address: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: [
      'Placed',        // Order just placed
      'Confirmed',     // Order confirmed by seller
      'Processing',    // Order being prepared
      'Packed',        // Order packed and ready
      'Shipped',       // Order shipped
      'Out for Delivery', // Order out for delivery
      'Delivered',     // Order delivered
      'Cancelled'      // Order cancelled
    ],
    default: 'Placed'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online', 'Wallet'],
    default: 'COD'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  orderType: {
    type: String,
    enum: ['direct', 'checkout'], // direct = Buy Now, checkout = Cart Checkout
    default: 'direct'
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  trackingNumber: {
    type: String
  },
  notes: {
    type: String
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['Placed', 'Confirmed', 'Processing'];
  return cancellableStatuses.includes(this.status);
};

// Method to get status color for UI
orderSchema.methods.getStatusColor = function() {
  const statusColors = {
    'Placed': 'blue',
    'Confirmed': 'green',
    'Processing': 'yellow',
    'Packed': 'orange',
    'Shipped': 'purple',
    'Out for Delivery': 'indigo',
    'Delivered': 'green',
    'Cancelled': 'red'
  };
  return statusColors[this.status] || 'gray';
};

module.exports = mongoose.model('Order', orderSchema);