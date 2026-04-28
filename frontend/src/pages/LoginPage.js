// import { useState } from "react";
// import { useNavigate, useLocation, Link } from "react-router-dom";
// import toast from "react-hot-toast";
// import { sendOtp, verifyOtp, adminLogin } from "../api";
// import { useAuth } from "../context/AuthContext";
// import styles from "./LoginPage.module.css";

// export default function LoginPage() {
//   const { login } = useAuth();
//   const nav = useNavigate();
//   const location = useLocation();
//   const from = location.state?.from || "/";

//   const [tab, setTab] = useState("user"); // "user" | "admin"
//   const [step, setStep] = useState(1);   // 1 = phone, 2 = OTP
//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [name, setName] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSendOtp = async (e) => {
//     e.preventDefault();
//     if (!/^\d{10}$/.test(phone)) { toast.error("Enter a valid 10-digit phone number"); return; }
//     setLoading(true);
//     try {
//       await sendOtp(phone);
//       toast.success("OTP sent! Check server console (development mode)");
//       setStep(2);
//     } catch (err) { toast.error(err.message); }
//     finally { setLoading(false); }
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     if (otp.length !== 6) { toast.error("OTP must be 6 digits"); return; }
//     setLoading(true);
//     try {
//       const { data } = await verifyOtp({ phone, otp, name: name.trim() });
//       login(data.data.token, data.data.user);
//       toast.success(data.message || "Login successful!");
//       nav(from, { replace: true });
//     } catch (err) { toast.error(err.message); }
//     finally { setLoading(false); }
//   };

//   const handleAdminLogin = async (e) => {
//     e.preventDefault();
//     if (!phone || !password) { toast.error("Fill in all fields"); return; }
//     setLoading(true);
//     try {
//       const { data } = await adminLogin({ phone, password });
//       login(data.data.token, data.data.user);
//       toast.success("Admin login successful!");
//       nav("/admin", { replace: true });
//     } catch (err) { toast.error(err.message); }
//     finally { setLoading(false); }
//   };

//   return (
//     <div className={styles.page}>
//       <div className={styles.card}>
//         {/* Header */}
//         <div className={styles.header}>
//           <Link to="/" className={styles.logo}>FlashKart</Link>
//           <p className={styles.tagline}>India's fastest flash sale platform</p>
//         </div>

//         {/* Tabs */}
//         <div className={styles.tabs}>
//           <button
//             className={`${styles.tab} ${tab === "user" ? styles.tabActive : ""}`}
//             onClick={() => { setTab("user"); setStep(1); setPhone(""); setOtp(""); }}
//           >
//             User Login
//           </button>
//           <button
//             className={`${styles.tab} ${tab === "admin" ? styles.tabActive : ""}`}
//             onClick={() => { setTab("admin"); setPhone(""); setPassword(""); }}
//           >
//             Admin Login
//           </button>
//         </div>

