import React, { useEffect, useState } from 'react';
import ProductGrid from './ProductGrid';

export default function MoreFromShop({ shopId, excludeId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchFromShop = async () => {
      try {
        // Fixed: Added shopId parameter and fixed double slash
        const res = await fetch(`http://localhost:5000/api/products/more-from-shop?shopId=${shopId}&excludeId=${excludeId}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('❌ Failed to fetch products from same shop:', err);
      }
    };

    if (shopId && excludeId) fetchFromShop();
  }, [shopId, excludeId]);

  if (!products.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">More From This Shop</h2>
      <ProductGrid products={products} />
    </section>
  );
}