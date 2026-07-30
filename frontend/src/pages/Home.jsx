import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Calendar, ShoppingBag, MapPin, Phone, Sparkles, ShieldCheck, HeartHandshake, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, SectionHeading, Marquee, AnimatedCounter } from "@/components/Reveal";
import { GoogleReviews } from "@/components/GoogleReviews";
import { useSEO } from "@/lib/seo";
import { BUSINESS } from "@/lib/business";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const HERO = "https://images.unsplash.com/photo-1629145810320-aec9e63dd798?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Home() {
  useSEO({ title: "Hair Braiding & Beauty Supply", description: "Toyer Hair is an Afro-Caribbean beauty & wig studio and beauty supply store in Sarnia, Ontario. Braids, locs, natural hair, kids styles, wigs, extensions & hair products. Book online today." });
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [promos, setPromos] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => {});
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
    api.get("/reviews").then((r) => setReviews(r.data)).catch(() => {});
    api.get("/promotions").then((r) => setPromos(r.data)).catch(() => {});
  }, []);

  const featuredServices = services.filter((s) => s.popular).slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center py-14 lg:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-white border border-greyc rounded-full px-4 py-1.5 text-xs font-semibold text-gold"><Sparkles size={13} /> Sarnia's Afro-Caribbean Beauty Home</span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-medium text-ink leading-[1.05] mt-5">
              Beautiful, healthy hair — <span className="text-gold-gradient">crafted with care</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mt-5 max-w-lg leading-relaxed">
              Expert braids, locs, natural hair, kids styles & custom wigs. Plus a full beauty supply store with everything you need to keep your hair thriving.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/book" data-testid="hero-book" className="inline-flex items-center gap-2 bg-gold text-white px-7 py-3.5 rounded-full font-semibold hover:bg-goldLight transition-colors"><Calendar size={18} /> Book Appointment</Link>
              <Link to="/shop" data-testid="hero-shop" className="inline-flex items-center gap-2 bg-white border border-greyc text-ink px-7 py-3.5 rounded-full font-semibold hover:border-gold transition-colors"><ShoppingBag size={18} /> Shop Products</Link>
            </div>
            <div className="flex flex-wrap gap-5 mt-8 text-sm">
              <a href={`tel:${BUSINESS.phoneRaw}`} className="inline-flex items-center gap-2 text-ink/70 hover:text-gold"><Phone size={16} className="text-gold" /> {BUSINESS.phone}</a>
              <a href={BUSINESS.maps} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-ink/70 hover:text-gold"><MapPin size={16} className="text-gold" /> Directions</a>
              <span className="inline-flex items-center gap-1 text-ink/70"><Star size={16} className="text-gold fill-gold" /> 4.9 · Loved locally</span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative">
              <img src={HERO} alt="Afro-Caribbean hair styling in Sarnia" className="rounded-3xl w-full h-[420px] lg:h-[520px] object-cover shadow-xl" />
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg p-4 border border-greyc hidden sm:block">
                <p className="text-2xl font-heading font-semibold text-ink">10+ yrs</p>
                <p className="text-xs text-muted-foreground">of styling expertise</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOMO MARQUEE */}
      <Marquee variant="gold" speed={30} items={[
        "⭐ Weekends book out fast — grab your slot before it's gone",
        "🔥 New client? Save 15% — this month only",
        "Only a few chairs left this week",
        "Your dream style is one tap away",
        "Don't miss out — reserve your appointment today",
        "Join 8,000+ happy clients in Sarnia",
      ]} />

      {/* TRUST BAR */}
      <section className="bg-ink text-white/90">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[[ShieldCheck, "Certified Stylists"], [HeartHandshake, "Gentle, Healthy Hair Care"], [Truck, "Local Pickup & Shipping"], [Sparkles, "Premium Products"]].map(([Icon, t], i) => (
            <div key={i} className="flex items-center gap-3"><Icon size={20} className="text-gold" /> {t}</div>
          ))}
        </div>
      </section>

      {/* PROMOS */}
      {promos.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-14">
          <SectionHeading overline="Current Offers" title="Save on your next visit" />
          <div className="grid md:grid-cols-3 gap-5 mt-8">
            {promos.map((p) => (
              <Reveal key={p.id}>
                <div className="bg-white rounded-2xl border border-greyc p-6 h-full">
                  <span className="inline-block bg-secondary text-gold text-xs font-semibold px-3 py-1 rounded-full">{p.badge}</span>
                  <h3 className="font-heading text-xl font-semibold text-ink mt-3">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
                  <p className="text-xs mt-3">Code: <span className="font-mono font-semibold text-gold">{p.code}</span></p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED SERVICES */}
      <section className="bg-secondary/50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <SectionHeading overline="Our Services" title="Signature styles" />
            <Link to="/services" className="text-sm font-semibold text-gold inline-flex items-center gap-1 hover:gap-2 transition-all">All services <ArrowRight size={16} /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {featuredServices.map((s) => (
              <Reveal key={s.id}>
                <Link to="/book" className="group block bg-white rounded-2xl border border-greyc overflow-hidden h-full card-lift">
                  <div className="h-52 overflow-hidden hover-zoom"><img src={s.image} alt={s.name} className="w-full h-full object-cover" /></div>
                  <div className="p-5">
                    <span className="text-xs uppercase tracking-wider text-gold font-semibold">{s.category}</span>
                    <h3 className="font-heading text-xl font-semibold text-ink mt-1">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{s.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-greyc">
                      <span className="font-semibold text-ink">from ${s.price} <span className="text-xs text-muted-foreground">CAD</span></span>
                      <span className="text-sm text-gold font-semibold inline-flex items-center gap-1">Book <ArrowRight size={14} /></span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <SectionHeading overline="Beauty Supply" title="Shop bestsellers" />
          <Link to="/shop" className="text-sm font-semibold text-gold inline-flex items-center gap-1 hover:gap-2 transition-all">Shop all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {products.slice(0, 4).map((p) => (
            <Reveal key={p.id}>
              <div className="group bg-white rounded-2xl border border-greyc overflow-hidden card-lift">
                <Link to={`/product/${p.id}`} className="block relative aspect-square overflow-hidden hover-zoom">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  {p.badge && <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">{p.badge}</span>}
                </Link>
                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</span>
                  <Link to={`/product/${p.id}`}><h3 className="font-semibold text-ink text-sm mt-0.5 line-clamp-1 hover:text-gold">{p.name}</h3></Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-heading text-lg font-semibold text-ink">${p.price}</span>
                    <button data-testid={`home-add-${p.id}`} onClick={() => { addItem(p); toast.success("Added to cart"); }} className="bg-secondary hover:bg-gold hover:text-white text-ink rounded-full p-2 transition-colors"><ShoppingBag size={16} /></button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* STATS COUNTERS */}
      <section className="bg-secondary/40 border-y border-greyc">
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[["10", "+", "Years of artistry"], ["8000", "+", "Happy clients"], ["40", "+", "Signature styles"], ["4.9", "★", "Average rating"]].map(([v, s, l], i) => (
            <Reveal key={l} delay={i * 0.1} dir="scale">
              <div className="font-heading text-5xl md:text-6xl font-semibold text-gold-gradient"><AnimatedCounter value={v} suffix={s} /></div>
              <p className="text-sm text-muted-foreground mt-2">{l}</p>
            </Reveal>
          ))}
        </div>
      </section>


      {/* WHY US */}
      <section className="bg-ink text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <img src="https://images.pexels.com/photos/36441633/pexels-photo-36441633.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="Braiding at Toyer Hair Sarnia" className="rounded-3xl w-full h-[380px] object-cover" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Why Toyer Hair</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-medium leading-tight">The care your hair deserves, right here in Sarnia</h2>
            <ul className="mt-6 space-y-4">
              {["Specialists in Afro-Caribbean & textured hair", "Healthy-hair focused, gentle techniques", "Quality braiding hair, wigs & products in-store", "Warm, welcoming space for the whole family"].map((t) => (
                <li key={t} className="flex gap-3 text-white/85"><span className="text-gold mt-1">✓</span> {t}</li>
              ))}
            </ul>
            <Link to="/about" className="inline-flex items-center gap-2 mt-8 bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-goldLight transition-colors">Our Story <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading overline="Reviews" title="What our clients say" center />
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {reviews.slice(0, 3).map((r) => (
            <Reveal key={r.id}>
              <div className="bg-white rounded-2xl border border-greyc p-6 h-full">
                <div className="flex gap-0.5 text-gold mb-3">{[...Array(r.rating)].map((_, i) => <Star key={i} size={15} className="fill-gold" />)}</div>
                <p className="text-ink/80 leading-relaxed">"{r.text}"</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-greyc">
                  <span className="font-semibold text-ink text-sm">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.source}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-8"><Link to="/reviews" className="text-sm font-semibold text-gold">Read more reviews →</Link></div>
      </section>

      {/* GOOGLE REVIEWS */}
      <GoogleReviews />


      {/* FOMO MARQUEE 2 */}
      <Marquee variant="dark" speed={26} reverse items={[
        "🎁 Buy 1 wig, get 1 FREE — while stocks last",
        "Free shipping over $150 CAD",
        "Limited-time offers ending soon",
        "Treat yourself — you've earned it",
        "New arrivals just dropped in-store",
        "Book now, pay a small deposit to lock it in",
      ]} />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-gold rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="font-heading text-3xl sm:text-4xl font-medium">Ready for your next look?</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">Book your appointment online in under a minute, or visit our beauty supply store.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-7">
            <Link to="/book" className="bg-white text-ink px-7 py-3.5 rounded-full font-semibold hover:bg-cream transition-colors">Book Appointment</Link>
            <Link to="/shop" className="bg-ink text-white px-7 py-3.5 rounded-full font-semibold hover:bg-black transition-colors">Shop Now</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
