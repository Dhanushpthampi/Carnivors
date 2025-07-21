import React, { useEffect, useState } from 'react';
import ProductGrid from './ProductGrid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MoreFromShop({ shopId, excludeId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchFromShop = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/products/more-from-shop?shopId=${shopId}&excludeId=${excludeId}`
        );
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