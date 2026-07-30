import React, { useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { BUSINESS } from "@/lib/business";

const GoogleG = () => (
  <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
);

export const GoogleReviews = () => {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/google-reviews").then((r) => setData(r.data)).catch(() => setData({ source: "none" })); }, []);

  const rating = data?.rating || BUSINESS.googleRating;
  const total = data?.total || BUSINESS.googleTotal;
  const url = (data && data.source === "google" && data.maps_url) ? data.maps_url : BUSINESS.googleReviews;
  const live = data?.source === "google" && data.reviews?.length > 0;

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-white rounded-3xl border border-greyc p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GoogleG />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Google Reviews</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-heading text-3xl font-semibold text-ink">{Number(rating).toFixed(1)}</span>
                <span className="flex text-gold">{[...Array(5)].map((_, i) => <Star key={i} size={17} className={i < Math.round(rating) ? "fill-gold" : ""} />)}</span>
                <span className="text-sm text-muted-foreground">· {total} reviews</span>
              </div>
            </div>
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" data-testid="google-reviews-link" className="inline-flex items-center gap-2 bg-gold text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-goldLight transition-colors">
            {live ? "See all on Google" : "Read our Google reviews"} <ExternalLink size={15} />
          </a>
        </div>

        {live && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {data.reviews.map((r, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="bg-cream/60 rounded-2xl border border-greyc p-5 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    {r.photo ? <img src={r.photo} alt={r.author} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-gold">{r.author[0]}</div>}
                    <div>
                      <p className="font-semibold text-ink text-sm">{r.author}</p>
                      <div className="flex text-gold">{[...Array(r.rating)].map((_, j) => <Star key={j} size={12} className="fill-gold" />)}</div>
                    </div>
                  </div>
                  <p className="text-sm text-ink/80 leading-relaxed line-clamp-5">"{r.text}"</p>
                  <p className="text-xs text-muted-foreground mt-3">{r.relative_time}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
