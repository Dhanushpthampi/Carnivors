import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view cart');
        navigate('/login');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setCartItems(res.data.items || []);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error('Error loading cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, variant, newQuantity) => {
    if (newQuantity < 1) return;
    
    const itemKey = `${productId}-${variant}`;
    setUpdating(prev => ({ ...prev, [itemKey]: true }));

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/cart/update`, {
        productId,
        variant,
        quantity: newQuantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        fetchCart(); // Refresh cart
        toast.success('Cart updated');
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      toast.error('Error updating cart');
    } finally {
      setUpdating(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const removeItem = async (productId, variant) => {
    const itemKey = `${productId}-${variant}`;
    setUpdating(prev => ({ ...prev, [itemKey]: true }));

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_BASE_URL}/cart/remove`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId, variant }
      });

      if (res.data.success) {
        fetchCart(); // Refresh cart
        toast.success('Item removed from cart');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Error removing item');
    } finally {
      setUpdating(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_BASE_URL}/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCartItems([]);
        toast.success('Cart cleared');
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      toast.error('Error clearing cart');
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Calculate totals
  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => {
      const product = item.product;
      if (!product || !product.variants) return sum;
      
      const variant = product.variants.find(v => v.weight === item.variant);
      if (!variant) return sum;
      
      return sum + (variant.price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          🛒 Your Cart
          {cartItems.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-lg font-semibold px-3 py-1 rounded-full">
              {getTotalItems()} items
            </span>
          )}
        </h1>
        
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline"
          >
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart */
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition shadow-lg"
          >
            <span>🏠</span>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-4 mb-8">
            {cartItems.map((item) => {
              const product = item.product;
              if (!product) return null;

              const variant = product.variants?.find(v => v.weight === item.variant);
              if (!variant) return null;

              const itemKey = `${product._id}-${item.variant}`;
              const isUpdating = updating[itemKey];

              return (
                <div
                  key={`${product._id}-${item.variant}`}
                  className="flex gap-6 items-center p-6 rounded-xl shadow-md bg-white hover:shadow-lg transition-shadow border border-gray-100"
                >
                  {/* Product Image */}
                  <Link to={`/product/${product._id}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-24 h-24 rounded-xl object-cover hover:scale-105 transition-transform cursor-pointer"
                      onError={(e) => (e.target.src = '/default-image.png')}
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1">
                    <Link 
                      to={`/product/${product._id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {product.name}
                      </h2>
                    </Link>
                    <p className="text-gray-600 text-sm mb-2">
                      {product.category}
                    </p>
                    <p className="text-gray-700 font-medium">
                      Variant: {variant.weight}g – ₹{variant.price}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(product._id, item.variant, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isUpdating}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-600 transition"
                    >
                      −
                    </button>
                    
                    <span className="text-lg font-semibold min-w-[2rem] text-center">
                      {isUpdating ? '...' : item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(product._id, item.variant, item.quantity + 1)}
                      disabled={isUpdating}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-600 transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Price & Remove */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-700 mb-2">
                      ₹{(variant.price * item.quantity).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeItem(product._id, item.variant)}
                      disabled={isUpdating}
                      className="text-red-500 hover:text-red-700 text-sm font-medium hover:underline disabled:opacity-50"
                    >
                      {isUpdating ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center text-lg mb-4">
              <span className="font-semibold">Total Items:</span>
              <span>{getTotalItems()}</span>
            </div>
            
            <div className="flex justify-between items-center text-2xl font-bold mb-6 text-green-700">
              <span>Total Amount:</span>
              <span>₹{getTotalPrice().toLocaleString()}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/"
                className="flex-1 text-center bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition shadow-md"
              >
                Continue Shopping
              </Link>
              
              <button
                onClick={() => {
                  // Handle checkout logic here
                  toast.info('Checkout functionality coming soon!');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition shadow-md"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}