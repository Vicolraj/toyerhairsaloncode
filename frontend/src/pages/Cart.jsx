import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, Tag } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Cart() {
  const { items, updateQty, removeItem, total } = useCart();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setEmail(user?.email || localStorage.getItem("toyer_email") || ""); }, [user]);

  const shipping = total >= 150 || total === 0 ? 0 : 8;
  const grand = total + shipping;

  const checkout = async () => {
    if (!items.length) return;
    if (!email) return toast.error("Please enter your email for the receipt");
    setLoading(true);
    try {
      localStorage.setItem("toyer_email", email);
      const { data } = await api.post("/checkout/session", {
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        origin_url: window.location.origin, customer_email: email, coupon,
      });
      window.location.href = data.url;
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-heading text-4xl font-medium text-ink mb-8">Your Cart</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-greyc p-16 text-center">
          <ShoppingBag className="mx-auto text-gold/50" size={44} />
          <p className="text-muted-foreground mt-5 mb-6">Your cart is empty.</p>
          <Link to="/shop" data-testid="empty-cart-shop" className="inline-flex items-center gap-2 bg-gold text-white px-7 py-3 rounded-full font-semibold hover:bg-goldLight transition-colors">Browse the Shop <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((i) => (
              <div key={i.product.id} data-testid={`cart-item-${i.product.id}`} className="flex gap-4 bg-white rounded-2xl border border-greyc p-4">
                <img src={i.product.image} alt={i.product.name} className="w-24 h-24 object-cover rounded-xl" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div><h3 className="font-semibold text-ink">{i.product.name}</h3><span className="text-xs text-muted-foreground">{i.product.category}</span></div>
                    <button data-testid={`cart-remove-${i.product.id}`} onClick={() => removeItem(i.product.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-greyc rounded-full">
                      <button data-testid={`cart-dec-${i.product.id}`} onClick={() => updateQty(i.product.id, i.quantity - 1)} className="px-3 py-1.5 text-ink/60 hover:text-gold"><Minus size={14} /></button>
                      <span className="px-3 text-sm font-semibold">{i.quantity}</span>
                      <button data-testid={`cart-inc-${i.product.id}`} onClick={() => updateQty(i.product.id, i.quantity + 1)} className="px-3 py-1.5 text-ink/60 hover:text-gold"><Plus size={14} /></button>
                    </div>
                    <span className="font-heading text-lg font-semibold text-ink">${(i.product.price * i.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-greyc p-6 sticky top-24">
              <h3 className="font-heading text-xl font-semibold text-ink mb-5">Order Summary</h3>
              <div className="space-y-2 text-sm border-b border-greyc pb-4">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-ink">${total.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span className="text-ink">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-heading text-2xl font-semibold text-ink">${grand.toFixed(2)} <span className="text-xs text-muted-foreground font-body">CAD</span></span>
              </div>

              <div className="relative mb-3">
                <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input data-testid="coupon-input" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code (e.g. WELCOME15)" className="w-full border border-greyc rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              </div>
              <input data-testid="checkout-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for receipt" className="w-full border border-greyc rounded-full px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-gold" />

              <button data-testid="checkout-btn" onClick={checkout} disabled={loading} className="w-full bg-gold text-white py-3.5 rounded-full font-semibold hover:bg-goldLight transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing</> : <>Checkout with Stripe <ArrowRight size={16} /></>}
              </button>
              <p className="text-muted-foreground text-[11px] text-center mt-3">Secure payments · Visa, Mastercard, Amex, Apple Pay & Google Pay · CAD</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
