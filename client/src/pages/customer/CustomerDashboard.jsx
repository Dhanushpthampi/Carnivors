import { useState, useEffect } from 'react';
import AutoSlider from '../../components/AutoSlider';
import ProductCard from '../../components/ProductCard';

const categories = [
  { name: 'Chicken', icon: '🍗' },
  { name: 'Mutton', icon: '🐐' },
  { name: 'Seafood', icon: '🐟' },
  { name: 'Ready to Cook', icon: '🍢' },
];

export default function CustomerDashboard() {
  const [selectedCat, setSelectedCat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        
        // Extract products array from API response
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          // Handle case where API returns direct array (backwards compatibility)
          setProducts(data);
        } else {
          console.error('API response format unexpected:', data);
          setProducts([]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setProducts([]); // Ensure products remains an array on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Ensure products is always an array before filtering
  const filtered = Array.isArray(products) ? products.filter((p) =>
    (!selectedCat || p.category === selectedCat) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-gray-500">Loading products...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">Error: {error}</p>;
    }

    if (filtered.length === 0) {
      return (
        <p className="col-span-full text-center text-gray-500">
          {products.length === 0
            ? 'No products available.'
            : 'No products found matching your criteria.'}
        </p>
      );
    }

    return filtered.map((product) => (
      <ProductCard key={product._id} product={product} />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Full width slider without margins */}
      <div className="w-full">
        <AutoSlider />
      </div>

      {/* Welcome Heading */}
      <div className="py-8 text-center bg-gradient-to-b from-red-50 to-white">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-red-700 tracking-tight drop-shadow-sm">
          Welcome to <span className="text-black">CARNIVORS</span> 🥩
        </h1>
        <p className="mt-2 text-sm text-gray-600">Where meat cravings meet satisfaction.</p>
      </div>

      {/* Search bar */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <input
          type="text"
          placeholder="Search meat, fish, or ready-to-cook..."
          className="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCat(cat.name === selectedCat ? null : cat.name)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition shadow-sm hover:shadow-md transform hover:-translate-y-1 ${
              selectedCat === cat.name
                ? 'bg-red-100 text-red-700 ring-2 ring-red-400'
                : 'bg-white text-gray-700'
            }`}
          >
            <span className="text-4xl">{cat.icon}</span>
            <span className="mt-2 font-semibold">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {renderContent()}
      </div>
    </div>
  );
}