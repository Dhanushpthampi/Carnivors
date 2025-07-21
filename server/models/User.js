const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,  // ✅ This already creates an index - no need for duplicate
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['customer', 'shop', 'delivery', 'admin'],
      message: 'Role must be one of: customer, shop, delivery, admin'
    },
    default: 'customer'
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Profile image URL (optional)
  profileImage: {
    type: String,
    default: null
  },
  // Additional fields for shop owners
  shopDetails: {
    businessName: {
      type: String,
      trim: true
    },
    businessAddress: {
      type: String,
      trim: true
    },
    businessPhone: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  // Additional fields for delivery personnel
  deliveryDetails: {
    vehicleType: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'car', 'scooter'],
      default: 'bicycle'
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    currentLocation: {
      latitude: Number,
      longitude: Number
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      // Remove password from JSON output
      delete ret.password;
      return ret;
    }
  }
});

// ✅ FIXED: Remove duplicate email index - email already has unique: true above
// userSchema.index({ email: 1 }); // ❌ This causes the duplicate index warning

// Keep only the additional indexes that don't duplicate schema definitions
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to ensure email is lowercase
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Virtual for getting user's full display name
userSchema.virtual('displayName').get(function() {
  return this.shopDetails?.businessName || this.name;
});

// Instance method to check if user is shop owner
userSchema.methods.isShopOwner = function() {
  return this.role === 'shop';
};

// Instance method to check if user is delivery person
userSchema.methods.isDeliveryPerson = function() {
  return this.role === 'delivery';
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    profileImage: this.profileImage,
    displayName: this.displayName,
    isActive: this.isActive
  };
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);