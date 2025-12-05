const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// Only shops allowed
const isShopOwner = (req, res, next) => {
  if (req.user.role !== 'shop') {
    return res.status(403).json({
      success: false,
      message: 'Shop account required'
    })
  }
  next();
};

// ✅ SHOP PROFILE ENDPOINT
router.get('/profile', authMiddleware, isShopOwner, async (req, res) => {
  try {
    console.log('🔥 GET /api/shop/profile called');

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    res.json({
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,

      // Shop data from your existing User schema:
      shopName: user.shopDetails?.businessName || null,
      shopAddress: user.shopDetails?.businessAddress || null,
      shopPhone: user.shopDetails?.businessPhone || null,
      description: user.shopDetails?.description || null,
      isVerified: user.shopDetails?.isVerified || false,

      createdAt: user.createdAt
    });

  } catch (err) {
    console.error('❌ SHOP PROFILE ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop profile'
    });
  }
});

module.exports = router;
