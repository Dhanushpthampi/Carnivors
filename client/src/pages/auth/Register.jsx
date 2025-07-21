import { useState } from 'react';
import { registerUser } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const navigate = useNavigate();

  const roles = [
    { value: 'customer', label: 'Customer', icon: '👤', color: 'from-blue-500 to-blue-600' },
    { value: 'shop', label: 'Shop Owner', icon: '🏪', color: 'from-purple-500 to-purple-600' },
    { value: 'delivery', label: 'Delivery', icon: '🚚', color: 'from-green-500 to-green-600' }
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (roleValue) => {
    setForm({ ...form, role: roleValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      alert('Account created successfully!');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Register failed');
    }
  };

  const currentRole = roles.find(role => role.value === form.role);
  const roleIndex = roles.findIndex(role => role.value === form.role);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
          <p className="text-gray-600">Join us and start your journey</p>
        </div>

        {/* Role Selection Slider */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Your Role
          </label>
          
          <div className="relative bg-gray-100 rounded-xl p-1">
            {/* Animated Background */}
            <div
              className={`absolute top-1 left-1 h-12 rounded-lg bg-gradient-to-r ${currentRole.color} transition-all duration-300 ease-out shadow-lg`}
              style={{
                width: `${100/3}%`,
                transform: `translateX(${roleIndex * 100}%)`
              }}
            />
            
            {/* Role Options */}
            <div className="relative flex">
              {roles.map((role, index) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleChange(role.value)}
                  className={`flex-1 flex items-center justify-center space-x-2 h-12 rounded-lg transition-all duration-300 ${
                    form.role === role.value
                      ? 'text-white font-semibold'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="text-lg">{role.icon}</span>
                  <span className="text-sm font-medium">{role.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Form Fields */}
        <div className="space-y-4">
          <input
            name="name"
            placeholder={`Enter your ${form.role === 'shop' ? 'business' : 'full'} name`}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-opacity-20 focus:border-transparent transition-all duration-200 outline-none"
            style={{
              focusRingColor: currentRole.color.includes('blue') ? '#3B82F6' : 
                              currentRole.color.includes('purple') ? '#8B5CF6' : '#10B981'
            }}
          />
          
          <input
            name="email"
            placeholder={`Enter your ${form.role === 'shop' ? 'business' : ''} email`}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-opacity-20 focus:border-transparent transition-all duration-200 outline-none"
          />
          
          <input
            name="password"
            type="password"
            placeholder="Create a secure password"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-opacity-20 focus:border-transparent transition-all duration-200 outline-none"
          />
          
          {form.role === 'shop' && (
            <input
              name="businessAddress"
              placeholder="Business address"
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 focus:border-transparent transition-all duration-200 outline-none animate-fade-in"
            />
          )}
          
          {form.role === 'delivery' && (
            <input
              name="vehicleType"
              placeholder="Vehicle type (e.g., bike, car, scooter)"
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 focus:border-transparent transition-all duration-200 outline-none animate-fade-in"
            />
          )}
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          className={`w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 bg-gradient-to-r ${currentRole.color} hover:shadow-lg hover:scale-105 transform`}
        >
          Create {currentRole.label} Account
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <a href="/login" className={`font-medium hover:underline bg-gradient-to-r ${currentRole.color} bg-clip-text text-transparent`}>
              Sign in
            </a>
          </p>
        </div>
        </div>
    </div>
  );
}