//         {/* User OTP Flow */}
//         {tab === "user" && (
//           <div className={styles.body}>
//             {step === 1 ? (
//               <form onSubmit={handleSendOtp} className={styles.form}>
//                 <div className={styles.stepInfo}>
//                   <div className={styles.stepBadge}>Step 1 of 2</div>
//                   <h2 className={styles.formTitle}>Enter your phone number</h2>
//                   <p className={styles.formSub}>We'll send a 6-digit OTP for verification</p>
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Mobile Number</label>
//                   <div className={styles.phoneInput}>
//                     <span className={styles.phonePrefix}>+91</span>
//                     <input
//                       className={`form-input ${styles.phoneField}`}
//                       value={phone}
//                       onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
//                       placeholder="10-digit mobile number"
//                       inputMode="numeric"
//                     />
//                   </div>
//                 </div>
//                 <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
//                   {loading ? "Sending OTP..." : "Send OTP"}
//                 </button>
//                 <p className={styles.terms}>
//                   By continuing, you agree to our{" "}
//                   <span className={styles.link}>Terms</span> and{" "}
//                   <span className={styles.link}>Privacy Policy</span>
//                 </p>
//               </form>
//             ) : (
//               <form onSubmit={handleVerifyOtp} className={styles.form}>
//                 <div className={styles.stepInfo}>
//                   <div className={styles.stepBadge}>Step 2 of 2</div>
//                   <h2 className={styles.formTitle}>Verify OTP</h2>
//                   <p className={styles.formSub}>
//                     Sent to +91-{phone}{" "}
//                     <button type="button" className={styles.link} onClick={() => setStep(1)}>
//                       Change
//                     </button>
//                   </p>
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Your Name (optional, for new users)</label>
//                   <input
//                     className="form-input"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     placeholder="Full name"
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Enter OTP</label>
//                   <input
//                     className={`form-input ${styles.otpInput}`}
//                     value={otp}
//                     onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
//                     placeholder="6-digit OTP"
//                     inputMode="numeric"
//                     maxLength={6}
//                   />
//                 </div>
//                 <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
//                   {loading ? "Verifying..." : "Verify & Login"}
//                 </button>
//                 <p className={styles.resend}>
//                   Didn't receive?{" "}
//                   <button type="button" className={styles.link} onClick={handleSendOtp} disabled={loading}>
//                     Resend OTP
//                   </button>
//                 </p>
//               </form>
//             )}
//           </div>
//         )}

//         {/* Admin Login */}
//         {tab === "admin" && (
//           <div className={styles.body}>
//             <form onSubmit={handleAdminLogin} className={styles.form}>
//               <h2 className={styles.formTitle}>Admin Login</h2>
//               <p className={styles.formSub}>Restricted access — authorized personnel only</p>
//               <div className="form-group">
//                 <label className="form-label">Admin Phone</label>
//                 <input
//                   className="form-input"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
//                   placeholder="Registered admin phone"
//                   inputMode="numeric"
//                 />
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Password</label>
//                 <input
//                   className="form-input"
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Admin password"
//                 />
//               </div>
//               <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
//                 {loading ? "Signing in..." : "Sign In as Admin"}
//               </button>
//             </form>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// import { useState } from "react";
// import { useNavigate, useLocation, Link } from "react-router-dom";
// import toast from "react-hot-toast";
// import { sendOtp, verifyOtp, adminLogin } from "../api";
// import { useAuth } from "../context/AuthContext";
// import styles from "./LoginPage.module.css";

// export default function LoginPage() {
//   const { login } = useAuth();
//   const nav = useNavigate();
//   const location = useLocation();
//   const from = location.state?.from || "/";

//   const [tab, setTab] = useState("user");
//   const [step, setStep] = useState(1);
//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [name, setName] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // ---------------- SEND OTP ----------------
//   const handleSendOtp = async (e) => {
//     e?.preventDefault?.();

//     if (!/^\d{10}$/.test(phone)) {
//       toast.error("Enter a valid 10-digit phone number");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await sendOtp(phone);

//       if (!res || res.success === false) {
//         throw new Error(res?.message || "Failed to send OTP");
//       }

//       toast.success(res.message || "OTP sent successfully");
//       setStep(2);
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------- VERIFY OTP ----------------
//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();

//     if (otp.length !== 6) {
//       toast.error("OTP must be 6 digits");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await verifyOtp({
//         phone,
//         otp,
//         name: name?.trim(),
//       });

//       if (!res || res.success === false) {
//         throw new Error(res?.message || "Invalid OTP");
//       }

//       login(res.data.token, res.data.user);

//       toast.success(res.message || "Login successful!");
//       nav(from, { replace: true });
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------- ADMIN LOGIN ----------------
//   const handleAdminLogin = async (e) => {
//     e.preventDefault();

//     if (!phone || !password) {
//       toast.error("Fill in all fields");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await adminLogin({ phone, password });

//       if (!res || res.success === false) {
//         throw new Error(res?.message || "Invalid credentials");
//       }

//       login(res.data.token, res.data.user);

//       toast.success("Admin login successful!");
//       nav("/admin", { replace: true });
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles.page}>
//       <div className={styles.card}>

