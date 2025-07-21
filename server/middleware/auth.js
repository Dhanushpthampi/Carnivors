const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token') || 
                  req.body.token || 
                  req.query.token;
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        error: 'MISSING_TOKEN' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ 
      message: 'Invalid token.',
      error: 'INVALID_TOKEN' 
    });
  }
};

// Optional: Admin verification middleware
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        error: 'INSUFFICIENT_PRIVILEGES' 
      });
    }
    next();
  });
};

module.exports = { 
  verifyToken,
  authMiddleware: verifyToken, // Export the same function with both names
  verifyAdmin 
};