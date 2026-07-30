import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { Marquee } from "@/components/Reveal";
import { useSEO } from "@/lib/seo";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export default function Shop() {
  useSEO({ title: "Beauty Supply Store", description: "Shop wigs, braiding hair, extensions, human hair and premium hair care products at Toyer Hair Sarnia. Local pickup or shipping across Ontario.", path: "/shop" });
  const [products, setProducts] = useState([]);
  const [params, setParams] = useSearchParams();
  const active = params.get("category") || "All";
  const { addItem } = useCart();

  useEffect(() => { api.get("/products").then((r) => setProducts(r.data)).catch(() => {}); }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <div>
      <section className="bg-secondary/50 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Beauty Supply</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">The beauty supply store</h1>
          <p className="text-muted-foreground mt-3">Free shipping on orders over $150 CAD · Local pickup in Sarnia</p>
        </div>
      </section>

      <Marquee variant="dark" speed={26} items={[
        "🎁 Buy 1 wig, get 1 FREE — while stocks last",
        "Selling fast — don't miss your favourites",
        "Free shipping over $150 CAD",
        "New arrivals just landed",
        "Limited stock on bestsellers",
      ]} />

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((c) => (
            <button key={c} data-testid={`shop-filter-${c.toLowerCase().replace(/\s/g, "-")}`}
              onClick={() => (c === "All" ? setParams({}) : setParams({ category: c }))}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${active === c ? "bg-gold text-white border-gold" : "bg-white border-greyc text-ink/70 hover:border-gold"}`}>{c}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <Reveal key={p.id}>
              <div className="group bg-white rounded-2xl border border-greyc overflow-hidden h-full flex flex-col card-lift" data-testid={`shop-product-${p.id}`}>
                <Link to={`/product/${p.id}`} className="block relative aspect-square overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.badge && <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">{p.badge}</span>}
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</span>
                  <Link to={`/product/${p.id}`}><h3 className="font-semibold text-ink text-sm mt-0.5 line-clamp-2 hover:text-gold flex-1">{p.name}</h3></Link>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-heading text-lg font-semibold text-ink">${p.price}</span>
                    <button data-testid={`shop-add-${p.id}`} onClick={() => { addItem(p); toast.success("Added to cart"); }} className="bg-secondary hover:bg-gold hover:text-white text-ink rounded-full p-2 transition-colors"><ShoppingBag size={16} /></button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-16">No products in this category yet.</p>}
      </section>
    </div>
  );
}
