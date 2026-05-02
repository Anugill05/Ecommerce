// require("dotenv").config();
// require("express-async-errors");

// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// const mongoSanitize = require("express-mongo-sanitize");

// const connectDB = require("./config/db");
// const { getRedis } = require("./config/redis");
// const globalErrorHandler = require("./middleware/errorHandler");
// const AppError = require("./utils/AppError");

// const authRoutes = require("./routes/auth");
// const productRoutes = require("./routes/products");
// const cartRoutes = require("./routes/cart");
// const orderRoutes = require("./routes/orders");

// const app = express();

// app.use(helmet());
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true,
//   methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
//   allowedHeaders: ["Content-Type","Authorization"],
// }));
// app.use(express.json({ limit: "10kb" }));
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// app.use(mongoSanitize());
// app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// app.use("/api/auth", authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/cart", cartRoutes);
// app.use("/api/orders", orderRoutes);

// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
// });

// app.all("*", (req, res, next) => {
//   next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
// });

// app.use(globalErrorHandler);

// const PORT = process.env.PORT || 5000;

// const start = async () => {
//   await connectDB();
//   const redis = getRedis();
//   await redis.connect();
//   app.listen(PORT, () => {
//     console.log(`\nFlashKart API running on port ${PORT}`);
//     console.log(`Environment: ${process.env.NODE_ENV}`);
//     console.log(`Health: http://localhost:${PORT}/api/health\n`);
//   });
// };

// start().catch((err) => { console.error("Startup error:", err); process.exit(1); });


// require("dotenv").config();
// require("express-async-errors");

// const express      = require("express");
// const cors         = require("cors");
// const helmet       = require("helmet");
// const morgan       = require("morgan");
// const mongoSanitize = require("express-mongo-sanitize");

// const connectDB          = require("./config/db");
// const { getRedis }       = require("./config/redis");
// const { getRazorpay }    = require("./config/razorpay");
// const globalErrorHandler = require("./middleware/errorHandler");
// const AppError           = require("./utils/AppError");

// const authRoutes    = require("./routes/auth");
// const productRoutes = require("./routes/products");
// const cartRoutes    = require("./routes/cart");
// const orderRoutes   = require("./routes/orders");
// const paymentRoutes = require("./routes/payment");   // ← NEW

// const app = express();

// // ── Security middleware ───────────────────────────────────────────────────────
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc:  ["'self'", "https://checkout.razorpay.com"],
//       frameSrc:   ["'self'", "https://api.razorpay.com"],
//       connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
//       imgSrc:     ["'self'", "data:", "https://checkout.razorpay.com"],
//     },
//   },
// }));

// app.use(cors({
//   origin:       process.env.CLIENT_URL || "http://localhost:3000",
//   credentials:  true,
//   methods:      ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }));

// // ── IMPORTANT: Webhook route must be registered BEFORE express.json() ─────────
// // The Razorpay webhook handler needs the raw request body (Buffer) to compute
// // the HMAC-SHA256 signature. express.raw() is applied per-route inside
// // routes/payment.js, but mounting the router here before express.json()
// // guarantees no body parsing interference.
// app.use("/api/payment", paymentRoutes);

// // ── Body parsing (all other routes) ──────────────────────────────────────────
// app.use(express.json({ limit: "10kb" }));
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// app.use(mongoSanitize());   // strip $ and . from req.body/query/params
// app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// // ── API routes ────────────────────────────────────────────────────────────────
// app.use("/api/auth",     authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/cart",     cartRoutes);
// app.use("/api/orders",   orderRoutes);

// // ── Health check ──────────────────────────────────────────────────────────────
// app.get("/api/health", (req, res) => {
//   res.json({
//     status:    "ok",
//     timestamp: new Date().toISOString(),
//     env:       process.env.NODE_ENV,
//     services:  { mongo: "connected", redis: "connected" },
//   });
// });

// // ── 404 handler ───────────────────────────────────────────────────────────────
// app.all("*", (req, res, next) =>
//   next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
// );

// // ── Global error handler ──────────────────────────────────────────────────────
// app.use(globalErrorHandler);

// // ── Start ─────────────────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 5000;

// const start = async () => {
//   await connectDB();

//   const redis = getRedis();
//   await redis.connect();

//   // Validate Razorpay config at startup — fail fast if keys missing
//   try {
//     getRazorpay();
//   } catch (err) {
//     console.warn(`Razorpay warning: ${err.message}`);
//     console.warn("Payment routes will fail until keys are configured.\n");
//   }

//   app.listen(PORT, () => {
//     console.log(`\nFlashKart API  →  http://localhost:${PORT}`);
//     console.log(`Environment    →  ${process.env.NODE_ENV}`);
//     console.log(`Health check   →  http://localhost:${PORT}/api/health`);
//     console.log(`Payment routes →  /api/payment/{create-order,verify,webhook}\n`);
//   });
// };

// start().catch((err) => {
//   console.error("Startup error:", err);
//   process.exit(1);
// });

