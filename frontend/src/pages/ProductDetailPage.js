import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getProduct, addToCart, createFlashOrder, verifyFlashPayment } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCountdown } from "../hooks/useCountdown";
import { useRazorpay } from "../hooks/useRazorpay";
import styles from "./ProductDetailPage.module.css";

const pct = (a, b) => b && b > a ? Math.round(((b - a) / b) * 100) : 0;

const AddressForm = ({ onSubmit, loading }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "",
    line1: "", city: "", state: "", pincode: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className={styles.addressForm}>
      <h4 className={styles.addressTitle}>Shipping Address</h4>
      <div className={styles.formRow}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.name} onChange={set("name")} placeholder="Full name" required />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone} onChange={set("phone")} placeholder="10-digit phone" maxLength={10} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Address Line 1</label>
        <input className="form-input" value={form.line1} onChange={set("line1")} placeholder="House/flat no, street, area" required />
      </div>
      <div className={styles.formRow}>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" value={form.city} onChange={set("city")} placeholder="City" required />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" value={form.state} onChange={set("state")} placeholder="State" required />
        </div>
        <div className="form-group">
          <label className="form-label">Pincode</label>
          <input className="form-input" value={form.pincode} onChange={set("pincode")} placeholder="6-digit pincode" maxLength={6} required />
        </div>
      </div>
      <button
        className="btn btn-accent btn-full"
        onClick={() => onSubmit(form)}
        disabled={loading}
      >
        {loading ? "Processing..." : "Proceed to Payment"}
      </button>
    </div>
  );
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { fetchCart } = useCart();
  const { openPayment } = useRazorpay();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const flash = product?.flashSale;
  const now = new Date();
  const isFlashLive = flash?.isActive && new Date(flash.startTime) <= now && new Date(flash.endTime) >= now;
  const { timeLeft, parts, isExpired } = useCountdown(isFlashLive ? flash?.endTime : null);
  const redisStock = product?.redisFlashStock;
  const isSoldOut = isFlashLive && redisStock !== null && redisStock <= 0;
  const displayPrice = isFlashLive ? flash.salePrice : product?.price;
  const discount = isFlashLive ? pct(flash?.salePrice, product?.price) : pct(product?.price, product?.mrp);

  const handleAddToCart = async () => {
    if (!isLoggedIn) { nav("/login"); return; }
    setAddingCart(true);
    try {
      await addToCart({ productId: id, quantity: 1 });
      await fetchCart();
      toast.success("Added to cart!");
    } catch (err) { toast.error(err.message); }
    finally { setAddingCart(false); }
  };

  const handleFlashBuy = async (shippingAddress) => {
    if (!isLoggedIn) { nav("/login"); return; }
    setBuyLoading(true);
    try {
      const { data } = await createFlashOrder({ productId: id, shippingAddress });
      const { razorpayOrder, razorpayKeyId, order } = data.data;

      openPayment({
        razorpayOrder,
        keyId: razorpayKeyId,
        user,
        onSuccess: async (response) => {
          try {
            await verifyFlashPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Order confirmed! Congratulations!");
            nav("/orders");
          } catch (err) { toast.error(err.message); }
          finally { setBuyLoading(false); }
        },
        onFailure: (err) => {
          toast.error(err.message || "Payment failed");
          setBuyLoading(false);
        },
      });
      setShowAddressForm(false);
    } catch (err) {
      toast.error(err.message);
      setBuyLoading(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!product) return <div className="empty-state"><h3>Product not found</h3></div>;

  const images = product.images?.length ? product.images : [`https://picsum.photos/seed/${product._id}/600/600`];

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          {/* Images */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              <img src={images[activeImage]} alt={product.name} />
              {isFlashLive && !isExpired && (
                <div className={styles.liveChip}>Live Sale</div>
              )}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbRow}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${activeImage === i ? styles.thumbActive : ""}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className={styles.infoPanel}>
            <div className={styles.badges}>
              {product.brand && <span className="badge badge-primary">{product.brand}</span>}
              <span className="badge badge-primary">{product.category}</span>
              {product.isFeatured && <span className="badge badge-success">Featured</span>}
            </div>

            <h1 className={styles.name}>{product.name}</h1>

            {/* Flash Sale Box */}
            {isFlashLive && !isExpired ? (
              <div className={styles.flashBox}>
                <div className={styles.flashBoxHeader}>
                  <div className={styles.livePulse} />
                  <span className={styles.flashLabel}>Flash Sale — Ends in</span>
                  <div className={styles.flashTimer}>
                    {parts && ["h", "m", "s"].map((k) => (
                      <span key={k} className={styles.timerBlock}>
                        {String(parts[k]).padStart(2, "0")}
                        <small>{k.toUpperCase()}</small>
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.priceGroup}>
                  <span className={styles.flashPrice}>&#8377;{flash.salePrice.toLocaleString("en-IN")}</span>
                  <span className={styles.origPrice}>&#8377;{product.price.toLocaleString("en-IN")}</span>
                  <span className={styles.discountBadge}>{discount}% OFF</span>
                </div>
                {redisStock !== null && (
                  <div className={styles.stockBar}>
                    <div className={styles.stockBarFill} style={{ width: `${Math.max(5, (redisStock / flash.flashStock) * 100)}%` }} />
                    <span className={styles.stockText}>
                      {isSoldOut ? "Sold Out" : `${redisStock} of ${flash.flashStock} left`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.priceGroup}>
                <span className={styles.price}>&#8377;{(product.price || 0).toLocaleString("en-IN")}</span>
                {product.mrp > product.price && (
                  <>
                    <span className={styles.origPrice}>&#8377;{product.mrp.toLocaleString("en-IN")}</span>
                    <span className={styles.discountBadge}>{discount}% OFF</span>
                  </>
                )}
              </div>
            )}

            {flash?.isActive && !isFlashLive && new Date(flash.startTime) > now && (
              <div className={styles.upcomingBox}>
                Flash sale starts at {new Date(flash.startTime).toLocaleString()}
              </div>
            )}

            <p className={styles.desc}>{product.description}</p>

            <div className={styles.stockStatus}>
              {product.stock > 0 ? (
                <span className={styles.inStock}>In Stock ({product.stock} available)</span>
              ) : (
                <span className={styles.outStock}>Out of Stock</span>
              )}
            </div>

            {/* Action Buttons */}
            {!showAddressForm ? (
              <div className={styles.actions}>
                <button
                  className={`btn btn-outline btn-lg ${styles.cartBtn}`}
                  onClick={handleAddToCart}
                  disabled={addingCart || product.stock === 0}
                >
                  {addingCart ? "Adding..." : "Add to Cart"}
                </button>
                {isFlashLive && !isExpired ? (
                  <button
                    className={`btn btn-accent btn-lg ${styles.buyBtn}`}
                    onClick={() => setShowAddressForm(true)}
                    disabled={isSoldOut || buyLoading}
                  >
                    {isSoldOut ? "Sold Out" : "Buy Now (Flash)"}
                  </button>
                ) : (
                  <button
                    className={`btn btn-primary btn-lg ${styles.buyBtn}`}
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || addingCart}
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            ) : (
              <AddressForm onSubmit={handleFlashBuy} loading={buyLoading} />
            )}
            {showAddressForm && (
              <button className={`btn btn-ghost ${styles.cancelBtn}`} onClick={() => setShowAddressForm(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
