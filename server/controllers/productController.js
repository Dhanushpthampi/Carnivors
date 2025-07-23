const mongoose = require('mongoose');
const Product = require('../models/Product');
const cloudinary = require('../utils/cloudinary');

// Optimized version with better performance
exports.getAllProducts = async (req, res) => {
  try {
    console.log('📦 Fetching all products...');
    
    // Reduced default limit to improve performance
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Cap at 50
    const skip = (page - 1) * limit;
    const category = req.query.category;

    // Build query with category filter if provided
    const query = category ? { category } : {};

    // Use aggregation pipeline for better performance
    const pipeline = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users', // Assuming your user collection is named 'users'
          localField: 'shopId',
          foreignField: '_id',
          as: 'shopInfo',
          pipeline: [{ $project: { name: 1, email: 1 } }] // Only select needed fields
        }
      },
      {
        $addFields: {
          shopId: { $arrayElemAt: ['$shopInfo', 0] }
        }
      },
      { $unset: 'shopInfo' } // Remove temporary field
    ];

    const [products, totalCount] = await Promise.all([
      Product.aggregate(pipeline),
      category 
        ? Product.countDocuments(query)
        : Product.estimatedDocumentCount() // Faster for total count
    ]);

    console.log(`✅ Found ${products.length} products`);
    
    // Add cache headers
    res.set({
      'Cache-Control': 'public, max-age=300',
      'ETag': `"products-${products.length}-${Date.now()}"`
    });
    
    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: products.length === limit,
        totalCount
      }
    });
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// NEW: Get products for specific shop (for shop dashboard)
exports.getShopProducts = async (req, res) => {
  try {
    console.log('🏪 Fetching products for shop:', req.user.id);
    
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { shopId: new mongoose.Types.ObjectId(req.user.id) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shopInfo',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      {
        $addFields: {
          shopId: { $arrayElemAt: ['$shopInfo', 0] }
        }
      },
      { $unset: 'shopInfo' }
    ];

    const [products, totalCount] = await Promise.all([
      Product.aggregate(pipeline),
      Product.countDocuments({ shopId: req.user.id })
    ]);

    console.log(`✅ Found ${products.length} products for shop`);
    
    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: products.length === limit,
        totalCount
      }
    });
  } catch (err) {
    console.error('❌ Error fetching shop products:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Optimized single product fetch
exports.getProductById = async (req, res) => {
  try {
    console.log('🔍 Fetching product by ID:', req.params.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Use aggregation for consistent performance
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shopInfo',
          pipeline: [{ $project: { name: 1, email: 1, role: 1 } }]
        }
      },
      {
        $addFields: {
          shopId: { $arrayElemAt: ['$shopInfo', 0] }
        }
      },
      { $unset: 'shopInfo' }
    ];

    const products = await Product.aggregate(pipeline);
    const product = products[0];

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ Product found:', product.name);
    
    res.json(product);
  } catch (err) {
    console.error('❌ Error fetching product:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// FIXED: Update product (only by shop owner)
exports.updateProduct = async (req, res) => {
  try {
    console.log('📝 Updating product:', req.params.id);
    console.log('🧪 Request body:', req.body);
    console.log('🖼️ File info:', req.file ? 'File present' : 'No file');
    console.log('👤 User ID:', req.user.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Find the product first
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('🏪 Product shopId:', product.shopId.toString());
    console.log('👤 Request user ID:', req.user.id);

    // Check if the product belongs to the requesting shop (convert both to strings for comparison)
    if (product.shopId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        message: 'Unauthorized: You can only update your own products',
        productShopId: product.shopId.toString(),
        requestUserId: req.user.id.toString()
      });
    }

    const { name, category, description, variants } = req.body;
    let imageUrl = product.image; // Keep existing image by default

    // Handle new image upload if provided
    if (req.file) {
      try {
        console.log('☁️ Uploading new image to Cloudinary...');
        
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'noveg_products',
              transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary error:', error);
                reject(error);
              } else {
                console.log('✅ Cloudinary upload success:', result.secure_url);
                resolve(result);
              }
            }
          ).end(req.file.buffer);
        });
        
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        return res.status(500).json({ 
          message: 'Image upload failed', 
          error: uploadError.message 
        });
      }
    }

    // Parse variants if it's a string
    let parsedVariants = product.variants; // Keep existing variants by default
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        console.log('✅ Parsed variants:', parsedVariants);
      } catch (parseError) {
        console.error('❌ Variants parsing error:', parseError);
        return res.status(400).json({ 
          message: 'Invalid variants format', 
          error: parseError.message 
        });
      }
    }

    // Update product fields - only update if new values are provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (parsedVariants !== undefined) updateData.variants = parsedVariants;
    if (imageUrl !== product.image) updateData.image = imageUrl;
    updateData.updatedAt = new Date();

    console.log('📝 Update data:', updateData);

    // Use findByIdAndUpdate for atomic operation
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Return the updated document
        runValidators: true // Run mongoose validators
      }
    ).populate('shopId', 'name email');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found after update' });
    }
    
    console.log('✅ Product updated successfully:', updatedProduct.name);
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (err) {
    console.error('❌ Error updating product:', err);
    res.status(500).json({ 
      message: 'Failed to update product', 
      error: err.message 
    });
  }
};

