"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { useRole } from "../lib/role-context";
import img1 from "../asset/WhatsApp Image 2026-05-05 at 9.52.38 PM (1).jpeg";
import img2 from "../asset/WhatsApp Image 2026-05-05 at 9.52.38 PM (2).jpeg";
import img3 from "../asset/WhatsApp Image 2026-05-05 at 9.52.38 PM.jpeg";
import logo from "../asset/logo.jpeg";

const SLIDE_IMAGES = [img1, img2, img3];

export function LoginScreen() {
  const { login } = useAuth();
  const { setRole } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (result.ok) {
      // Re-fetch user to get the role if needed, or login already set it
    } else {
      setError(result.error || "Login failed.");
    }
  };

  const fillDemo = (which: "admin" | "ops") => {
    setEmail(which === "admin" ? "j.assey@nipana.tz" : "m.rwey@nipana.tz");
    setPassword("demo");
    setError(null);
  };

  return (
    <div className="h-screen w-screen relative flex items-center justify-center bg-ink-950 overflow-hidden">
      {/* Background Slider - now full screen */}
      <div className="absolute inset-0 z-0">
        {SLIDE_IMAGES.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              idx === currentSlide 
                ? "opacity-100 scale-105" 
                : "opacity-0 scale-100"
            }`}
          >
            <img
              src={img.src}
              alt={`Slide ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Darker, more premium gradient overlay */}
            <div 
              className="absolute inset-0" 
              style={{ background: "linear-gradient(160deg, rgba(31, 26, 20, 0.7) 0%, rgba(122, 87, 28, 0.4) 50%, rgba(31, 26, 20, 0.7) 100%)" }}
            />
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-[480px] px-6 py-12 max-h-screen overflow-y-auto">
        <div 
          className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden"
        >
          {/* Header Section with Logo */}
          <div className="px-8 pt-10 pb-2 text-center">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden bg-white shadow-lg border border-line"
              >
                <img src={logo.src} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-display text-2xl text-ink leading-tight">NIPANA Atlas</div>
                <div className="text-[11px] tracking-[0.25em] uppercase text-ink-muted mt-1">GBMS · Mwanza</div>
              </div>
            </div>

            <h1 className="font-display text-3xl leading-tight text-ink">Welcome back</h1>
            <p className="text-ink-muted text-sm mt-2">
              Sign in to your gold business management account.
            </p>
          </div>

          <div className="p-8 pt-6">
            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5 font-semibold">Email Address</div>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@nipana.tz"
                    className="input bg-paper-50/50"
                    style={{ paddingLeft: "44px" }}
                  />
                </div>
              </label>

              <label className="block">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted font-semibold">Password</span>
                  <button type="button" className="text-[11px] text-gold-700 hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <i className="ri-lock-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input bg-paper-50/50"
                    style={{ paddingLeft: "44px", paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
                    aria-label="Toggle password visibility"
                  >
                    <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-ink-muted text-gold-600 focus:ring-gold-500 accent-gold-500"
                  />
                  Remember this device
                </label>
              </div>

              {error && (
                <div className="surface-flat border-rose-500/30 bg-rose-50 px-3 py-3 text-sm text-rose-700 flex items-center gap-2 rounded-xl">
                  <i className="ri-error-warning-line text-lg" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full justify-center py-3.5 text-base shadow-xl shadow-gold-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <><i className="ri-loader-4-line animate-spin" /> Signing in...</>
                ) : (
                  <><i className="ri-login-circle-line" /> Sign in to Atlas</>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-3">
              <div className="flex-1 h-px bg-ink-100" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold">Demo accounts</span>
              <div className="flex-1 h-px bg-ink-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => fillDemo("admin")} className="surface-flat p-3 text-left hover:border-gold-500 transition group hover:bg-gold-50/30">
                <div className="text-[10px] uppercase tracking-[0.14em] text-gold-700 mb-1 font-bold">Admin</div>
                <div className="text-sm text-ink font-semibold group-hover:text-gold-900">Julius Assey</div>
                <div className="text-[10px] text-ink-muted truncate">j.assey@nipana.tz</div>
              </button>
              <button onClick={() => fillDemo("ops")} className="surface-flat p-3 text-left hover:border-gold-500 transition group hover:bg-gold-50/30">
                <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted mb-1 font-bold group-hover:text-gold-700 transition-colors">Sales & Ops</div>
                <div className="text-sm text-ink font-semibold group-hover:text-gold-900">Maria Rweyemamu</div>
                <div className="text-[10px] text-ink-muted truncate">m.rwey@nipana.tz</div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[11px] text-ink-faint">
                © 2026 NIPANA Atlas · Gold Business Management System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
