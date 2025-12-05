const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth'); // Use consistent middleware name
const User = require('../models/User');
const Order = require('../models/Order');

// Get user profile - Fixed to work for all user types
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('👤 Fetching profile for user:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    console.log('✅ Profile found for:', user.email, 'Role:', user.role);
    
    // Return consistent user data structure
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(userProfile);
  } catch (err) {
    console.error('❌ Error fetching profile:', err);
    res.status(500).json({ 
      error: 'Failed to load user profile',
      details: err.message 
    });
  }
});

// Update user address - Enhanced with validation
router.put('/update-address', authMiddleware, async (req, res) => {
  try {
    console.log('📍 Updating address for user:', req.user.id);
    console.log('📍 New address:', req.body.address);
    
    const { address } = req.body;
    
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Valid address is required' 
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    user.address = address.trim();
    await user.save();
    
    console.log('✅ Address updated successfully for:', user.email);
    
    res.json({ 
      message: 'Address updated successfully',
      address: user.address
    });
  } catch (err) {
    console.error('❌ Error updating address:', err);
    res.status(500).json({ 
      error: 'Failed to update address',
      details: err.message 
    });
  }
});

// Update user profile - New route for updating name, email, etc.
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    console.log('👤 Updating profile for user:', req.user.id);
    
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Update fields if provided
    if (name && name.trim()) {
      user.name = name.trim();
    }
    
    if (email && email.trim()) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.trim(), 
        _id: { $ne: req.user.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email already in use by another account' 
        });
      }
      
      user.email = email.trim();
    }

    await user.save();
    
    console.log('✅ Profile updated successfully for:', user.email);
    
    // Return updated user info
    const updatedProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address || null
    };
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedProfile
    });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    
    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: 'Email already in use by another account' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: err.message 
    });
  }
});

// Get order history - Enhanced with proper population and filtering
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    console.log('📦 Fetching orders for user:', req.user.id);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Different field names based on user role
    let query = {};
    if (req.user.role === 'customer') {
      query.customerId = req.user.id;
    } else if (req.user.role === 'shop') {
      // For shop owners, we need to find orders containing their products
      // This would require a more complex query with Product model
      query.customerId = req.user.id; // Fallback for now
    }
    
    const orders = await Order.find(query)
      .populate('customerId', 'name email')
      .populate('items.productId', 'name category image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalOrders = await Order.countDocuments(query);
    
    console.log('✅ Found orders:', orders.length);
    
    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasMore: orders.length === limit
      }
    });
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: err.message 
    });
  }
});

// Get user statistics (for shop owners and delivery personnel)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    console.log('📊 Fetching stats for user:', req.user.id, 'Role:', req.user.role);
    
    let stats = {};
    
    if (req.user.role === 'shop') {
      // Stats for shop owners
      const Product = require('../models/Product');
      
      const totalProducts = await Product.countDocuments({ shopId: req.user.id });
      const totalOrders = await Order.countDocuments({ 
        'items.productId': { $in: await Product.find({ shopId: req.user.id }).select('_id') }
      });
      
      stats = {
        totalProducts,
        totalOrders,
        role: 'shop'
      };
    } else if (req.user.role === 'delivery') {
      // Stats for delivery personnel
      const deliveredOrders = await Order.countDocuments({ 
        status: 'Delivered',
        // Add delivery person field when implementing delivery assignment
      });
      
      stats = {
        deliveredOrders,
        role: 'delivery'
      };
    } else {
      // Stats for customers
      const totalOrders = await Order.countDocuments({ customerId: req.user.id });
      
      stats = {
        totalOrders,
        role: 'customer'
      };
    }
    
    res.json(stats);
  } catch (err) {
    console.error('❌ Error fetching stats:', err);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: err.message 
    });
  }
});


router.put('/update-shop', authMiddleware, async (req, res) => {
  try {
    const { shopDetails } = req.body;

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "shop") {
      return res.status(403).json({ error: "Not authorized" });
    }

    user.shopDetails = {
      ...user.shopDetails,
      ...shopDetails
    };

    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Shop update failed", err);
    res.status(500).json({ error: "Update failed" });
  }
});


module.exports = router;