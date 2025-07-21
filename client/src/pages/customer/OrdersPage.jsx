import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);

  const fetchOrders = async (status = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view orders');
        return;
      }

      let url = 'http://localhost:5000/api/orders';
      if (status && status !== 'all') {
        url += `?status=${status}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/orders/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success('Order cancelled successfully');
        fetchOrders(activeTab === 'all' ? null : activeTab);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error(err.response?.data?.message || 'Error cancelling order');
    }
  };

  useEffect(() => {
    fetchOrders(activeTab === 'all' ? null : activeTab);
    fetchStats();
  }, [activeTab]);

  const getStatusColor = (status) => {
    const colors = {
      'Placed': 'bg-blue-100 text-blue-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Processing': 'bg-yellow-100 text-yellow-800',
      'Packed': 'bg-orange-100 text-orange-800',
      'Shipped': 'bg-purple-100 text-purple-800',
      'Out for Delivery': 'bg-indigo-100 text-indigo-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800',
      'Failed': 'bg-red-100 text-red-800',
      'Refunded': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'all', label: 'All Orders', count: stats?.totalOrders || 0 },
    { id: 'Placed', label: 'Placed', count: stats?.statusBreakdown?.Placed?.count || 0 },
    { id: 'Processing', label: 'Processing', count: stats?.statusBreakdown?.Processing?.count || 0 },
    { id: 'Shipped', label: 'Shipped', count: stats?.statusBreakdown?.Shipped?.count || 0 },
    { id: 'Delivered', label: 'Delivered', count: stats?.statusBreakdown?.Delivered?.count || 0 },
    { id: 'Cancelled', label: 'Cancelled', count: stats?.statusBreakdown?.Cancelled?.count || 0 }
  ];

  if (loading && !orders.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-40 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          📦 Your Orders
        </h1>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{stats.totalOrders}</div>
              <div className="text-sm text-blue-600">Total Orders</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">₹{stats.totalSpent.toLocaleString()}</div>
              <div className="text-sm text-green-600">Total Spent</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{stats.statusBreakdown?.Delivered?.count || 0}</div>
              <div className="text-sm text-purple-600">Delivered Orders</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        /* No Orders */
        <div className="text-center py-16">
          <div className="text-6xl mb-6">📦</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {activeTab === 'all' ? 'No orders yet' : `No ${activeTab.toLowerCase()} orders`}
          </h2>
          <p className="text-gray-500 mb-8">
            {activeTab === 'all' 
              ? "You haven't placed any orders yet. Start shopping!" 
              : `You don't have any ${activeTab.toLowerCase()} orders.`
            }
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition shadow-lg"
          >
            <span>🛍️</span>
            Start Shopping
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2 mt-3 sm:mt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                    Payment: {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <img
                      src={item.productId?.image}
                      alt={item.productId?.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => (e.target.src = '/default-image.png')}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.productId?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.variant.weight}g × {item.quantity} = ₹{item.itemTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t">
                <div className="mb-3 sm:mb-0">
                  <p className="text-lg font-bold text-gray-900">
                    Total: ₹{order.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Payment: {order.paymentMethod} • Items: {order.items.length}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    to={`/orders/${order._id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    View Details
                  </Link>
                  
                  {(order.status === 'Placed' || order.status === 'Confirmed' || order.status === 'Processing') && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Cancel
                    </button>
                  )}
                  
                  {order.status === 'Delivered' && (
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition">
                      Reorder
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address:</p>
                <p className="text-sm text-gray-600">{order.address}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}