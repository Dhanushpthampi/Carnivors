require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

console.log('🔍 Starting server initialization...');

const app = express();
app.set('trust proxy', 1);

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-auth-token']
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended:true, limit:"10mb" }));

/* =========================
   REQUEST LOGGING
========================= */
app.use((req,res,next)=>{
  console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log("🔐 Auth header present:", !!(req.headers.authorization));
  next();
});


/* =========================
   ROUTE IMPORTS
========================= */

const authRoutes       = require('./routes/authRoutes');
const productRoutes    = require('./routes/productRoutes');
const userRoutes       = require('./routes/userRoutes');
const cartRoutes       = require('./routes/cartRoutes');
const orderRoutes      = require('./routes/orderRoutes');
const shopOrderRoutes = require('./routes/shopOrderRoutes'); // ✅ ADDED
const shopProfileRoutes = require('./routes/shopProfileRoutes');
const paymentRoutes = require("./routes/paymentRoutes");

console.log("✅ Routes loaded");

/* =========================
   HEALTH ROUTES
========================= */

app.get("/", (req,res)=>{
  res.json({
    message: "NoVeg API is running!",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health",(req,res)=>{
  res.json({
    status:'healthy',
    mongodb: mongoose.connection.readyState === 1 ? "connected":"disconnected"
  });
});


/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/user", userRoutes);
app.use("/api/cart", cartRoutes);
app.use('/api/shop', shopProfileRoutes);

app.use("/api/payment", paymentRoutes);
/* ----- CUSTOMER ORDERS ----- */
app.use("/api/orders", (req,res,next)=>{
  console.log("📦 orders route hit");
  next();
}, orderRoutes);

/* ----- SHOP ORDERS ✅ IMPORTANT ----- */
app.use("/api/shop/orders", (req,res,next)=>{
  console.log("🏪 SHOP ORDERS route hit");
  next();
}, shopOrderRoutes);


/* =========================
   404 API FALLBACK
========================= */

app.use('/api/*', (req,res)=>{
  res.status(404).json({
    message:'API endpoint not found',
    method:req.method,
    url:req.originalUrl,
  });
});


/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err,req,res,next)=>{
  console.error("💥 GLOBAL ERROR", err);
  res.status(500).json({
    message:"Internal Server Error",
    error: err.message
  });
});


/* =========================
   DATABASE
========================= */

console.log("🔌 Connecting to MongoDB...");

mongoose.connect(process.env.MONGO_URI,{
  maxPoolSize:10,
  serverSelectionTimeoutMS:5000,
  socketTimeoutMS:45000,
  family:4
})
.then(()=>{
  console.log("✅ MongoDB Connected");

  const PORT = process.env.PORT || 5000;
  app.listen(PORT,()=>{
    console.log(`🌟 Server running`);
    console.log(`🌐 http://localhost:${PORT}`);
  });
})
.catch(err=>{
  console.error("❌ MongoDB connection failed:",err);
  process.exit(1);
});



/* =========================
   STATIC FRONTEND
========================= */

const path = require("path");
app.use(express.static(path.join(__dirname,"../client/dist")));

app.get("*",(req,res)=>{
  res.sendFile(path.join(__dirname,"../client/dist/index.html"));
});


/* =========================
  SHUTDOWN HANDLERS
========================= */

process.on("SIGINT",()=>{
  console.log("🛑 Shutting down gracefully...");
  mongoose.connection.close(()=> process.exit(0));
});
