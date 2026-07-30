import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tag, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";

export default function SpecialOffers() {
  useSEO({ title: "Special Offers", description: "Current promotions and discounts at Toyer Hair Sarnia — new client deals, product bundles and weekly specials.", path: "/offers" });
  const [promos, setPromos] = useState([]);
  useEffect(() => { api.get("/promotions").then((r) => setPromos(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <section className="bg-secondary/50 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Special Offers</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Deals worth booking for</h1>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-6">
        {promos.map((p) => (
          <Reveal key={p.id}>
            <div className="bg-white rounded-2xl border border-greyc p-7 h-full flex flex-col">
              <span className="inline-flex items-center gap-1.5 self-start bg-secondary text-gold text-xs font-semibold px-3 py-1 rounded-full"><Tag size={12} /> {p.badge}</span>
              <h3 className="font-heading text-2xl font-semibold text-ink mt-4">{p.title}</h3>
              <p className="text-muted-foreground mt-2 flex-1">{p.description}</p>
              <div className="flex items-center justify-between mt-5 pt-5 border-t border-greyc">
                <span className="text-sm">Use code <span className="font-mono font-semibold text-gold">{p.code}</span></span>
                <Link to="/book" className="text-sm font-semibold text-gold inline-flex items-center gap-1">Book now <ArrowRight size={14} /></Link>
              </div>
            </div>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
