"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      name: fullName,
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Something went wrong. Please try again.");
    } else {
      router.push("/");
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand__mark">SR</span>
          <span className="auth-brand-name">SignalRoom</span>
        </div>

        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>Start running technical interviews today</p>
        </div>

        <button
          className="google-btn"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          type="button"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting…" : "Sign up with Google"}
        </button>

        <div className="auth-divider">
          <span>or create an account with email</span>
        </div>

        {error && (
          <div className="auth-alert auth-alert--error" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSignup} noValidate>
          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Carter"
              autoComplete="name"
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </label>

          <button
            className="button button--primary button--full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>

      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <span className="brand__mark brand__mark--lg">SR</span>
          </div>
          <h2>Real-time technical interviews, reimagined.</h2>
          <p>
            Video, shared code editor, live chat, and interviewer signals —
            all in one synchronized workspace.
          </p>
          <ul className="auth-features">
            <li>
              <span className="feature-dot" />
              Live collaborative code editor
            </li>
            <li>
              <span className="feature-dot" />
              HD video and audio calls
            </li>
            <li>
              <span className="feature-dot" />
              Real-time interviewer dashboard
            </li>
            <li>
              <span className="feature-dot" />
              Instant candidate signals
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