// require("dotenv").config();
// require("express-async-errors");

// const express      = require("express");
// const cors         = require("cors");
// const helmet       = require("helmet");
// const morgan       = require("morgan");
// const mongoSanitize = require("express-mongo-sanitize");

// const connectDB          = require("./config/db");
// const { getRedis }       = require("./config/redis");
// const { initFirebase }   = require("./config/firebase");
// const { getRazorpay }    = require("./config/razorpay");
// const globalErrorHandler = require("./middleware/errorHandler");
// const AppError           = require("./utils/AppError");

// const authRoutes    = require("./routes/auth");
// const productRoutes = require("./routes/products");
// const cartRoutes    = require("./routes/cart");
// const orderRoutes   = require("./routes/orders");
// const paymentRoutes = require("./routes/payment");   // ← NEW

// const app = express();

// // ── Security middleware ───────────────────────────────────────────────────────
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc:  ["'self'", "https://checkout.razorpay.com"],
//       frameSrc:   ["'self'", "https://api.razorpay.com"],
//       connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
//       imgSrc:     ["'self'", "data:", "https://checkout.razorpay.com"],
//     },
//   },
// }));

// app.use(cors({
//   origin:       process.env.CLIENT_URL || "https://ecommerce-1-782g.onrender.com",
//   credentials:  true,
//   methods:      ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }));

// // ── IMPORTANT: Webhook route must be registered BEFORE express.json() ─────────
// // The Razorpay webhook handler needs the raw request body (Buffer) to compute
// // the HMAC-SHA256 signature. express.raw() is applied per-route inside
// // routes/payment.js, but mounting the router here before express.json()
// // guarantees no body parsing interference.
// app.use("/api/payment", paymentRoutes);

// // ── Body parsing (all other routes) ──────────────────────────────────────────
// app.use(express.json({ limit: "10kb" }));
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// app.use(mongoSanitize());   // strip $ and . from req.body/query/params
// app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// // ── API routes ────────────────────────────────────────────────────────────────
// app.use("/api/auth",     authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/cart",     cartRoutes);
// app.use("/api/orders",   orderRoutes);

// // ── Health check ──────────────────────────────────────────────────────────────
// app.get("/api/health", (req, res) => {
//   res.json({
//     status:    "ok",
//     timestamp: new Date().toISOString(),
//     env:       process.env.NODE_ENV,
//     services:  { mongo: "connected", redis: "connected" },
//   });
// });

// // ── 404 handler ───────────────────────────────────────────────────────────────
// app.all("*", (req, res, next) =>
//   next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
// );

// // ── Global error handler ──────────────────────────────────────────────────────
// app.use(globalErrorHandler);

// // ── Start ─────────────────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 5000;

// const start = async () => {
//   await connectDB();
//   initFirebase();

//   const redis = getRedis();
//   await redis.connect();

//   // Validate Razorpay config at startup — fail fast if keys missing
//   try {
//     getRazorpay();
//   } catch (err) {
//     console.warn(`Razorpay warning: ${err.message}`);
//     console.warn("Payment routes will fail until keys are configured.\n");
//   }

//   app.listen(PORT, () => {
//     console.log(`\nFlashKart API  →  http://localhost:${PORT}`);
//     console.log(`Environment    →  ${process.env.NODE_ENV}`);
//     console.log(`Health check   →  http://localhost:${PORT}/api/health`);
//     console.log(`Payment routes →  /api/payment/{create-order,verify,webhook}\n`);
//   });
// };

// start().catch((err) => {
//   console.error("Startup error:", err);
//   process.exit(1);
// });





require("dotenv").config();
require("express-async-errors");

const express       = require("express");
const cors          = require("cors");
const helmet        = require("helmet");
const morgan        = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB          = require("./config/db");
const { getRedis }       = require("./config/redis");
const { getRazorpay }    = require("./config/razorpay");
const globalErrorHandler = require("./middleware/errorHandler");
const AppError           = require("./utils/AppError");

const authRoutes    = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes    = require("./routes/cart");
const orderRoutes   = require("./routes/orders");
const paymentRoutes = require("./routes/payment");

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:         process.env.CLIENT_URL || "http://localhost:3000",
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Webhook route must come before express.json()
app.use("/api/payment", paymentRoutes);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",     cartRoutes);
app.use("/api/orders",   orderRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.all("*", (req, res, next) =>
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
);

app.use(globalErrorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const redis = getRedis();
  await redis.connect();

  try { getRazorpay(); } catch (err) {
    process.stdout.write(`WARN: Razorpay not configured — ${err.message}\n`);
  }

  app.listen(PORT, () => {
    process.stdout.write(`FlashKart API → http://localhost:${PORT}\n`);
    process.stdout.write(`Environment  → ${process.env.NODE_ENV}\n`);
  });
};

start().catch((err) => {
  process.stderr.write(`Startup error: ${err.message}\n`);
  process.exit(1);
});