require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { getRedis } = require("../config/redis");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const fromNow = (m) => new Date(Date.now() + m * 60 * 1000);
const minsAgo = (m) => new Date(Date.now() - m * 60 * 1000);

// ── USERS (UPDATED TO EMAIL) ──────────────────────────────────────────────────
const USERS = [
  {
    email: process.env.ADMIN_EMAIL || "admin@flashkart.com",
    name: "Admin User",
    role: "admin",
    isVerified: true,
    password: process.env.ADMIN_PASSWORD || "Admin@123",
  },
  {
    email: "arjun.sharma@example.com",
    name: "Arjun Sharma",
    role: "user",
    isVerified: true,
  },
  {
    email: "priya.mehta@example.com",
    name: "Priya Mehta",
    role: "user",
    isVerified: true,
  },
  {
    email: "rohit.verma@example.com",
    name: "Rohit Verma",
    role: "user",
    isVerified: true,
  },
];

// ── PRODUCTS (UNCHANGED) ──────────────────────────────────────────────────────
const PRODUCTS = [
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading noise cancellation with 30-hour battery life. Multipoint connection, precise voice pickup for hands-free calling.",
    price: 29990, mrp: 34990, stock: 80, category: "Electronics", brand: "Sony",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"],
    isFeatured: true, tags: ["headphones", "wireless", "noise-cancelling"],
    flashSale: { isActive: true, startTime: minsAgo(1), endTime: fromNow(90), salePrice: 21999, flashStock: 20, flashSold: 0 },
  },
  {
    name: "Apple iPad Air M2 (11-inch, 128GB)",
    description: "Supercharged by the Apple M2 chip. Stunning Liquid Retina display with True Tone. Supports Apple Pencil Pro and Magic Keyboard.",
    price: 74900, mrp: 79900, stock: 45, category: "Electronics", brand: "Apple",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80"],
    isFeatured: true, tags: ["ipad", "tablet", "apple"],
    flashSale: { isActive: true, startTime: fromNow(3), endTime: fromNow(123), salePrice: 59999, flashStock: 10, flashSold: 0 },
  },
  {
    name: "Samsung 65-inch QLED 4K Smart TV",
    description: "Quantum Dot technology delivers 100% colour volume. Object Tracking Sound, built-in Alexa and Google Assistant for smart home control.",
    price: 1, mrp: 1, stock: 15, category: "Electronics", brand: "Samsung",
    images: ["https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=600&q=80"],
    isFeatured: true, tags: ["tv", "4k", "smart-tv"],
  },
  {
    name: "boAt Airdopes 141 Bluetooth TWS Earbuds",
    description: "42-hour total playback with ENx technology. BEAST Mode for low-latency gaming. IPX4 water resistant.",
    price: 1499, mrp: 3990, stock: 350, category: "Electronics", brand: "boAt",
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80"],
    isFeatured: false, tags: ["earbuds", "wireless", "gaming"],
  },
  {
    name: "Levi's 511 Slim Fit Stretch Jeans",
    description: "Classic slim fit from hip to ankle crafted from stretch denim for all-day comfort. Mid-indigo stonewash finish.",
    price: 3799, mrp: 5999, stock: 200, category: "Fashion", brand: "Levi's",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80"],
    isFeatured: true, tags: ["jeans", "slim-fit", "denim"],
    flashSale: { isActive: true, startTime: minsAgo(5), endTime: fromNow(55), salePrice: 1999, flashStock: 30, flashSold: 0 },
  },
  {
    name: "Nike Air Max 270 Running Shoes",
    description: "Max Air heel unit delivers unrivalled all-day cushioning. Engineered mesh upper keeps your foot cool and lightweight.",
    price: 12495, mrp: 14995, stock: 60, category: "Fashion", brand: "Nike",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
    isFeatured: true, tags: ["shoes", "running", "nike"],
  },
  {
    name: "H&M Premium Oversized Hoodie",
    description: "Relaxed fit hoodie in thick ultra-soft fleece. Kangaroo front pocket, drawstring hood, ribbed cuffs. 100% organic cotton.",
    price: 1799, mrp: 2999, stock: 180, category: "Fashion", brand: "H&M",
    images: ["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80"],
    isFeatured: false, tags: ["hoodie", "casual", "cotton"],
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker (6L)",
    description: "Replaces 7 kitchen appliances. 13 one-touch smart programs. Safe locking lid, stainless steel inner pot.",
    price: 8999, mrp: 12995, stock: 40, category: "Home & Kitchen", brand: "Instant Pot",
    images: ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80"],
    isFeatured: true, tags: ["pressure-cooker", "kitchen", "cooking"],
  },
  {
    name: "Dyson V12 Detect Slim Cordless Vacuum",
    description: "Laser illuminates microscopic dust. HEPA filtration captures 99.99% of particles. Up to 60 minutes fade-free power.",
    price: 52900, mrp: 59900, stock: 12, category: "Home & Kitchen", brand: "Dyson",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"],
    isFeatured: false, tags: ["vacuum", "cordless", "dyson"],
  },
  {
    name: "Milton Thermosteel Maestro Flask 1L",
    description: "Keeps hot 24hr, cold 48hr. Double-wall vacuum insulation. Food-grade stainless steel interior, leak-proof lid.",
    price: 699, mrp: 999, stock: 500, category: "Home & Kitchen", brand: "Milton",
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80"],
    isFeatured: false, tags: ["flask", "thermos", "insulated"],
  },
  {
    name: "Fitbit Charge 6 Advanced Fitness Tracker",
    description: "Built-in GPS, real-time heart rate, 40+ exercise modes, sleep tracking. ECG app and EDA stress sensor. 7-day battery.",
    price: 14999, mrp: 19999, stock: 55, category: "Sports", brand: "Fitbit",
    images: ["https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80"],
    isFeatured: true, tags: ["fitness-tracker", "gps", "health"],
  },
  {
    name: "Decathlon Domyos 20kg Adjustable Dumbbell Set",
    description: "Quick-lock weight adjustment 2.5kg to 20kg. Ergonomic contoured grip. Compact storage tray replaces 8 pairs of dumbbells.",
    price: 6999, mrp: 8999, stock: 30, category: "Sports", brand: "Decathlon",
    images: ["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80"],
    isFeatured: false, tags: ["dumbbells", "fitness", "gym"],
  },
];

