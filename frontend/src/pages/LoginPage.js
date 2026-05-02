import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { adminLogin } from "../api";
import { useAuth } from "../context/AuthContext";
import { useEmailOTP } from "../hooks/useEmailOTP";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { login }  = useAuth();
  const nav        = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from || "/";
  const otpFlow    = useEmailOTP();

  const [tab,         setTab]         = useState("user");
  const [email,       setEmail]       = useState("");
  const [otp,         setOtp]         = useState("");
  const [name,        setName]        = useState("");
  const [adminEmail,  setAdminEmail]  = useState("");
  const [password,    setPassword]    = useState("");
  const [adminLoading,setAdminLoading]= useState(false);

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await otpFlow.sendCode(email);
      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Step 2: verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("OTP must be 6 digits"); return; }
    try {
      const { token, user } = await otpFlow.verifyCode(otp, name);
      login(token, user);
      toast.success("Login successful!");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Resend ──────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    try {
      await otpFlow.resend();
      toast.success("Verification code resent");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Admin login ─────────────────────────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const { data } = await adminLogin({ email: adminEmail, password });
      login(data.data.token, data.data.user);
      toast.success("Admin login successful!");
      nav("/admin", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleTabChange = (t) => {
    setTab(t);
    otpFlow.reset();
    setEmail(""); setOtp(""); setName(""); setAdminEmail(""); setPassword("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>FlashKart</Link>
          <p className={styles.tagline}>India's fastest flash sale platform</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {["user", "admin"].map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => handleTabChange(t)}
            >
              {t === "user" ? "User Login" : "Admin Login"}
            </button>
          ))}
        </div>

        {/* ── User: Email OTP Flow ─────────────────────────────────────────── */}
        {tab === "user" && (
          <div className={styles.body}>
            {!otpFlow.isOtpSent ? (

              /* Step 1 — Email */
              <form onSubmit={handleSendOtp} className={styles.form}>
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>Step 1 of 2</span>
                  <h2 className={styles.formTitle}>Sign in to FlashKart</h2>
                  <p className={styles.formSub}>Enter your email to receive a verification code</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg"
                  disabled={otpFlow.isSending || !email}
                >
                  {otpFlow.isSending
                    ? <span className={styles.loadingRow}><span className={styles.spinner} />Sending code...</span>
                    : "Send Verification Code"
                  }
                </button>

                <p className={styles.terms}>
                  By continuing, you agree to our{" "}
                  <span className={styles.textLink}>Terms of Service</span>{" "}
                  and <span className={styles.textLink}>Privacy Policy</span>
                </p>
              </form>

            ) : (

              /* Step 2 — OTP */
              <form onSubmit={handleVerifyOtp} className={styles.form}>
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>Step 2 of 2</span>
                  <h2 className={styles.formTitle}>Enter Verification Code</h2>
                  <p className={styles.formSub}>
                    We sent a 6-digit code to{" "}
                    <strong>{email}</strong>{" "}
                    <button
                      type="button"
                      className={styles.textLink}
                      style={{ fontWeight: 600 }}
                      onClick={otpFlow.reset}
                    >
                      Change
                    </button>
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <input
                    className={`form-input ${styles.otpInput}`}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                  />
                  <p className={styles.otpHint}>
                    Check your inbox (and spam folder) for the code
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Name <span className={styles.optional}>(first time only)</span></label>
                  <input
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name (optional)"
                    autoComplete="name"
                  />
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg"
                  disabled={otpFlow.isVerifying || otp.length < 6}
                >
                  {otpFlow.isVerifying
                    ? <span className={styles.loadingRow}><span className={styles.spinner} />Verifying...</span>
                    : "Verify & Login"
                  }
                </button>

                {/* Resend */}
                <div className={styles.resendRow}>
                  {otpFlow.resendCountdown > 0 ? (
                    <p className={styles.resendNote}>
                      Resend code in{" "}
                      <span className={styles.countdown}>{otpFlow.resendCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      className={styles.resendBtn}
                      onClick={handleResend}
                      disabled={otpFlow.isSending}
                    >
                      {otpFlow.isSending ? "Resending..." : "Resend Code"}
                    </button>
                  )}
                </div>

                {/* Inline error */}
                {otpFlow.error && (
                  <div className={styles.errorBox}>{otpFlow.error}</div>
                )}
              </form>

            )}
          </div>
        )}

        {/* ── Admin Login ──────────────────────────────────────────────────── */}
        {tab === "admin" && (
          <div className={styles.body}>
            <form onSubmit={handleAdminLogin} className={styles.form}>
              <div className={styles.stepInfo}>
                <h2 className={styles.formTitle}>Admin Login</h2>
                <p className={styles.formSub}>Restricted access — authorized personnel only</p>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                disabled={adminLoading}
              >
                {adminLoading
                  ? <span className={styles.loadingRow}><span className={styles.spinner} />Signing in...</span>
                  : "Sign In as Admin"
                }
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}