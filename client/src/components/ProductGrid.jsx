

export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product._id}
          className="border p-3 rounded-lg shadow hover:shadow-lg transition"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-36 object-cover rounded-md mb-2"
            onError={(e) => (e.target.src = '/default-image.png')}
          />
          <h3 className="text-lg font-medium">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>
      ))}
    </div>
  );
}
