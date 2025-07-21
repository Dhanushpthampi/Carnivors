import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CustomerProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login to view profile');
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
        address: res.data.address || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Error loading profile');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_BASE_URL}/user/update-profile`,
        {
          name: formData.name,
          email: formData.email
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (formData.address !== user.address) {
        await axios.put(
          `${API_BASE_URL}/user/update-address`,
          { address: formData.address },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      await fetchUserProfile();
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.error || 'Error updating profile');
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      address: user.address || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-lg">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-semibold mb-4">Profile Not Found</h2>
          <p>Please login to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-red-600">Customer Profile</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ✏️ Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleUpdateProfile}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ✅ Save
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-red-600">
              {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                  {user.name || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                  {user.email || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg capitalize">
                {user.role || 'Customer'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
              <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
            {editing ? (
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            ) : (
              <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg min-h-[80px]">
                {user.address || 'No address provided. Please add your delivery address.'}
              </p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-red-800">Account Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Active</div>
              <div className="text-sm text-gray-600">Account Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹0</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
              📋 View Orders
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
              🛒 View Cart
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
              💚 Wishlist
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg">
              🎟️ Coupons
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
