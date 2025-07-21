const mongoose = require('mongoose');

console.log('📦 Product Model: Loading...');

const variantSchema = new mongoose.Schema({
  weight: { type: String, required: true },
  price: { type: Number, required: true }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
  variants: [variantSchema],
 shopId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
}

}, {
  timestamps: true
});

console.log('✅ Product Model: Schema defined');

const Product = mongoose.model('Product', productSchema);

console.log('✅ Product Model: Model created and ready');

module.exports = Product;