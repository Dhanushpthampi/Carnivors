import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import SimilarProducts from '../../components/SimilarProducts';
import MoreFromShop from '../../components/MoreFromShop';
import useRazorpayCheckout from "../../hooks/useRazorpayCheckout"
import { useCart } from "../../context/CartContext";
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({
    backgroundImage: '',
    backgroundPosition: 'center',
    display: 'none',
  });
  const zoomRef = useRef(null);
  const { startCheckout } = useRazorpayCheckout()
  const { updateCartCount } = useCart();

  
  // Get the API base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${id}`);
        const data = res.data;
        
        // Populate shop details properly
        const productWithShop = await axios.get(`${API_BASE_URL}/products/${id}?populate=shop`);
        
        setProduct(productWithShop.data);
        setSelectedVariant(productWithShop.data.variants?.[0] || null);
        setZoomStyle((prev) => ({
          ...prev,
          backgroundImage: `url(${productWithShop.data.image})`,
        }));
      } catch (err) {
        console.error('❌ Failed to fetch product:', err);
        setError(err.message);
      }
    };

    if (id) fetchProduct();
  }, [id, API_BASE_URL]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.items) {
        setCartItems(res.data.items);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  const handleAddToCart = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      
      if (role === 'shop') {
        toast.error('Please login as a customer to add items to cart');
        return;
      }
      
      if (!token) {
        toast.error('Please login to add items to cart');
        navigate('/login');
        return;
      }

      if (!selectedVariant) {
        toast.error('Please select a variant');
        return;
      }

      const res = await axios.post(`${API_BASE_URL}/cart/add`, {
        productId: product._id,
        quantity: 1,
        variant: selectedVariant.weight
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.data.success) {
      //  toast.success('🛒 Added to cart!');
        updateCartCount(prev => prev + 1);
        // Fetch updated cart and show it
        await fetchCart();
        setShowCart(true);
        
        // Hide cart after 3 seconds
        setTimeout(() => {
          setShowCart(false);
        }, 3000);
      } else {
        toast.error(res.data.message || 'Error adding to cart');
      }
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
      if (err.response?.status === 401) {
        toast.error('Please login to add items to cart');
 
      } else {
        toast.error(err.response?.data?.message || 'Network error');
      }
    } finally {
      setLoading(false);
    }
  };


const handleBuyNow = async () => {

  if (!selectedVariant) {
    toast.error("Please select a variant");
    return;
  }

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    toast.error("Login required");
    navigate("/login");
    return;
  }

  if (role !== "customer") {
    toast.error("Please login using a customer account");
    navigate("/login");
    return;
  }

  const userRes = await axios.get(`${API_BASE_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const address = userRes.data.address;

  if (!address) {
    toast.error("Please add address in profile");
    navigate("/profile/customer");
    return;
  }

  // ✅ START CHECKOUT
  const success = await startCheckout({
    items: [
      {
        productId: product._id,
        quantity: 1,
        variant: {
          weight: selectedVariant.weight
        }
      }
    ],
    totalAmount: selectedVariant.price,
    orderType: "direct",
    address
  });

  // ✅ NAVIGATE AFTER SUCCESS
  if (success) {
    navigate("/orders");
  }
};



  if (error) return <div className="p-4 text-red-600 text-center">Error: {error}</div>;
  if (!product) return <div className="p-6 text-center text-gray-600">Loading product...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Cart Preview Modal */}
      {showCart && (
        <div className="fixed top-4 right-4 bg-white border rounded-lg shadow-lg p-4 z-50 max-w-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">🛒 Cart</h3>
            <button 
              onClick={() => setShowCart(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-sm">Cart is empty</p>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 pb-2 border-b">
                  <img 
                    src={item.product?.image} 
                    alt={item.product?.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 pt-2 border-t">
            <p className="text-sm text-gray-600">
              Total items: {cartItems.length}
            </p>
            <button
              onClick={() => {
                setShowCart(false);
                navigate('/cart');
              }}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
            >
              View Cart
            </button>
          </div>
        </div>
      )}

      {/* Product Info */}
      <div className="flex flex-col md:flex-row gap-10 mb-10">
        {/* Image with Zoom */}
        <div
          className="relative w-full md:w-1/2 h-[400px] overflow-hidden rounded-xl border shadow-md cursor-zoom-in"
          onMouseMove={(e) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - left) / width) * 100;
            const y = ((e.clientY - top) / height) * 100;
            setZoomStyle((prev) => ({
              ...prev,
              backgroundPosition: `${x}% ${y}%`,
              display: 'block',
            }));
          }}
          onMouseLeave={() =>
            setZoomStyle((prev) => ({
              ...prev,
              display: 'none',
            }))
          }
        >
          <img
            ref={zoomRef}
            src={product.image}
            alt={product.name}
            onError={(e) => (e.target.src = '/default-image.png')}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-150"
            style={{
              backgroundImage: zoomStyle.backgroundImage,
              backgroundPosition: zoomStyle.backgroundPosition,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '200%',
              display: zoomStyle.display,
              zIndex: 10,
            }}
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-5">
          <h1 className="text-4xl font-extrabold text-gray-800">{product.name}</h1>
          <p className="text-gray-700 text-base">{product.description}</p>
          <p className="text-sm text-gray-600">
            Sold by:{' '}
            <span className="text-red-600 font-semibold">
              {product.shopId?.name || product.shopId?.shopDetails?.businessName || 'Unknown Shop'}
            </span>
          </p>

          {/* Variant Selector */}
          <div>
            <h3 className="font-semibold mb-2">Choose Variant:</h3>
            <div className="flex flex-wrap gap-2">
              {product.variants?.map((variant, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-4 py-2 border rounded-full text-sm font-medium transition ${
                    selectedVariant?.label === variant.label || selectedVariant?.weight === variant.weight
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'hover:bg-red-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {variant.weight}g – ₹{variant.price}
                </button>
              ))}
            </div>
          </div>

          {selectedVariant && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-semibold">
                Selected: {selectedVariant.weight}g - ₹{selectedVariant.price}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || loading}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 text-lg rounded-xl hover:from-green-600 hover:to-green-700 transition font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Adding...' : '🛒 Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!selectedVariant || loading}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 text-lg rounded-xl hover:from-red-600 hover:to-red-700 transition font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Processing...' : '⚡ Buy Now'}
            </button>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Product Information</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Category: {product.category}</li>
              <li>• Available variants: {product.variants?.length || 0}</li>
              <li>• Fresh and high quality</li>
              <li>• Cash on delivery available</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <SimilarProducts category={product.category} excludeId={id} />
      <MoreFromShop shopId={product.shopId?._id} excludeId={id} shopName={product.shopId?.name} />
    </div>
  );
}