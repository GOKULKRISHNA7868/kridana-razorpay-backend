const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5181",
      "https://kridana.net",
      "capacitor://localhost",
      "http://localhost",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.options("*", cors());

app.use(express.json());

// 🔐 LIVE KEYS (TEMP - later move to .env)
const razorpay = new Razorpay({
  key_id: "rzp_live_SUjQtjkrUIwaHm",
  key_secret: "eFXuorzJwApzW7CWBYBxKqJW",
});

// ✅ CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    console.log("🔥 RECEIVED AMOUNT:", amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount), // ✅ paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    console.log("✅ ORDER CREATED:", order.amount);

    res.json(order);
  } catch (err) {
    console.error("❌ CREATE ORDER ERROR:", err);
    res.status(500).json({
      message: err?.error?.description || err.message || "Server error",
    });
  }
});

// ✅ OPTIONAL: PAYMENT VERIFY (recommended)


app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generated_signature = crypto
      .createHmac("sha256", "eFXuorzJwApzW7CWBYBxKqJW")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false });
    }
  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ✅ HEALTH CHECK (useful for Render)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
