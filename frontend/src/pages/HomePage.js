import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getFeatured, getFlashSales } from "../api";
import ProductCard from "../components/common/ProductCard";
import { useCountdown } from "../hooks/useCountdown";
import styles from "./HomePage.module.css";

const CATEGORIES = [
  { name: "Electronics", icon: "⚡", color: "#e3f2fd", border: "#90caf9" },
  { name: "Fashion", icon: "👗", color: "#fce4ec", border: "#f48fb1" },
  { name: "Home & Kitchen", icon: "🏠", color: "#e8f5e9", border: "#a5d6a7" },
  { name: "Sports", icon: "🏋️", color: "#fff3e0", border: "#ffcc80" },
  { name: "Beauty", icon: "✨", color: "#f3e5f5", border: "#ce93d8" },
  { name: "Books", icon: "📚", color: "#e0f7fa", border: "#80deea" },
];

function FlashCountdown({ endTime }) {
  const { parts, isExpired } = useCountdown(endTime);
  if (isExpired || !parts) return <span className={styles.expired}>Sale Ended</span>;
  return (
    <div className={styles.clockRow}>
      {[["H", parts.h], ["M", parts.m], ["S", parts.s]].map(([label, val]) => (
        <div key={label} className={styles.clockUnit}>
          <span className={styles.clockDigit}>{String(val).padStart(2, "0")}</span>
          <span className={styles.clockLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [flashProducts, setFlashProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingFlash, setLoadingFlash] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    getFeatured()
      .then(({ data }) => setFeatured(data.data || []))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoadingFeatured(false));

    getFlashSales()
      .then(({ data }) => setFlashProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingFlash(false));
  }, []);

  // Earliest flash sale end time for the global countdown
  const nearestFlashEnd = flashProducts[0]?.flashSale?.endTime || null;

  return (
    <div className={styles.page}>
      {/* Hero Banner */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Limited Time Deals</p>
            <h1 className={styles.heroTitle}>
              Shop Smarter.<br />Save Bigger.
            </h1>
            <p className={styles.heroSub}>
              Discover flash sales with up to 70% off on top brands. New deals go live every hour.
            </p>
            <div className={styles.heroActions}>
              <button
                className={`btn btn-accent btn-lg ${styles.shopBtn}`}
                onClick={() => nav("/products")}
              >
                Shop Now
              </button>
              <button
                className={`btn btn-outline btn-lg ${styles.flashBtn}`}
                onClick={() => document.getElementById("flash-section")?.scrollIntoView({ behavior: "smooth" })}
                style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
              >
                View Flash Sales
              </button>
            </div>
          </div>
          <div className={styles.heroStats}>
            {[["10K+", "Products"], ["50K+", "Happy Customers"], ["70%", "Max Discount"]].map(([val, lbl]) => (
              <div key={lbl} className={styles.stat}>
                <span className={styles.statVal}>{val}</span>
                <span className={styles.statLbl}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={`section ${styles.categoriesSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <div className={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className={styles.categoryCard}
                style={{ background: cat.color, borderColor: cat.border }}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sales Section */}
      <section id="flash-section" className={`section ${styles.flashSection}`}>
        <div className="container">
          <div className={styles.flashHeader}>
            <div className={styles.flashTitleGroup}>
              <div className={styles.flashDot} />
              <h2 className={styles.flashTitle}>Flash Deals</h2>
              {nearestFlashEnd && <FlashCountdown endTime={nearestFlashEnd} />}
            </div>
            <Link to="/products?flash=true" className={styles.viewAll}>View All</Link>
          </div>

          {loadingFlash ? (
            <div className={styles.gridSkeleton}>
              {[...Array(4)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : flashProducts.length === 0 ? (
            <div className={styles.noFlash}>
              <p>No active flash sales right now. Check back soon!</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {flashProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Products</h2>
            <Link to="/products" className={styles.viewAll}>View All Products</Link>
          </div>

          {loadingFeatured ? (
            <div className={styles.productGrid}>
              {[...Array(8)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.productGrid}>
              {featured.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner Strip */}
      <section className={styles.stripSection}>
        <div className="container">
          <div className={styles.strip}>
            {[
              { icon: "🚚", title: "Free Delivery", sub: "On orders above ₹499" },
              { icon: "↩️", title: "Easy Returns", sub: "7-day return policy" },
              { icon: "🔒", title: "Secure Payments", sub: "Razorpay encrypted" },
              { icon: "🎧", title: "24/7 Support", sub: "Always here for you" },
            ].map((item) => (
              <div key={item.title} className={styles.stripItem}>
                <span className={styles.stripIcon}>{item.icon}</span>
                <div>
                  <p className={styles.stripTitle}>{item.title}</p>
                  <p className={styles.stripSub}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
