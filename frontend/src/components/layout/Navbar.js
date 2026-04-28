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
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      nav(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const handleLogout = () => { logout(); setMenuOpen(false); nav("/"); };

  const itemCount = cart?.itemCount || 0;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>F</span>
          <span className={styles.logoText}>FlashKart</span>
        </Link>

        {/* Search */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for products, brands and more"
          />
          <button type="submit" className={styles.searchBtn} aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </form>

        {/* Actions */}
        <div className={styles.actions}>
          {isLoggedIn ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button className={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                <span className={styles.avatar}>{user?.name?.[0] || user?.phone?.[0] || "U"}</span>
                <span className={styles.userName}>{user?.name || "Account"}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <Link to="/orders" className={styles.dropItem} onClick={() => setMenuOpen(false)}>My Orders</Link>
                  <Link to="/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>Profile</Link>
                  {isAdmin && <Link to="/admin" className={styles.dropItem} onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
                  <div className={styles.dropDivider} />
                  <button className={styles.dropItem} onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>Login</Link>
          )}

          <Link to="/cart" className={styles.cartBtn} aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount > 99 ? "99+" : itemCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
