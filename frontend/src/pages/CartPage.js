import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { removeFromCart, updateCartItem, createOrder, verifyPayment } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useRazorpay } from "../hooks/useRazorpay";
import styles from "./CartPage.module.css";

const AddressModal = ({ onConfirm, onClose, loading, user }) => {
  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "",
    line1: "", city: "", state: "", pincode: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Shipping Address</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={set("name")} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={set("phone")} placeholder="10-digit phone" maxLength={10} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address Line 1</label>
            <input className="form-input" value={form.line1} onChange={set("line1")} placeholder="House/flat no, street, area" />
          </div>
          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={set("city")} placeholder="City" />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-input" value={form.state} onChange={set("state")} placeholder="State" />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input className="form-input" value={form.pincode} onChange={set("pincode")} placeholder="6-digit" maxLength={6} />
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(form)} disabled={loading}>
            {loading ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();
  const { openPayment } = useRazorpay();
  const nav = useNavigate();
  const [updating, setUpdating] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      await fetchCart();
      toast.success("Item removed");
    } catch (err) { toast.error(err.message); }
  };

  const handleQuantity = async (productId, qty) => {
    setUpdating(productId);
    try {
      await updateCartItem(productId, qty);
      await fetchCart();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(null); }
  };

  const handleCheckout = async (shippingAddress) => {
    setCheckoutLoading(true);
    try {
      const { data } = await createOrder({ shippingAddress });
      const { razorpayOrder, razorpayKeyId, order } = data.data;

      openPayment({
        razorpayOrder,
        keyId: razorpayKeyId,
        user,
        onSuccess: async (response) => {
          try {
            await verifyPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Order placed successfully!");
            await fetchCart();
            nav("/orders");
          } catch (err) { toast.error(err.message); }
          finally { setCheckoutLoading(false); }
        },
        onFailure: (err) => {
          toast.error(err.message || "Payment failed");
          setCheckoutLoading(false);
        },
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
      setCheckoutLoading(false);
    }
  };

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 499 ? 0 : 1;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className="empty-state" style={{ marginTop: 60 }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" strokeWidth="1.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <h3 style={{ marginTop: 16 }}>Your cart is empty</h3>
            <p>Add items to get started</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h2 className={styles.pageTitle}>Shopping Cart ({items.length} items)</h2>
        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.itemsCol}>
            {items.map((item) => {
              const p = item.productId;
              if (!p) return null;
              const price = item.currentPrice || p.price;
              return (
                <div key={p._id} className={styles.cartItem}>
                  <img
                    src={p.images?.[0] || `https://picsum.photos/seed/${p._id}/80/80`}
                    alt={p.name}
                    className={styles.itemImage}
                  />
                  <div className={styles.itemInfo}>
                    <Link to={`/products/${p._id}`} className={styles.itemName}>{p.name}</Link>
                    <p className={styles.itemBrand}>{p.brand}</p>
                    <div className={styles.itemPriceRow}>
                      <span className={styles.itemPrice}>&#8377;{price.toLocaleString("en-IN")}</span>
                      {p.mrp > p.price && (
                        <span className={styles.itemMrp}>&#8377;{p.mrp.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => item.quantity > 1 && handleQuantity(p._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating === p._id}
                      >-</button>
                      <span className={styles.qty}>{updating === p._id ? "..." : item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => item.quantity < 10 && handleQuantity(p._id, item.quantity + 1)}
                        disabled={item.quantity >= 10 || updating === p._id}
                      >+</button>
                    </div>
                    <p className={styles.itemTotal}>
                      &#8377;{(price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    <button className={styles.removeBtn} onClick={() => handleRemove(p._id)}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className={styles.summaryCol}>
            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Price Details</h3>
              <div className={styles.summaryRow}>
                <span>Price ({items.length} items)</span>
                <span>&#8377;{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Delivery Charges</span>
                <span className={shipping === 0 ? styles.free : ""}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Amount</span>
                <span>&#8377;{total.toLocaleString("en-IN")}</span>
              </div>
              {shipping === 0 && (
                <p className={styles.savingText}>You are saving &#8377;49 on delivery!</p>
              )}
              <button
                className={`btn btn-primary btn-full ${styles.checkoutBtn}`}
                onClick={() => setShowModal(true)}
              >
                Proceed to Checkout
              </button>
              <Link to="/" className={styles.continueShopping}>Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AddressModal
          onConfirm={handleCheckout}
          onClose={() => setShowModal(false)}
          loading={checkoutLoading}
          user={user}
        />
      )}
    </div>
  );
}
