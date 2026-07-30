import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";

export default function Login() {
  useSEO({ title: "Login", description: "Log in or create your Toyer Hair account to manage appointments and orders." });
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      toast.success("Welcome!");
      navigate("/account");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white rounded-3xl border border-greyc p-8">
        <div className="flex bg-secondary rounded-full p-1 mb-6">
          <button data-testid="tab-login" onClick={() => setMode("login")} className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${mode === "login" ? "bg-white shadow text-ink" : "text-muted-foreground"}`}>Login</button>
          <button data-testid="tab-register" onClick={() => setMode("register")} className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${mode === "register" ? "bg-white shadow text-ink" : "text-muted-foreground"}`}>Register</button>
        </div>
        <h1 className="font-heading text-3xl font-medium text-ink mb-5">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <>
              <input data-testid="auth-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
              <input data-testid="auth-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </>
          )}
          <input data-testid="auth-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
          <input data-testid="auth-password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
          <button data-testid="auth-submit" disabled={busy} className="w-full bg-gold text-white py-3.5 rounded-full font-semibold hover:bg-goldLight transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-5">Staff? <Link to="/admin/login" className="text-gold font-semibold">Admin login</Link></p>
      </div>
    </div>
  );
}