//         {/* HEADER */}
//         <div className={styles.header}>
//           <Link to="/" className={styles.logo}>FlashKart</Link>
//           <p className={styles.tagline}>India's fastest flash sale platform</p>
//         </div>

//         {/* TABS */}
//         <div className={styles.tabs}>
//           <button
//             className={`${styles.tab} ${tab === "user" ? styles.tabActive : ""}`}
//             onClick={() => {
//               setTab("user");
//               setStep(1);
//               setPhone("");
//               setOtp("");
//             }}
//           >
//             User Login
//           </button>

//           <button
//             className={`${styles.tab} ${tab === "admin" ? styles.tabActive : ""}`}
//             onClick={() => {
//               setTab("admin");
//               setPhone("");
//               setPassword("");
//             }}
//           >
//             Admin Login
//           </button>
//         </div>

//         {/* USER LOGIN */}
//         {tab === "user" && (
//           <div className={styles.body}>

//             {/* STEP 1 - PHONE */}
//             {step === 1 ? (
//               <form onSubmit={handleSendOtp} className={styles.form}>
//                 <h2>Enter Phone Number</h2>

//                 <input
//                   className="form-input"
//                   value={phone}
//                   onChange={(e) =>
//                     setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
//                   }
//                   placeholder="10-digit mobile number"
//                   inputMode="numeric"
//                 />

//                 <button disabled={loading}>
//                   {loading ? "Sending..." : "Send OTP"}
//                 </button>
//               </form>

//             ) : (

//               /* STEP 2 - OTP */
//               <form onSubmit={handleVerifyOtp} className={styles.form}>
//                 <h2>Verify OTP</h2>

//                 <input
//                   className="form-input"
//                   value={otp}
//                   onChange={(e) =>
//                     setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
//                   }
//                   placeholder="6-digit OTP"
//                 />

//                 <input
//                   className="form-input"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   placeholder="Name (optional)"
//                 />

//                 <button disabled={loading}>
//                   {loading ? "Verifying..." : "Verify OTP"}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={handleSendOtp}
//                   disabled={loading}
//                 >
//                   Resend OTP
//                 </button>
//               </form>
//             )}
//           </div>
//         )}

//         {/* ADMIN LOGIN */}
//         {tab === "admin" && (
//           <form onSubmit={handleAdminLogin} className={styles.form}>
//             <h2>Admin Login</h2>

//             <input
//               value={phone}
//               onChange={(e) =>
//                 setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
//               }
//               placeholder="Phone"
//             />

//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Password"
//             />