// FIXED: Delete product (only by shop owner)
exports.deleteProduct = async (req, res) => {
  try {
    console.log('🗑️ Deleting product:', req.params.id);
    console.log('👤 User ID:', req.user.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Find the product first to check ownership
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('🏪 Product shopId:', product.shopId.toString());
    console.log('👤 Request user ID:', req.user.id);

    // Check if the product belongs to the requesting shop (convert both to strings for comparison)
    if (product.shopId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        message: 'Unauthorized: You can only delete your own products',
        productShopId: product.shopId.toString(),
        requestUserId: req.user.id.toString()
      });
    }

    // Store product name for logging before deletion
    const productName = product.name;

    // Delete the product
    await Product.findByIdAndDelete(req.params.id);
    
    console.log('✅ Product deleted successfully:', productName);
    
    res.json({ 
      message: 'Product deleted successfully',
      deletedProduct: {
        id: req.params.id,
        name: productName
      }
    });
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).json({ 
      message: 'Failed to delete product', 
      error: err.message 
    });
  }
};

// Optimized similar products with indexes
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.query;
    
    console.log('🔍 Getting similar products for:', productId);
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    
    // Use aggregation pipeline for better performance
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(productId) } },
      { $project: { category: 1 } }
    ];
    
    const currentProducts = await Product.aggregate(pipeline);
    const currentProduct = currentProducts[0];
    
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('✅ Found current product category:', currentProduct.category);
    
    const similarPipeline = [
      { 
        $match: { 
          category: currentProduct.category,
          _id: { $ne: new mongoose.Types.ObjectId(productId) }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'users',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shopInfo',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $addFields: {
          shopId: { $arrayElemAt: ['$shopInfo', 0] }
        }
      },
      { $unset: 'shopInfo' }
    ];
    
    const similarProducts = await Product.aggregate(similarPipeline);
    
    console.log('✅ Found similar products:', similarProducts.length);
    
    res.json(similarProducts);
  } catch (error) {
    console.error('❌ Error fetching similar products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch similar products',
      details: error.message 
    });
  }
};

// Optimized shop products
exports.getMoreFromShop = async (req, res) => {
  try {
    const { shopId, excludeId } = req.query;
    
    console.log('🏪 Getting more products from shop:', shopId);
    
    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Valid shopId is required' });
    }
    
    const matchConditions = { shopId: new mongoose.Types.ObjectId(shopId) };
    
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      matchConditions._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    
    const pipeline = [
      { $match: matchConditions },
      { $sort: { createdAt: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'users',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shopInfo',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $addFields: {
          shopId: { $arrayElemAt: ['$shopInfo', 0] }
        }
      },
      { $unset: 'shopInfo' }
    ];
    
    const moreProducts = await Product.aggregate(pipeline);
    
    console.log('✅ Found more products from shop:', moreProducts.length);
    
    res.json(moreProducts);
  } catch (error) {
    console.error('❌ Error fetching more products from shop:', error);
    res.status(500).json({ 
      error: 'Failed to fetch more products from shop',
      details: error.message 
    });
  }
};

// Keep the createProduct method as is (unchanged)
exports.createProduct = async (req, res) => {
  try {
    console.log('📝 Creating new product...');
    console.log('🧪 Request body:', req.body);
    console.log('🖼️ File info:', req.file ? 'File present' : 'No file');
    
    const { name, category, description, variants } = req.body;
    
    if (!name || !category || !variants) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, category, variants' 
      });
    }

    let imageUrl = null;
    
    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        console.log('☁️ Uploading to Cloudinary...');
        
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'noveg_products',
              transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary error:', error);
                reject(error);
              } else {
                console.log('✅ Cloudinary upload success:', result.secure_url);
                resolve(result);
              }
            }
          ).end(req.file.buffer);
        });
        
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        return res.status(500).json({ 
          message: 'Image upload failed', 
          error: uploadError.message 
        });
      }
    } else {
      imageUrl = 'https://via.placeholder.com/800x600/e2e8f0/64748b?text=No+Image';
    }

    // Parse variants if it's a string
    let parsedVariants;
    try {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    } catch (parseError) {
      return res.status(400).json({ 
        message: 'Invalid variants format', 
        error: parseError.message 
      });
    }

    const product = new Product({
      name,
      category,
      description,
      variants: parsedVariants,
      image: imageUrl,
      shopId: req.user.id,
    });

    await product.save();
    
    // Populate shop info before sending response
    await product.populate('shopId', 'name email');
    
    console.log('✅ Product created successfully:', product.name);
    
    res.status(201).json(product);
  } catch (err) {
    console.error('❌ Error creating product:', err);
    res.status(500).json({ 
      message: 'Failed to create product', 
      error: err.message 
    });
  }
};