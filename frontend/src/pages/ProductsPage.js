import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api";
import ProductCard from "../components/common/ProductCard";
import styles from "./ProductsPage.module.css";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Sports", "Beauty", "Books", "Toys"];
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest First" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-sold", label: "Most Popular" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "-createdAt";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (category) params.category = category;
      if (search) params.search = search;

      const { data } = await getProducts(params);
      setProducts(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 1, page: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterBox}>
              <h3 className={styles.filterTitle}>Categories</h3>
              <button
                className={`${styles.filterItem} ${!category ? styles.filterActive : ""}`}
                onClick={() => setParam("category", "")}
              >
                All Categories
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`${styles.filterItem} ${category === c ? styles.filterActive : ""}`}
                  onClick={() => setParam("category", c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            {/* Top Bar */}
            <div className={styles.topBar}>
              <div className={styles.resultsInfo}>
                {search && (
                  <p className={styles.searchQuery}>
                    Results for &ldquo;<strong>{search}</strong>&rdquo;
                    {category && ` in ${category}`}
                  </p>
                )}
                <p className={styles.count}>
                  {loading ? "Loading..." : `${pagination.total} products found`}
                </p>
              </div>
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Grid */}
            {loading ? (
              <div className={styles.grid}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={styles.skeleton} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <h3>No products found</h3>
                <p>Try adjusting your filters or search query.</p>
                <button className="btn btn-primary" onClick={() => setSearchParams({})}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={`btn btn-outline btn-sm ${styles.pageBtn}`}
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.pageNum} ${page === i + 1 ? styles.pageActive : ""}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className={`btn btn-outline btn-sm ${styles.pageBtn}`}
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
