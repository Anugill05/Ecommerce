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

  const [tab,          setTab]         = useState("user");
  const [email,        setEmail]       = useState("");
  const [otp,          setOtp]         = useState("");
  const [name,         setName]        = useState("");
  const [adminEmail,   setAdminEmail]  = useState("");
  const [password,     setPassword]    = useState("");
  const [showPass,     setShowPass]    = useState(false);
  const [adminLoading, setAdminLoading]= useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address"); return;
    }
    try {
      await otpFlow.sendCode(email);
      toast.success("Verification code sent to your email");
    } catch (err) { toast.error(err.message); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("OTP must be 6 digits"); return; }
    try {
      const { token, user } = await otpFlow.verifyCode(otp, name);
      login(token, user);
      toast.success("Welcome to FlashKart!");
      nav(from, { replace: true });
    } catch (err) { toast.error(err.message); }
  };

  const handleResend = async () => {
    try {
      await otpFlow.resend();
      toast.success("Verification code resent");
    } catch (err) { toast.error(err.message); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const { data } = await adminLogin({ email: adminEmail, password });
      login(data.data.token, data.data.user);
      toast.success("Admin login successful!");
      nav("/admin", { replace: true });
    } catch (err) { toast.error(err.message); }
    finally { setAdminLoading(false); }
  };

  const handleTabChange = (t) => {
    setTab(t);
    otpFlow.reset();
    setEmail(""); setOtp(""); setName(""); setAdminEmail(""); setPassword("");
  };

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bgLeft} />
      <div className={styles.bgRight} />

      <div className={styles.wrapper}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <Link to="/" className={styles.brandLogo}>
            <div className={styles.brandMark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span>FlashKart</span>
          </Link>
          <div className={styles.leftContent}>
            <h2 className={styles.leftTitle}>
              Shop Smarter.<br />
              <span className={styles.leftAccent}>Save Bigger.</span>
            </h2>
            <p className={styles.leftSub}>
              Join 50,000+ happy customers getting the best deals every day.
            </p>
            <div className={styles.leftFeatures}>
              {[
                ["⚡", "Flash sales every hour"],
                ["🔒", "100% secure checkout"],
                ["🚚", "Free delivery above ₹499"],
                ["↩️", "Easy 14-day returns"],
              ].map(([icon, text]) => (
                <div key={text} className={styles.leftFeature}>
                  <span className={styles.leftFeatureIcon}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.leftStats}>
            {[["10K+", "Products"], ["50K+", "Customers"], ["70%", "Max Off"]].map(([val, lbl]) => (
              <div key={lbl} className={styles.leftStat}>
                <span className={styles.leftStatVal}>{val}</span>
                <span className={styles.leftStatLbl}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className={styles.rightPanel}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "user" ? styles.tabActive : ""}`}
              onClick={() => handleTabChange("user")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              User Login
            </button>
            <button
              className={`${styles.tab} ${tab === "admin" ? styles.tabActive : ""}`}
              onClick={() => handleTabChange("admin")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Admin Access
            </button>
          </div>

          {/* ── User: Email OTP ── */}
          {tab === "user" && (
            <div className={styles.formArea}>
              {!otpFlow.isOtpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div className={styles.formHead}>
                    <h2 className={styles.formTitle}>Welcome Back!</h2>
                    <p className={styles.formSub}>Login to your account using email</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className={styles.inputWrap}>
                      <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        className={`form-input ${styles.iconInput}`}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <button
                    className={`btn btn-primary btn-full ${styles.submitBtn}`}
                    disabled={otpFlow.isSending || !email}
                  >
                    {otpFlow.isSending ? (
                      <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Sending code...</>
                    ) : (
                      <>Send OTP</>
                    )}
                  </button>

                  <div className={styles.dividerRow}>
                    <span className={styles.dividerLine} />
                    <span className={styles.dividerText}>OR</span>
                    <span className={styles.dividerLine} />
                  </div>

                  <button type="button" className={styles.googleBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <p className={styles.terms}>
                    New to FlashKart?{" "}
                    <Link to="/login" className={styles.textLink}>Create an account</Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className={styles.formHead}>
                    <div className={styles.otpSentIcon}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <h2 className={styles.formTitle}>Check Your Email</h2>
                    <p className={styles.formSub}>
                      We sent a 6-digit code to <strong>{email}</strong>
                      <button type="button" className={styles.textLink} onClick={otpFlow.reset} style={{ marginLeft: 6 }}>
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
                    <p className={styles.inputHint}>Check your inbox (and spam folder) for the code</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Your Name <span className={styles.optional}>(first-time only)</span>
                    </label>
                    <input
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name (optional)"
                      autoComplete="name"
                    />
                  </div>

                  <button
                    className={`btn btn-primary btn-full ${styles.submitBtn}`}
                    disabled={otpFlow.isVerifying || otp.length < 6}
                  >
                    {otpFlow.isVerifying ? (
                      <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Verifying...</>
                    ) : (
                      <>Verify & Login</>
                    )}
                  </button>

                  <div className={styles.resendRow}>
                    {otpFlow.resendCountdown > 0 ? (
                      <p className={styles.resendNote}>
                        Resend code in <span className={styles.countdown}>{otpFlow.resendCountdown}s</span>
                      </p>
                    ) : (
                      <button type="button" className={styles.resendBtn} onClick={handleResend} disabled={otpFlow.isSending}>
                        {otpFlow.isSending ? "Resending..." : "Resend Code"}
                      </button>
                    )}
                  </div>

                  {otpFlow.error && <div className={styles.errorBox}>{otpFlow.error}</div>}
                </form>
              )}
            </div>
          )}

          {/* ── Admin Login ── */}
          {tab === "admin" && (
            <div className={styles.formArea}>
              <div className={styles.adminBadge}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin Access
              </div>
              <div className={styles.formHead}>
                <h2 className={styles.formTitle}>Secure Login</h2>
                <p className={styles.formSub}>Restricted access — authorized personnel only</p>
              </div>

              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className={styles.inputWrap}>
                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      className={`form-input ${styles.iconInput}`}
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@flashkart.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className={styles.inputWrap}>
                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      className={`form-input ${styles.iconInput} ${styles.passInput}`}
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.showPassBtn}
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.adminMeta}>
                  <label className={styles.rememberLabel}>
                    <input type="checkbox" className={styles.rememberCheck} />
                    Remember me
                  </label>
                  <button type="button" className={styles.textLink}>Forgot Password?</button>
                </div>

                <button
                  className={`btn btn-primary btn-full ${styles.submitBtn}`}
                  disabled={adminLoading}
                >
                  {adminLoading ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Signing in...</>
                  ) : (
                    <>Login</>
                  )}
                </button>

                <p className={styles.secureNote}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Secure Admin Panel • Authorized Access Only
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}