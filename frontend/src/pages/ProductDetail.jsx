import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingBag, Minus, Plus, Heart, Check, Truck, MapPin, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useSEO } from "@/lib/seo";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    setQty(1);
    api.get(`/products/${id}`).then((r) => setData(r.data)).catch(() => setData({ error: true }));
  }, [id]);

  useSEO({ title: data?.product?.name || "Product", description: data?.product?.description || "", path: `/product/${id}` });

  const fav = async () => {
    if (!user) return toast.error("Please log in to save favourites");
    try { await api.post("/my/favorites", { kind: "product", ref: id }); toast.success("Saved to favourites"); }
    catch { toast.error("Could not save"); }
  };

  if (!data) return <div className="py-24 text-center text-muted-foreground">Loading…</div>;
  if (data.error) return <div className="py-24 text-center text-muted-foreground">Product not found. <Link to="/shop" className="text-gold">Back to shop</Link></div>;
  const p = data.product;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold mb-6"><ArrowLeft size={16} /> Back to shop</Link>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="relative rounded-3xl overflow-hidden border border-greyc bg-white">
          <img src={p.image} alt={p.name} className="w-full h-full object-cover aspect-square" />
          {p.badge && <span className="absolute top-4 left-4 bg-gold text-white text-xs font-semibold px-3 py-1 rounded-full">{p.badge}</span>}
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-gold font-semibold">{p.category}</span>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-ink mt-2">{p.name}</h1>
          <p className="font-heading text-3xl font-semibold text-ink mt-4">${p.price} <span className="text-sm text-muted-foreground font-body">CAD</span></p>
          <p className={`text-sm mt-2 ${p.stock > 0 ? "text-green-700" : "text-destructive"}`}>{p.stock > 0 ? `In stock (${p.stock} available)` : "Out of stock"}</p>
          <p className="text-muted-foreground mt-5 leading-relaxed">{p.description}</p>

          <div className="flex items-center gap-4 mt-7">
            <div className="flex items-center border border-greyc rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 text-ink/70 hover:text-gold"><Minus size={16} /></button>
              <span className="px-4 font-semibold" data-testid="pd-qty">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2.5 text-ink/70 hover:text-gold"><Plus size={16} /></button>
            </div>
            <button data-testid="pd-add-to-cart" disabled={p.stock <= 0} onClick={() => { addItem(p, qty); toast.success("Added to cart"); }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-white px-6 py-3.5 rounded-full font-semibold hover:bg-goldLight transition-colors disabled:opacity-50">
              <ShoppingBag size={18} /> Add to Cart
            </button>
            <button onClick={fav} aria-label="Save" className="w-12 h-12 rounded-full border border-greyc flex items-center justify-center text-ink/60 hover:text-gold hover:border-gold transition-colors"><Heart size={18} /></button>
          </div>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Truck size={16} className="text-gold" /> Free shipping over $150 CAD</p>
            <p className="flex items-center gap-2"><MapPin size={16} className="text-gold" /> Local pickup available in Sarnia</p>
            <p className="flex items-center gap-2"><Check size={16} className="text-gold" /> Secure checkout with Stripe</p>
          </div>
        </div>
      </div>

      {data.related?.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-2xl font-medium text-ink mb-6">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {data.related.map((r) => (
              <Link key={r.id} to={`/product/${r.id}`} className="group bg-white rounded-2xl border border-greyc overflow-hidden">
                <div className="aspect-square overflow-hidden"><img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                <div className="p-4"><h3 className="text-sm font-semibold text-ink line-clamp-1">{r.name}</h3><p className="font-heading text-lg font-semibold mt-1">${r.price}</p></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
