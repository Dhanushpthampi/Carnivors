const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { authMiddleware } = require("../middleware/auth");
const Order = require("../models/Order");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ✅ CREATE ORDER
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    let { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success:false, message:"Amount required"});
    }

    amount = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    res.json({ success:true, order });

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success:false, message:"Failed creating Razorpay order"});
  }
});


// ✅ VERIFY PAYMENT
router.post("/verify", authMiddleware, async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success:false,
        message:"Signature mismatch"
      });
    }

    res.json({
      success:true,
      message:"✅ Payment verified"
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ success:false });
  }
});


module.exports = router;
