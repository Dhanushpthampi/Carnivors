import { useState } from 'react';

export default function CreateProductForm() {
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    image: null,
    variants: [{ weight: '', price: '' }],
  });

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...form.variants];
    updatedVariants[index][field] = value;
    setForm({ ...form, variants: updatedVariants });
  };

  const addVariant = () => {
    setForm({ ...form, variants: [...form.variants, { weight: '', price: '' }] });
  };

  const removeVariant = (index) => {
    const updatedVariants = form.variants.filter((_, i) => i !== index);
    setForm({ ...form, variants: updatedVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to add product");

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('image', form.image);
    formData.append('variants', JSON.stringify(form.variants));

    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Product added successfully!");
        setForm({
          name: '',
          category: '',
          description: '',
          image: null,
          variants: [{ weight: '', price: '' }],
        });
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Server error");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-red-600">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          type="text"
          placeholder="Product Name"
          value={form.name}
          onChange={handleInputChange}
          className="w-full border px-4 py-2 rounded"
          required
        />
        <select
          name="category"
          value={form.category}
          onChange={handleInputChange}
          className="w-full border px-4 py-2 rounded"
          required
        >
          <option value="">Select Category</option>
          <option value="Chicken">Chicken</option>
          <option value="Mutton">Mutton</option>
          <option value="Seafood">Seafood</option>
          <option value="Ready to Cook">Ready to Cook</option>
        </select>
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleInputChange}
          className="w-full border px-4 py-2 rounded"
          rows="3"
        ></textarea>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border px-4 py-2 rounded"
          required
        />

        <div className="space-y-2">
          <p className="font-semibold">Variants (e.g., 1kg ₹500):</p>
          {form.variants.map((variant, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Weight"
                value={variant.weight}
                onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                className="border px-2 py-1 rounded w-1/2"
              />
              <input
                type="number"
                placeholder="Price"
                value={variant.price}
                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                className="border px-2 py-1 rounded w-1/2"
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addVariant}
            className="text-blue-500 text-sm"
          >
            + Add another variant
          </button>
        </div>

        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Add Product
        </button>
      </form>
    </div>
  );
}
