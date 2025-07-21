import React, { useEffect, useState } from 'react';
import ProductGrid from './ProductGrid';

export default function SimilarProducts({ category, excludeId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!excludeId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching similar products for:', excludeId);
        const url = `http://localhost:5000/api/products/similar?productId=${excludeId}`;
        console.log('📡 URL:', url);
        
        const res = await fetch(url);
        console.log('📊 Response status:', res.status);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const contentType = res.headers.get('content-type');
        console.log('📄 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('❌ Expected JSON but got:', text.substring(0, 200));
          throw new Error('Server returned non-JSON response');
        }
        
        const data = await res.json();
        console.log('✅ Similar products fetched:', data.length);
        setProducts(data);
      } catch (err) {
        console.error('❌ Failed to fetch similar products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [excludeId]);

  if (loading) return <div className="text-center py-4">Loading similar products...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  if (!products.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">Similar Products</h2>
      <ProductGrid products={products} />
    </section>
  );
}