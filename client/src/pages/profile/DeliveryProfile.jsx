import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DeliveryProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    axios.get(`${API_BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setUser(res.data))
    .catch(err => console.error('Error fetching profile:', err));
  }, []);

  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold text-red-600 mb-4">Delivery Profile</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Vehicle Number:</strong> {user.vehicleNumber || 'Not provided'}</p>
    </div>
  );
}
