import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api";
import styles from "./OrdersPage.module.css";

const STATUS_META = {
  created: { label: "Created", color: "#9e9e9e" },
  confirmed: { label: "Confirmed", color: "#2874f0" },
  processing: { label: "Processing", color: "#f57c00" },
  shipped: { label: "Shipped", color: "#7b1fa2" },
  delivered: { label: "Delivered", color: "#388e3c" },
  cancelled: { label: "Cancelled", color: "#d32f2f" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  useEffect(() => {
    setLoading(true);
    getMyOrders({ page, limit: 10 })
      .then(({ data }) => {
        setOrders(data.data || []);
        setPagination({ pages: data.pagination?.pages || 1, total: data.pagination?.total || 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <h2 className={styles.title}>My Orders</h2>
        {orders.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <h3>No orders yet</h3>
            <p>When you place an order, it will appear here.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>Start Shopping</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((order) => {
              const status = STATUS_META[order.orderStatus] || STATUS_META.created;
              return (
                <div key={order._id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</span>
                      <span className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                      {order.isFlashOrder && <span className={styles.flashTag}>Flash Order</span>}
                    </div>
                    <div className={styles.statusBadge} style={{ color: status.color, borderColor: status.color + "40", background: status.color + "12" }}>
                      {status.label}
                    </div>
                  </div>

                  <div className={styles.items}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className={styles.item}>
                        <img
                          src={item.image || `https://picsum.photos/seed/${item.productId}/60/60`}
                          alt={item.name}
                          className={styles.itemImg}
                        />
                        <div className={styles.itemInfo}>
                          <p className={styles.itemName}>{item.name}</p>
                          <p className={styles.itemMeta}>Qty: {item.quantity}</p>
                        </div>
                        <p className={styles.itemPrice}>&#8377;{item.price.toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>

                  <div className={styles.orderBottom}>
                    <div className={styles.paymentInfo}>
                      <span className={styles.payLabel}>Payment:</span>
                      <span className={`${styles.payStatus} ${order.payment?.status === "paid" ? styles.paid : styles.pending}`}>
                        {order.payment?.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>
                    <p className={styles.totalAmt}>
                      Total: <strong>&#8377;{order.totalPrice.toLocaleString("en-IN")}</strong>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</button>
            <span className={styles.pageInfo}>Page {page} of {pagination.pages}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.pages}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
