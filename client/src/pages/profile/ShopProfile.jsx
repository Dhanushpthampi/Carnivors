import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ShopProfile() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    businessAddress: "",
    businessPhone: ""
  });

  // -------------------------------
  // ✅ FETCH SHOP PROFILE
  // -------------------------------
  const fetchShopProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Login required");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/shop/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data;

      setShop(data);

      setFormData({
        // ✅ FALLBACK TO USER NAME IF BUSINESS NAME NOT SET
        businessName: data.shopName || data.name || "",
        businessAddress: data.shopAddress || "",
        businessPhone: data.shopPhone || "",
        description: data.description || ""
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching shop profile:", err);
      toast.error("Failed to load shop profile");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopProfile();
  }, []);

  // -------------------------------
  // ✅ INPUT HANDLING
  // -------------------------------
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // ✅ Force phone to numbers only
    if (name === "businessPhone") {
      value = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // -------------------------------
  // ✅ SAVE PROFILE
  // -------------------------------
  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      // Shop info update
      await axios.put(
        `${API_BASE_URL}/user/update-shop`,
        {
          shopDetails: {
            businessName: formData.businessName,
            businessAddress: formData.businessAddress,
            businessPhone: formData.businessPhone,
            description: formData.description
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Shop profile updated");
      setEditing(false);
      fetchShopProfile();
    } catch (err) {
      console.error("Update shop failed:", err);
      toast.error("Profile update failed");
    }
  };

  const cancelEdit = () => {
    setFormData({
      businessName: shop.shopName || shop.name || "",
      businessAddress: shop.shopAddress || "",
      businessPhone: shop.shopPhone || "",
      description: shop.description || ""
    });
    setEditing(false);
  };

  // -------------------------------
  // LOADING
  // -------------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-red-600 rounded-full"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center mt-20 text-red-600">
        ❌ Shop profile not found
      </div>
    );
  }

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-red-600">🏪 Shop Profile</h2>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            ✏️ Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={updateProfile}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              ✅ Save
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              ❌ Cancel
            </button>
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-red-100 flex items-center justify-center text-4xl text-red-600">
          🏪
        </div>

        <h3 className="text-xl mt-2 font-semibold">
          {shop.shopName || shop.name}
        </h3>

        <p className="text-gray-500">{shop.email}</p>

        <p className="text-sm mt-1">
          Verified:{" "}
          {shop.isVerified ? (
            <span className="text-green-600">✅ Yes</span>
          ) : (
            <span className="text-yellow-600">⏳ Pending</span>
          )}
        </p>
      </div>

      {/* FORM */}
      <div className="space-y-4">
        {/* Business Name */}
        <InputField
          label="Shop Name"
          name="businessName"
          value={formData.businessName}
          editing={editing}
          onChange={handleInputChange}
        />

        {/* Phone Number ✅ */}
        <InputField
          label="Phone Number"
          name="businessPhone"
          value={formData.businessPhone}
          editing={editing}
          onChange={handleInputChange}
          type="tel"
          maxLength={10}
        />

        {/* Address */}
        <InputField
          label="Shop Address"
          name="businessAddress"
          value={formData.businessAddress}
          editing={editing}
          onChange={handleInputChange}
        />

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">
            Description
          </label>

          {editing ? (
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full border px-3 py-2 rounded"
            />
          ) : (
            <p className="bg-gray-50 border px-3 py-2 rounded min-h-[80px]">
              {formData.description || "No description"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------
// ✅ REUSABLE INPUT COMPONENT
// -------------------------------
function InputField({
  label,
  name,
  value,
  editing,
  onChange,
  type = "text",
  maxLength
}) {
  return (
    <div>
      <label className="block font-medium mb-1">
        {label}
      </label>

      {editing ? (
        <input
          type={type}
          value={value}
          name={name}
          onChange={onChange}
          maxLength={maxLength}
          className="w-full border px-3 py-2 rounded"
        />
      ) : (
        <p className="bg-gray-50 border px-3 py-2 rounded">
          {value || "Not provided"}
        </p>
      )}
    </div>
  );
}
