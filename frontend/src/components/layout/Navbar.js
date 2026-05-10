import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) setMobileSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      nav(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = () => { logout(); setMenuOpen(false); nav("/"); };

  const itemCount = cart?.itemCount || 0;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className={styles.logoText}>FlashKart</span>
        </Link>

        {/* Search Desktop */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, brands and more..."
          />
          <button type="submit" className={styles.searchBtn} aria-label="Search">
            Search
          </button>
        </form>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Mobile Search Toggle */}
          <button
            className={styles.mobileSearchToggle}
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {isLoggedIn ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button className={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                <span className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "U"}</span>
                <span className={styles.userName}>{user?.name?.split(" ")[0] || "Account"}</span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  style={{ transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "none" }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropUser}>
                    <span className={styles.dropAvatar}>{user?.name?.[0]?.toUpperCase() || "U"}</span>
                    <div>
                      <p className={styles.dropName}>{user?.name || "User"}</p>
                      <p className={styles.dropEmail}>{user?.email || ""}</p>
                    </div>
                  </div>
                  <div className={styles.dropDivider} />
                  <Link to="/orders" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <div className={styles.dropDivider} />
                  <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Login
            </Link>
          )}

          <Link to="/cart" className={styles.cartBtn} aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount > 99 ? "99+" : itemCount}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearch} ref={mobileSearchRef}>
          <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "#94a3b8", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className={styles.mobileSearchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands..."
              autoFocus
            />
            <button type="submit" className={styles.mobileSearchBtn}>Go</button>
          </form>
        </div>
      )}
    </nav>
  );
}