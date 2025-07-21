import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const shop = product.shopId;

  return (
    <Link to={`/product/${product._id}`} className="block hover:no-underline">
      <div className="bg-gradient-to-br from-red-50 via-white to-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-in-out p-4">
        
        <div className="relative">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-44 object-cover rounded-lg mb-3"
            onError={(e) => {
              if (!e.target.src.includes('default-image.png')) {
                e.target.src = '/default-image.png';
              }
            }}
          />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{product.category}</p>

          {shop?.name || shop?.email ? (
            <p className="text-xs text-gray-600 italic">
              Sold by: <span className="font-medium text-red-600">{shop.name || shop.email}</span>
            </p>
          ) : null}

          {product.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {product.variants?.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700">Available variants:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {product.variants.map((variant, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium"
                >
                  {variant.weight ? `${variant.weight} - ₹${variant.price}` : `₹${variant.price}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.featured && (
          <span className="mt-3 inline-block bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
            ⭐ Featured
          </span>
        )}
      </div>
    </Link>
  );
}
