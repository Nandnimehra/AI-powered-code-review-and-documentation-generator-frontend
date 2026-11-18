import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api";
import "./Login.css";

/* ---------- talk to the Django backend ----------
   Log in:  POST /api/auth/login/     -> { access, refresh }
   Sign up: POST /api/auth/register/  then log in with the same details
   The access token is saved as "access_token", which api.js already sends
   as the Authorization header on every request.
*/
async function authenticate(mode, username, password) {
  const name = username.trim();
  if (!name) throw new Error("Please enter your username.");
  if (!password) throw new Error("Please enter your password.");
  if (mode === "signup" && password.length < 8) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (mode === "signup") {
    await api.post("/auth/register/", { username: name, password });
  }

  const { data } = await api.post("/auth/login/", { username: name, password });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

// Turns a backend / network error into one readable line.
// Django (DRF) sends field errors like { username: ["..."], password: ["..."] }.
function readError(err) {
  if (err.code === "ERR_NETWORK") {
    return "Could not connect to the backend. Please check whether the Django server is running.";
  }
  const res = err.response;
  if (!res) return err.message || "Something went wrong.";
  if (res.status === 401) return "Invalid username or password.";
  if (res.data && typeof res.data === "object") {
    const messages = Object.values(res.data)
      .flat()
      .filter((m) => typeof m === "string");
    if (messages.length) return messages.join(" ");
  }
  return `Something went wrong (${res.status}). Please try again.`;
}

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" className="lg-icon">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // The landing page opens /login?mode=signup from its "Start for free" buttons
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login"); // "login" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authenticate(mode, username, password);
      navigate("/app");
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="login-page">
      <div className="lg-shell">
        {/* Left: brand panel */}
        <aside className="lg-aside">
          <Link to="/" className="lg-brand">
            <span className="lg-logo">T</span>
            <span className="lg-brand-name">Tufy</span>
          </Link>

          <div className="lg-pitch">
            <h2>
              Review code.
              <br />
              <span>Ship with confidence.</span>
            </h2>
            <p>Severity-tagged issues, auto-generated docs, and a reading map for any repo.</p>
          </div>

          <div className="lg-preview">
            <div className="lg-preview-head">
              <span>auth_service.py</span>
              <span className="lg-pill">3 issues</span>
            </div>
            <pre>
              <code>
                <span className="k">def</span> <span className="f">login</span>(user, pw):{"\n"}
                <span className="bad">{"  "}<span className="k">if</span> user.password == pw:</span>
                {"\n"}
                {"    "}<span className="k">return</span> <span className="k">True</span>
              </code>
            </pre>
            <div className="lg-issue">
              <span className="lg-tag">Critical</span>
              <span>Password is compared in plain text.</span>
            </div>
          </div>
        </aside>

        {/* Right: form */}
        <main className="lg-form-wrap">
          <div className="lg-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={isLogin ? "on" : ""}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={!isLogin ? "on" : ""}
              onClick={() => { setMode("signup"); setError(""); }}
            >
              Sign up
            </button>
          </div>

          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="lg-sub">
            {isLogin ? "Log in to continue reviewing your code." : "Start reviewing code in under a minute."}
          </p>

          <form onSubmit={handleSubmit} className="lg-form">
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <div className="lg-pw">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={show} />
                </button>
              </div>
            </label>

            {error && <div className="lg-error" role="alert">{error}</div>}

            <button type="submit" className="lg-submit" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="lg-switch">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => { setMode(isLogin ? "signup" : "login"); setError(""); }}>
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </main>
      </div>
    </div>
  );
}
