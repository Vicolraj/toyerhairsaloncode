import React, { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Reveal, SectionHeading } from "@/components/Reveal";
import { GoogleReviews } from "@/components/GoogleReviews";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";

export default function Reviews() {
  useSEO({ title: "Reviews", description: "Read client reviews and testimonials for Toyer Hair Sarnia and leave your own.", path: "/reviews" });
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ name: "", rating: 5, text: "", service: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/reviews").then((r) => setReviews(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.text) return toast.error("Please add your name and review");
    setBusy(true);
    try {
      const { data } = await api.post("/reviews", form);
      toast.success(data.message);
      setForm({ name: "", rating: 5, text: "", service: "" });
    } catch (e2) { toast.error(formatApiErrorDetail(e2.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "5.0";

  return (
    <div>
      <section className="bg-secondary/50 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Reviews</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Loved by our community</h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex text-gold">{[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-gold" />)}</div>
            <span className="font-semibold text-ink">{avg}</span><span className="text-muted-foreground">· {reviews.length} reviews</span>
          </div>
        </div>
      </section>

      <GoogleReviews />

      <section className="max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
          {reviews.map((r) => (
            <Reveal key={r.id}>
              <div className="bg-white rounded-2xl border border-greyc p-6 h-full">
                <div className="flex gap-0.5 text-gold mb-3">{[...Array(r.rating)].map((_, i) => <Star key={i} size={15} className="fill-gold" />)}</div>
                <p className="text-ink/80 leading-relaxed">"{r.text}"</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-greyc text-sm">
                  <span className="font-semibold text-ink">{r.name}</span>
                  <span className="text-muted-foreground">{r.service || r.source}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-greyc p-6 sticky top-24">
            <SectionHeading overline="Share" title="Leave a review" />
            <form onSubmit={submit} className="mt-5 space-y-4">
              <input data-testid="review-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <input data-testid="review-service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Service (optional)" className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <div className="flex gap-1" data-testid="review-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}><Star size={26} className={n <= form.rating ? "fill-gold text-gold" : "text-greyc"} /></button>
                ))}
              </div>
              <textarea data-testid="review-text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Tell us about your experience" rows={4} className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <button data-testid="review-submit" disabled={busy} className="w-full bg-gold text-white py-3 rounded-full font-semibold hover:bg-goldLight transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
