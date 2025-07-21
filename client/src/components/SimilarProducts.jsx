import React, { useEffect, useState } from 'react';
import ProductGrid from './ProductGrid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
        const url = `${API_BASE_URL}/products/similar?productId=${excludeId}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
        
        const data = await res.json();
        setProducts(data);
      } catch (err) {
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