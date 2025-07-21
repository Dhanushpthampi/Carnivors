const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
  console.log('📝 Registration attempt:', req.body);
  
  const { name, email, password, role } = req.body;
  
  try {
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12; // Increased from 10 for better security
    const hashed = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = await User.create({ 
      name, 
      email, 
      password: hashed, 
      role: role || 'customer' // Default to customer if no role specified
    });

    console.log('✅ User registered successfully:', user.email);
    
    // Don't send password in response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(201).json({ 
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Registration failed', 
      error: err.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  console.log('🔐 Login attempt for:', req.body.email);
  
  const { email, password } = req.body;
  
  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token with more user info
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    console.log('✅ Login successful for:', user.email);

    // Send response without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({ 
      token, 
      user: userResponse,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ 
      message: 'Login failed', 
      error: err.message 
    });
  }
};

// Get current user info
exports.me = async (req, res) => {
  try {
    console.log('👤 Fetching user info for ID:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    console.log('✅ User info found:', user.email);
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    console.error('❌ Error fetching user info:', err);
    res.status(500).json({ 
      message: 'Failed to fetch user info', 
      error: err.message 
    });
  }
};