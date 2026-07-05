import React, { useState } from "react";
import { LogIn, UserPlus, ShoppingBag, Store, Mail, Lock, Phone, User, Tag } from "lucide-react";

interface AuthScreenProps {
  onLoginSuccess: (user: any, store: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"owner" | "customer">("owner");
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [paymentUpiId, setPaymentUpiId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick Login triggers
  const handleQuickLogin = async (type: "owner" | "customer") => {
    setLoading(true);
    setError("");
    const targetEmail = type === "owner" ? "owner@smartqr.com" : "customer@smartqr.com";
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLoginSuccess(data.user, data.store);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const bodyPayload = isLogin
      ? { email }
      : {
          name,
          email,
          role,
          phone,
          storeName: role === "owner" ? storeName : undefined,
          paymentUpiId: role === "owner" ? paymentUpiId : undefined
        };

    try {
      if (!email) throw new Error("Please specify email address.");
      if (!isLogin && !name) throw new Error("Name is required.");
      if (!isLogin && role === "owner" && !storeName) throw new Error("Store Name is required.");

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (isLogin) {
        onLoginSuccess(data.user, data.store);
      } else {
        // Automatically switch to login after registration or log in directly
        setIsLogin(true);
        setError("Account created successfully! Please sign in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-slate-900 overflow-y-auto">
      {/* Upper Brand Section */}
      <div className="text-center my-6">
        <div className="inline-flex p-3.5 bg-indigo-600/15 text-indigo-400 rounded-2xl mb-3 border border-indigo-500/20 shadow-inner">
          <ShoppingBag className="w-8 h-8 animate-bounce-gentle" />
        </div>
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">Smart QR Billing</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Instant scans, automatic checkout and smart store operations
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        {/* Tab Selection */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl mb-5 border border-slate-800">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isLogin ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isLogin ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className={`p-3 rounded-lg text-xs font-medium mb-4 text-center border ${
            error.includes("successfully") 
              ? "bg-teal-500/10 border-teal-500/25 text-teal-400" 
              : "bg-rose-500/10 border-rose-500/25 text-rose-400"
          }`}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Manish Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="e.g. owner@smartqr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      role === "owner"
                        ? "bg-indigo-600/15 border-indigo-500 text-indigo-400"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Owner / Store</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      role === "customer"
                        ? "bg-teal-500/15 border-teal-500 text-teal-400"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Customer / Shopper</span>
                  </button>
                </div>
              </div>

              {role === "owner" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Store Name</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Smart Mart Patna"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merchant UPI ID (payout)</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="e.g. username@upi"
                        value={paymentUpiId}
                        onChange={(e) => setPaymentUpiId(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
          >
            {isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In securely
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create {role === "owner" ? "Owner" : "Customer"} Account
              </>
            )}
          </button>
        </form>

        {/* Quick Demo logins - extremely practical */}
        {isLogin && (
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleQuickLogin("owner")}
                className="py-2 px-1 bg-slate-950/60 border border-indigo-500/20 hover:border-indigo-500/50 rounded-xl flex items-center justify-center gap-1.5 transition-all text-indigo-400 text-[10px] font-bold"
              >
                <Store className="w-3.5 h-3.5" />
                Owner Demo
              </button>
              <button
                onClick={() => handleQuickLogin("customer")}
                className="py-2 px-1 bg-slate-950/60 border border-teal-500/20 hover:border-teal-500/50 rounded-xl flex items-center justify-center gap-1.5 transition-all text-teal-400 text-[10px] font-bold"
              >
                <User className="w-3.5 h-3.5" />
                Customer Demo
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-slate-500 mt-4">
        Default Demo password is empty (simulation mode)
      </div>
    </div>
  );
}
