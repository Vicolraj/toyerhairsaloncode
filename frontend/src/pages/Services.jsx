import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, SectionHeading, Marquee } from "@/components/Reveal";
import { useSEO } from "@/lib/seo";

const CATEGORY_ORDER = ["Braiding", "Twists", "Natural Hair", "Locs", "Wigs", "Kids Hair"];

export default function Services() {
  useSEO({ title: "Hair Services in Sarnia", description: "Braiding, locs, natural hair, kids styles, wigs and more at Toyer Hair Sarnia. View all services and book online.", path: "/services" });
  const [services, setServices] = useState([]);
  const location = useLocation();

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 400);
    }
  }, [location.hash, services]);

  const grouped = CATEGORY_ORDER.map((cat) => ({ cat, items: services.filter((s) => s.category === cat) })).filter((g) => g.items.length);

  return (
    <div>
      <section className="bg-secondary/50 py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Our Services</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Styles for every crown</h1>
          <p className="text-muted-foreground mt-4">Prices are starting points and may vary by length and hair added. Choose a service to book online.</p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {grouped.map((g) => (
              <a key={g.cat} href={`#${g.cat}`} className="text-xs font-semibold bg-white border border-greyc rounded-full px-4 py-2 hover:border-gold hover:text-gold transition-colors">{g.cat}</a>
            ))}
          </div>
        </div>
      </section>

      <Marquee variant="gold" speed={28} items={[
        "⭐ Weekends book out fast — reserve early",
        "New client? Save 15% on your first visit",
        "Only a few slots left this week",
        "Your best hair day is one tap away",
        "Don't miss out — book your appointment today",
      ]} />


      {grouped.map((g) => (
        <section key={g.cat} id={g.cat} className="max-w-7xl mx-auto px-6 py-12 scroll-mt-24">
          <SectionHeading overline="Category" title={g.cat} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {g.items.map((s) => (
              <Reveal key={s.id}>
                <div className="bg-white rounded-2xl border border-greyc overflow-hidden h-full flex flex-col card-lift" data-testid={`service-${s.id}`}>
                  <div className="h-48 overflow-hidden hover-zoom"><img src={s.image} alt={s.name} className="w-full h-full object-cover" /></div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-heading text-xl font-semibold text-ink">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 flex-1">{s.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3"><Clock size={13} /> {Math.round(s.duration_minutes / 60 * 10) / 10}h</div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-greyc">
                      <span className="font-semibold text-ink">from ${s.price} <span className="text-xs text-muted-foreground">CAD</span></span>
                      <Link to={`/book?service=${s.id}`} data-testid={`service-book-${s.id}`} className="text-sm font-semibold text-white bg-gold rounded-full px-4 py-2 inline-flex items-center gap-1 hover:bg-goldLight transition-colors">Book <ArrowRight size={14} /></Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
