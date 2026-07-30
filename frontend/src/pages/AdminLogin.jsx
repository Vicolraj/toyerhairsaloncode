import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== "admin") { toast.error("This is the staff portal. Use your customer login on the main site."); setLoading(false); return; }
      toast.success("Welcome back");
      navigate("/admin");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center mb-8">
          <span className="font-heading text-3xl font-semibold text-ink">TOYER <span className="text-gold-gradient">HAIR</span></span>
          <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-1">Staff Portal</span>
        </Link>
        <form onSubmit={submit} className="bg-white rounded-3xl border border-greyc p-8">
          <div className="flex items-center gap-3 mb-6"><Lock className="text-gold" size={20} /><h1 className="font-heading text-2xl font-medium text-ink">Staff Login</h1></div>
          <label className="text-xs font-semibold text-muted-foreground">Email</label>
          <input data-testid="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-greyc rounded-xl px-4 py-3 mt-1 mb-4 text-sm focus:outline-none focus:border-gold" />
          <label className="text-xs font-semibold text-muted-foreground">Password</label>
          <input data-testid="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-greyc rounded-xl px-4 py-3 mt-1 mb-6 text-sm focus:outline-none focus:border-gold" />
          <button data-testid="admin-login-btn" disabled={loading} className="w-full bg-gold text-white py-3.5 rounded-full font-semibold hover:bg-goldLight transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign In"}
          </button>
        </form>
        <Link to="/" className="block text-center text-muted-foreground text-xs mt-5 hover:text-gold">← Back to site</Link>
      </div>
    </div>
  );
}
