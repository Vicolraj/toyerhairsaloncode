import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { SectionHeading } from "@/components/Reveal";
import { useSEO } from "@/lib/seo";

const CATEGORY_ORDER = ["Braiding", "Twists", "Natural Hair", "Locs", "Wigs", "Kids Hair"];

export default function Pricing() {
  useSEO({ title: "Pricing", description: "Transparent pricing for hair braiding, locs, natural hair, wigs and kids styles at Toyer Hair Sarnia.", path: "/pricing" });
  const [services, setServices] = useState([]);
  useEffect(() => { api.get("/services").then((r) => setServices(r.data)).catch(() => {}); }, []);
  const grouped = CATEGORY_ORDER.map((cat) => ({ cat, items: services.filter((s) => s.category === cat) })).filter((g) => g.items.length);

  return (
    <div>
      <section className="bg-secondary/50 py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Pricing</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Service price list</h1>
          <p className="text-muted-foreground mt-4">Starting prices in CAD. Final pricing depends on length, size and hair added. A deposit may be required to secure your booking.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-14">
        {grouped.map((g) => (
          <div key={g.cat} className="mb-10">
            <SectionHeading overline="Category" title={g.cat} />
            <div className="bg-white rounded-2xl border border-greyc mt-5 divide-y divide-greyc">
              {g.items.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-ink">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{Math.round(s.duration_minutes / 60 * 10) / 10}h · {s.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading text-lg font-semibold text-ink whitespace-nowrap">from ${s.price}</p>
                    <Link to={`/book?service=${s.id}`} className="text-xs font-semibold text-gold">Book →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