// ── SEED FUNCTION ─────────────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const redis = getRedis();
  await redis.connect();
  console.log("Redis connected\n");

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
  ]);
  console.log("Collections cleared");

  for (const u of USERS) {
    const doc = { ...u };
    if (doc.password) doc.password = await bcrypt.hash(doc.password, 12);
    const user = await User.create(doc);
    console.log(`User: ${user.email} (${user.role})`);
  }

  console.log("\nSeeding products...");
  const createdProducts = [];

  for (const pd of PRODUCTS) {
    const slug =
      pd.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    const product = await Product.create({ ...pd, slug });
    createdProducts.push(product);
    console.log(`  + ${product.name}`);
  }

  console.log("\nSyncing flash sales to Redis...");
  let flashCount = 0;

  for (const product of createdProducts) {
    const flash = product.flashSale;
    if (flash && flash.isActive && flash.flashStock > 0) {
      await redis.set(`flash:stock:${product._id}`, flash.flashStock, "EX", 86400);
      await redis.set(`flash:active:${product._id}`, "1", "EX", 86400);
      console.log(`  Redis: "${product.name}" -> ${flash.flashStock} units @ Rs.${flash.salePrice}`);
      flashCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("SEED COMPLETE");
  console.log("=".repeat(50));
  console.log(`Users: ${USERS.length} | Products: ${createdProducts.length} | Flash sales: ${flashCount}`);
  console.log(`\nAdmin: ${process.env.ADMIN_EMAIL || "admin@flashkart.com"} / ${process.env.ADMIN_PASSWORD || "Admin@123"}`);
  console.log("Test users: arjun.sharma@example.com | priya.mehta@example.com | rohit.verma@example.com");

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});