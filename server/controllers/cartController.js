const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;
    const userId = req.user.id;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate variant
    const productVariant = product.variants.find(v => v.weight === variant);
    if (!productVariant) {
      return res.status(400).json({
        success: false,
        message: 'Invalid variant selected'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant === variant
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        variant,
        quantity
      });
    }

    await cart.save();

    // Populate cart with product details
    const populatedCart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name image variants category');

    res.json({
      success: true,
      message: 'Item added to cart',
      cart: populatedCart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
};

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name image variants category');

    if (!cart) {
      return res.json({
        success: true,
        items: []
      });
    }

    res.json({
      success: true,
      items: cart.items
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId, variant, quantity } = req.body;
    const userId = req.user.id;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant === variant
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name image variants category');

    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: populatedCart
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId, variant } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => !(item.product.toString() === productId && item.variant === variant)
    );

    await cart.save();

    const populatedCart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name image variants category');

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: populatedCart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [] },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

// Checkout cart
const checkoutCart = async (req, res) => {
  try {
    const { address, paymentMethod = 'COD' } = req.body;
    const userId = req.user.id;

    // Validate address
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name image variants category');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate cart items and calculate total
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Some products in cart are no longer available'
        });
      }

      // Find the variant
      const variant = product.variants.find(v => v.weight === item.variant);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant not found for product: ${product.name}`
        });
      }

      const itemTotal = variant.price * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        productId: item.product._id,
        variant: {
          weight: variant.weight,
          price: variant.price
        },
        quantity: item.quantity,
        itemTotal: itemTotal
      });
    }

    // Create the order
    const order = new Order({
      customerId: userId,
      items: validatedItems,
      address,
      status: 'Placed',
      totalAmount: calculatedTotal,
      orderType: 'checkout',
      paymentStatus: 'Pending',
      paymentMethod,
      orderNumber: generateOrderNumber()
    });

    await order.save();

    // Populate the order with details
    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name email phone')
      .populate('items.productId', 'name image category');

    // Clear the cart after successful order
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [] }
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing checkout',
      error: error.message
    });
  }
};

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-8)}${random}`;
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkoutCart
};