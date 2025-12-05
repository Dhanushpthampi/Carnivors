import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function useRazorpayCheckout() {
  const navigate = useNavigate();
  const { updateCartCount } = useCart();

  const startCheckout = async ({
    items,
    totalAmount,
    orderType,
    address
  }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Login required");
        return false;
      }

      // 1️⃣ CREATE RAZORPAY ORDER
      const orderRes = await axios.post(
        `${API_BASE_URL}/payment/create-order`,
        { amount: totalAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const razorpayOrder = orderRes.data.order;

      return await new Promise((resolve) => {

        // 2️⃣ OPEN CHECKOUT POPUP
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: "INR",
          name: "CARNIVORS",
          description: "Food Order",
          order_id: razorpayOrder.id,

          handler: async (response) => {
            try {
              // 3️⃣ VERIFY PAYMENT
              await axios.post(
                `${API_BASE_URL}/payment/verify`,
                response,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              // 4️⃣ CREATE REAL ORDER
              await axios.post(
                `${API_BASE_URL}/orders`,
                {
                  razorpayOrderId: razorpayOrder.id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  items,
                  orderType,
                  address
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              toast.success("✅ Payment Successful!");

              // ✅ Only clear cart if cart checkout
              if (orderType === "checkout") {
                updateCartCount(0);
              }

              resolve(true); // ✅ tell caller success
            } catch (err) {
              console.error(err);
              toast.error("Payment verification failed");
              resolve(false);
            }
          },

          modal: {
            ondismiss: () => resolve(false)
          }
        });

        rzp.open();
      });

    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error("Checkout failed");
      return false;
    }
  };

  return { startCheckout };
}