//             <button disabled={loading}>
//               {loading ? "Logging in..." : "Login"}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { adminLogin } from "../api";
import { useAuth } from "../context/AuthContext";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { login }    = useAuth();
  const nav          = useNavigate();
  const location     = useLocation();
  const from         = location.state?.from || "/";
  const firebaseAuth = useFirebaseAuth();

  const [tab,      setTab]      = useState("user");   // "user" | "admin"
  const [phone,    setPhone]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [name,     setName]     = useState("");
  const [password, setPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // ── User OTP flow (Firebase) ────────────────────────────────────────────────

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    try {
      await firebaseAuth.sendOTP(phone);
      toast.success("OTP sent to your mobile number");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("OTP must be 6 digits"); return; }
    try {
      const { token, user } = await firebaseAuth.verifyOTP(otp, name);
      login(token, user);
      toast.success("Login successful!");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResendOtp = async () => {
    try {
      await firebaseAuth.resendOTP();
      toast.success("OTP resent successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Admin login ─────────────────────────────────────────────────────────────

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) { toast.error("Fill in all fields"); return; }
    setAdminLoading(true);
    try {
      const { data } = await adminLogin({ phone, password });
      login(data.data.token, data.data.user);
      toast.success("Admin login successful!");
      nav("/admin", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    firebaseAuth.resetFlow();
    setPhone(""); setOtp(""); setPassword(""); setName("");
  };

  const isOtpSent = firebaseAuth.isOtpSent;

  return (
    <div className={styles.page}>
      {/* Invisible reCAPTCHA container — Firebase requires this DOM element */}
      <div id="recaptcha-container" />

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

        {/* ── User OTP Login (Firebase) ──────────────────────────────────── */}
        {tab === "user" && (
          <div className={styles.body}>
            {!isOtpSent ? (
              /* Step 1: Enter phone */
              <form onSubmit={handleSendOtp} className={styles.form}>
                <div className={styles.stepInfo}>
                  <div className={styles.stepBadge}>Step 1 of 2</div>
                  <h2 className={styles.formTitle}>Enter your phone number</h2>
                  <p className={styles.formSub}>
                    We'll send a verification code via SMS
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div className={styles.phoneInput}>
                    <span className={styles.phonePrefix}>+91</span>
                    <input
                      className={`form-input ${styles.phoneField}`}
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-full btn-lg"
                  disabled={firebaseAuth.isSending || phone.length < 10}
                >
                  {firebaseAuth.isSending ? (
                    <span className={styles.btnLoader}>Sending OTP...</span>
                  ) : (
                    "Send OTP"
                  )}
                </button>
                <div className={styles.firebaseBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff9800">
                    <path d="M3.89 15.67L6.6 12.9l2.11 2.1L6.6 17.1l-2.71-1.43zM12 2L8.1 11.38 12 15.3l3.9-3.92L12 2zm0 12.34l-2.1 2.1L12 21l2.1-4.56L12 14.34z"/>
                  </svg>
                  <span>Secured by Firebase Authentication</span>
                </div>
              </form>
            ) : (
              /* Step 2: Enter OTP */
              <form onSubmit={handleVerifyOtp} className={styles.form}>
                <div className={styles.stepInfo}>
                  <div className={styles.stepBadge}>Step 2 of 2</div>
                  <h2 className={styles.formTitle}>Verify OTP</h2>
                  <p className={styles.formSub}>
                    Sent to +91-{phone}{" "}
                    <button
                      type="button"
                      className={styles.changeLink}
                      onClick={firebaseAuth.resetFlow}
                    >
                      Change
                    </button>
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Name (first time only)</label>
                  <input
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name (optional)"
                    autoComplete="name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Enter 6-digit OTP</label>
                  <input
                    className={`form-input ${styles.otpInput}`}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="• • • • • •"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                  />
                </div>
                <button
                  className="btn btn-primary btn-full btn-lg"
                  disabled={firebaseAuth.isVerifying || otp.length < 6}
                >
                  {firebaseAuth.isVerifying ? "Verifying..." : "Verify & Login"}
                </button>

                {/* Resend with countdown */}
                <div className={styles.resendRow}>
                  {firebaseAuth.resendCountdown > 0 ? (
                    <p className={styles.resendNote}>
                      Resend OTP in{" "}
                      <span className={styles.countdown}>
                        {firebaseAuth.resendCountdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      className={styles.resendBtn}
                      onClick={handleResendOtp}
                      disabled={firebaseAuth.isSending}
                    >
                      {firebaseAuth.isSending ? "Resending..." : "Resend OTP"}
                    </button>
                  )}
                </div>

                {firebaseAuth.error && (
                  <p className={styles.errorBox}>{firebaseAuth.error}</p>
                )}
              </form>
            )}
          </div>
        )}

        {/* ── Admin Login ──────────────────────────────────────────────────── */}
        {tab === "admin" && (
          <div className={styles.body}>
            <form onSubmit={handleAdminLogin} className={styles.form}>
              <h2 className={styles.formTitle}>Admin Login</h2>
              <p className={styles.formSub}>Restricted access — authorized personnel only</p>
              <div className="form-group">
                <label className="form-label">Admin Phone</label>
                <div className={styles.phoneInput}>
                  <span className={styles.phonePrefix}>+91</span>
                  <input
                    className={`form-input ${styles.phoneField}`}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Registered admin phone"
                    inputMode="numeric"
                  />
                </div>
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
                />
              </div>
              <button
                className="btn btn-primary btn-full btn-lg"
                disabled={adminLoading}
              >
                {adminLoading ? "Signing in..." : "Sign In as Admin"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}