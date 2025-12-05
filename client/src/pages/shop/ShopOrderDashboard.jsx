import { useEffect, useState } from "react"
import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

export default function ShopOrderDashboard() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})

  // ----------------------------
  // ✅ FETCH ORDERS
  // ----------------------------
  const fetchOrders = async (status = "", page = 1) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      setLoading(true)

      const params = new URLSearchParams()
      if (status) params.append("status", status)
      params.append("page", page)
      params.append("limit", "10")

      const res = await fetch(
        `${API_BASE_URL}/shop/orders?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const data = await res.json()
      if (!data.success) return

      setOrders(data.orders || [])
      setPagination(data.pagination || {})
    } catch (err) {
      console.error("❌ Failed to load orders:", err)
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------
  // ✅ FETCH STATS
  // ----------------------------
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await axios.get(
        `${API_BASE_URL}/shop/orders/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (res.data.success) {
        setStats(res.data.stats)
      }
    } catch (err) {
      console.error("❌ Failed to load stats:", err)
    }
  }

  // ----------------------------
  // ✅ EFFECT
  // ----------------------------
  useEffect(() => {
    fetchOrders(selectedStatus, currentPage)
    fetchStats()
  }, [selectedStatus, currentPage])

  // ----------------------------
  // ✅ STATUS BADGES
  // ----------------------------
  const orderBadge = (status) => {
    const map = {
      Placed: "bg-blue-100 text-blue-800",
      Confirmed: "bg-green-100 text-green-800",
      Processing: "bg-yellow-100 text-yellow-800",
      Packed: "bg-orange-100 text-orange-800",
      Shipped: "bg-purple-100 text-purple-800",
      "Out for Delivery": "bg-indigo-100 text-indigo-800",
      Delivered: "bg-green-200 text-green-900",
      Cancelled: "bg-red-100 text-red-800",
    }
    return map[status] || "bg-gray-100 text-gray-800"
  }

  const paymentBadge = (status) => {
    const map = {
      Pending: "bg-yellow-100 text-yellow-800",
      Paid: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Refunded: "bg-purple-100 text-purple-800",
    }
    return map[status] || "bg-gray-100 text-gray-800"
  }

  // ----------------------------
  // ✅ UI
  // ----------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ------------ HEADER ------------ */}
      <h1 className="text-3xl font-bold mb-6">
        📦 Shop Orders
      </h1>

      {/* ------------ STATS ------------ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ["Total Orders", stats.totalOrders],
          ["Revenue", `₹${stats.totalRevenue || 0}`],
          ["Placed", stats.statusBreakdown?.Placed?.count],
          ["Delivered", stats.statusBreakdown?.Delivered?.count],
        ].map(([title, value]) => (
          <div
            key={title}
            className="bg-white border p-4 rounded-lg shadow"
          >
            <div className="text-gray-500 text-sm">{title}</div>
            <div className="text-xl font-bold">{value || 0}</div>
          </div>
        ))}
      </div>

      {/* ------------ FILTERS ------------ */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          "",
          "Placed",
          "Confirmed",
          "Processing",
          "Packed",
          "Shipped",
          "Delivered",
          "Cancelled",
        ].map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status)
              setCurrentPage(1)
            }}
            className={`px-4 py-2 text-sm rounded-full border transition ${
              selectedStatus === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {status || "All"}
          </button>
        ))}
      </div>

      {/* ------------ ORDERS ------------ */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          ⏳ Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-500 text-lg mt-12">
          📭 No orders for this filter
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            className="bg-white border rounded-xl p-6 mb-4 shadow-sm"
          >
            <div className="flex justify-between mb-2">

              {/* LEFT */}
              <div>
                <b>#{order.orderNumber}</b>
                <div className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-1 items-end">
                <span
                  className={`px-3 py-1 text-xs rounded ${orderBadge(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>

                <span
                  className={`px-3 py-1 text-xs rounded ${paymentBadge(
                    order.paymentStatus
                  )}`}
                >
                  💳 {order.paymentStatus}
                </span>
              </div>

            </div>

            <div className="mb-2 text-sm">
              👤 {order.customerId?.name}
            </div>

            <div className="space-y-2 mt-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm"
                >
                  <img
                    src={item.productId?.image}
                    className="w-10 h-10 rounded object-cover"
                    alt={item.productId?.name}
                  />

                  <div className="flex-1">
                    <div className="font-medium">
                      {item.productId?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.variant.weight}g × {item.quantity}
                    </div>
                  </div>

                  <div className="font-semibold">
                    ₹{item.itemTotal}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right mt-4 text-green-600 font-bold">
              Total: ₹{order.totalAmount}
            </div>
          </div>
        ))
      )}

      {/* ------------ PAGINATION ------------ */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={!pagination.hasPrev}
            onClick={() =>
              setCurrentPage((p) => Math.max(1, p - 1))
            }
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <div className="px-4 py-2 text-gray-600">
            Page {pagination.currentPage} of{" "}
            {pagination.totalPages}
          </div>

          <button
            disabled={!pagination.hasNext}
            onClick={() =>
              setCurrentPage((p) => p + 1)
            }
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

    </div>
  )
}
