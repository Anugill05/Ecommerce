import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getFeatured, getFlashSales } from "../api";
import ProductCard from "../components/common/ProductCard";
import { useCountdown } from "../hooks/useCountdown";
import styles from "./HomePage.module.css";

const CATEGORIES = [
  { name: "Electronics", icon: "💻", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Fashion", icon: "👗", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Home & Kitchen", icon: "🏠", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Sports", icon: "⚽", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { name: "Beauty", icon: "✨", gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "Books", icon: "📚", gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
];

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="m16 8 5 3-5 3V8z"/>
        <path d="M1 21h15"/><path d="M16 21h6"/>
      </svg>
    ),
    title: "Free Delivery",
    sub: "On orders above ₹499",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
      </svg>
    ),
    title: "Easy Returns",
    sub: "14-day return policy",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: "Secure Payments",
    sub: "100% secure checkout",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.61 4.1 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z"/>
      </svg>
    ),
    title: "24/7 Support",
    sub: "We're here to help",
  },
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

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={`${styles.skeletonImg} skeleton`} />
      <div style={{ padding: "14px" }}>
        <div className={`skeleton ${styles.skeletonLine}`} style={{ width: "60%", height: 10, marginBottom: 8 }} />
        <div className={`skeleton ${styles.skeletonLine}`} style={{ width: "90%", height: 12, marginBottom: 6 }} />
        <div className={`skeleton ${styles.skeletonLine}`} style={{ width: "75%", height: 12, marginBottom: 12 }} />
        <div className={`skeleton ${styles.skeletonLine}`} style={{ width: "45%", height: 18 }} />
      </div>
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

  const nearestFlashEnd = flashProducts[0]?.flashSale?.endTime || null;

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroDecor1} />
        <div className={styles.heroDecor2} />
        <div className={styles.heroDecor3} />
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <div className={styles.heroEyebrow}>
                <span className={styles.heroDot} />
                Limited Time Deals
              </div>
              <h1 className={styles.heroTitle}>
                Big Deals.<br />
                <span className={styles.heroAccent}>Bigger Savings.</span>
              </h1>
              <p className={styles.heroSub}>
                Grab up to 70% off on top brands. New deals go live every hour!
              </p>
              <div className={styles.heroActions}>
                <button
                  className={`btn btn-accent btn-lg ${styles.shopBtn}`}
                  onClick={() => nav("/products")}
                >
                  Shop Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button
                  className={`btn ${styles.flashBtn}`}
                  onClick={() => document.getElementById("flash-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  View Flash Sales
                </button>
              </div>
              <div className={styles.heroStats}>
                {[["10K+", "Products"], ["50K+", "Customers"], ["70%", "Max Discount"]].map(([val, lbl]) => (
                  <div key={lbl} className={styles.stat}>
                    <span className={styles.statVal}>{val}</span>
                    <span className={styles.statLbl}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroBadgeTop}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#f59e0b" }}>
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                Flash Sale Live
              </div>
              <div className={styles.heroCard1}>
                <div className={styles.heroCardImg}>📱</div>
                <div>
                  <p className={styles.heroCardName}>Electronics</p>
                  <p className={styles.heroCardDiscount}>Up to 60% off</p>
                </div>
              </div>
              <div className={styles.heroCard2}>
                <div className={styles.heroCardImg}>👟</div>
                <div>
                  <p className={styles.heroCardName}>Fashion</p>
                  <p className={styles.heroCardDiscount}>Up to 70% off</p>
                </div>
              </div>
              <div className={styles.heroGlowRing} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section className={styles.featuresStrip}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureItem}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div>
                  <p className={styles.featureTitle}>{f.title}</p>
                  <p className={styles.featureSub}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className={`section ${styles.categoriesSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Shop by Category</h2>
            <Link to="/products" className={styles.viewAll}>View All</Link>
          </div>
          <div className={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className={styles.categoryCard}
              >
                <div className={styles.categoryIconWrap} style={{ background: cat.gradient }}>
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                </div>
                <span className={styles.categoryName}>{cat.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.categoryArrow}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flash Sales ── */}
      <section id="flash-section" className={`section ${styles.flashSection}`}>
        <div className="container">
          <div className={styles.flashSectionInner}>
            <div className={styles.flashHeader}>
              <div className={styles.flashTitleGroup}>
                <div className={styles.flashLiveBadge}>
                  <span className={styles.flashPulse} />
                  LIVE
                </div>
                <h2 className={styles.flashTitle}>Flash Deals</h2>
                {nearestFlashEnd && <FlashCountdown endTime={nearestFlashEnd} />}
              </div>
              <Link to="/products?flash=true" className={styles.viewAll}>View All →</Link>
            </div>

            {loadingFlash ? (
              <div className={styles.productGrid}>
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : flashProducts.length === 0 ? (
              <div className={styles.noFlash}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
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
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Products</h2>
            <Link to="/products" className={styles.viewAll}>View All Products →</Link>
          </div>

          {loadingFeatured ? (
            <div className={styles.productGrid}>
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
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

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div>
              <h2 className={styles.ctaTitle}>Don't Miss Out on Flash Deals!</h2>
              <p className={styles.ctaSub}>New deals drop every hour. Shop now and save big.</p>
            </div>
            <button
              className={`btn btn-accent btn-lg`}
              onClick={() => nav("/products")}
            >
              Shop All Products
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}