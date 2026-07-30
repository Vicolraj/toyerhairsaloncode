import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useSEO } from "@/lib/seo";

export default function Gallery() {
  useSEO({ title: "Gallery", description: "Browse our gallery of braids, locs, natural hair, kids styles, wigs and salon work at Toyer Hair Sarnia.", path: "/gallery" });
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { api.get("/gallery").then((r) => setImages(r.data)).catch(() => {}); }, []);
  const cats = ["All", ...Array.from(new Set(images.map((i) => i.category)))];
  const filtered = filter === "All" ? images : images.filter((i) => i.category === filter);

  return (
    <div>
      <section className="bg-secondary/50 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Gallery</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Our work speaks</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {cats.map((c) => (
            <button key={c} data-testid={`gallery-filter-${c.toLowerCase().replace(/\s/g, "-")}`} onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${filter === c ? "bg-gold text-white border-gold" : "bg-white border-greyc text-ink/70 hover:border-gold"}`}>{c}</button>
          ))}
        </div>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((img) => (
            <button key={img.id} onClick={() => setLightbox(img.url)} className="block w-full rounded-2xl overflow-hidden group">
              <img src={img.url} alt={`${img.category} hairstyle`} className="w-full object-cover group-hover:opacity-90 transition-opacity" loading="lazy" />
            </button>
          ))}
        </div>
      </section>

      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-white" onClick={() => setLightbox(null)}><X size={30} /></button>
          <img src={lightbox} alt="Full view" className="max-h-[88vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
