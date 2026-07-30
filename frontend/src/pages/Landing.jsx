import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Star, Scissors, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/Reveal";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const HERO_IMG =
  "https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";
const SALON_IMG =
  "https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200";
const GALLERY = [
  "https://images.unsplash.com/photo-1592520113018-180c8bc831c9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  "https://images.unsplash.com/photo-1629145810320-aec9e63dd798?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  "https://images.unsplash.com/photo-1770182023775-4706ce1bed72?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  "https://images.unsplash.com/photo-1658497730270-b5f4fef00ae1?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
];

const marqueeWords = ["Box Braids", "Silk Press", "Custom Wigs", "Cornrows", "Loc Care", "Twist-Outs", "Wig Installs"];

export default function Landing() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => {});
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  return (
    <div className="bg-espresso">
      {/* HERO */}
      <section ref={heroRef} className="relative h-screen min-h-[720px] overflow-hidden">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <img src={HERO_IMG} alt="African natural hair" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/40 to-espresso/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/80 via-transparent to-transparent" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs uppercase tracking-[0.4em] text-gold mb-6"
          >
            <Sparkles size={14} className="inline mr-2 -mt-1" /> Heritage · Artistry · Confidence
          </motion.p>

          <h1 className="font-heading font-light leading-[0.85] tracking-tighter text-cream">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="block text-7xl sm:text-8xl lg:text-[11rem]"
            >
              toyerr
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="block text-7xl sm:text-8xl lg:text-[11rem] text-gold-gradient italic -mt-4 lg:-mt-8"
            >
              _hair
            </motion.span>
          </h1>

          <svg className="hero-underline w-72 md:w-[30rem] -mt-2 md:-mt-6" viewBox="0 0 500 40" fill="none">
            <path d="M4 26 C 90 6, 150 6, 230 20 C 320 34, 400 30, 496 10" stroke="#C79A63" strokeWidth="3" strokeLinecap="round" />
          </svg>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="text-sm md:text-base uppercase tracking-[0.35em] text-cream/70 mt-4"
          >
            Professional African Beauty Salon
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.15 }}
            className="flex flex-col sm:flex-row gap-4 mt-10"
          >
            <button
              data-testid="hero-book-btn"
              onClick={() => navigate("/book")}
              className="group bg-gold text-espresso px-8 py-4 uppercase tracking-[0.15em] text-sm hover:bg-goldLight transition-colors flex items-center justify-center gap-2"
            >
              Book Appointment
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              data-testid="hero-shop-btn"
              onClick={() => navigate("/shop")}
              className="group border border-white/25 text-cream px-8 py-4 uppercase tracking-[0.15em] text-sm hover:bg-cream hover:text-espresso transition-colors flex items-center justify-center gap-2"
            >
              Shop Wigs & Care
              <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/40 text-[10px] uppercase tracking-[0.3em] flex flex-col items-center gap-2"
        >
          Scroll
          <span className="w-px h-10 bg-gradient-to-b from-gold to-transparent" />
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div className="bg-gold text-espresso py-4 overflow-hidden border-y border-clay/30">
        <div className="marquee-track">
          {[...marqueeWords, ...marqueeWords].map((w, i) => (
            <span key={i} className="font-heading text-2xl italic mx-8 flex items-center gap-8">
              {w} <Scissors size={16} />
            </span>
          ))}
        </div>
      </div>

      {/* INTRO / STATS */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <Reveal className="md:col-span-7">
            <p className="text-xs uppercase tracking-[0.3em] text-gold mb-5">Our Craft</p>
            <h2 className="font-heading text-4xl md:text-6xl font-light leading-tight text-cream">
              Textured hair is our <span className="italic text-gold-gradient">specialty</span>, your confidence is our mission.
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="md:col-span-5">
            <p className="text-cream/60 leading-relaxed">
              For over a decade, toyerr_hair has celebrated the beauty of African hair through
              expert braiding, natural styling, and premium protective installs — paired with a
              curated shop of wigs and hair care you can trust.
            </p>
          </Reveal>
        </div>

        <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 border-t border-white/10 pt-12">
          {[
            { n: "10+", l: "Years of Artistry" },
            { n: "8k+", l: "Happy Clients" },
            { n: "40+", l: "Signature Styles" },
            { n: "4.9★", l: "Average Rating" },
          ].map((s) => (
            <StaggerItem key={s.l}>
              <div className="font-heading text-5xl md:text-6xl text-gold-gradient">{s.n}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-cream/50 mt-2">{s.l}</div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 md:py-32 bg-surface/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-14">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Salon Services</p>
              <h2 className="font-heading text-4xl md:text-6xl font-light text-cream">Book your transformation</h2>
            </div>
            <span className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-4 py-2 text-xs uppercase tracking-[0.15em]">
              <Sparkles size={14} /> New clients save 15% on first visit
            </span>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <StaggerItem key={s.id}>
                <div
                  data-testid={`service-card-${s.id}`}
                  className="group relative bg-espresso border border-white/10 hover:border-gold/40 transition-colors duration-300 overflow-hidden h-full flex flex-col"
                >
                  <div className="relative h-60 overflow-hidden">
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <span className="absolute top-4 left-4 bg-espresso/80 backdrop-blur text-gold text-[10px] uppercase tracking-[0.2em] px-3 py-1">
                      {s.category}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-heading text-2xl text-cream">{s.name}</h3>
                    <p className="text-cream/50 text-sm mt-2 leading-relaxed flex-1">{s.description}</p>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                      <div>
                        <span className="text-gold font-heading text-2xl">${s.price}</span>
                        <span className="text-cream/40 text-xs ml-2 inline-flex items-center gap-1">
                          <Clock size={12} /> {Math.round(s.duration_minutes / 60)}h
                        </span>
                      </div>
                      <button
                        data-testid={`service-book-${s.id}`}
                        onClick={() => navigate(`/book?service=${s.id}`)}
                        className="text-xs uppercase tracking-[0.15em] text-cream hover:text-gold flex items-center gap-1 transition-colors"
                      >
                        Book <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 md:px-12">
        <Reveal className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-14">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">The Shop</p>
            <h2 className="font-heading text-4xl md:text-6xl font-light text-cream">Wigs & hair care, delivered</h2>
          </div>
          <Link to="/shop" data-testid="view-all-products" className="text-xs uppercase tracking-[0.2em] text-gold flex items-center gap-2 hover:gap-3 transition-all">
            View all products <ArrowRight size={16} />
          </Link>
        </Reveal>

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((p) => (
            <StaggerItem key={p.id}>
              <div data-testid={`featured-product-${p.id}`} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-surface border border-white/10">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  {p.badge && (
                    <span className="absolute top-3 left-3 bg-gold text-espresso text-[10px] uppercase tracking-[0.15em] px-3 py-1">{p.badge}</span>
                  )}
                  <button
                    data-testid={`featured-add-${p.id}`}
                    onClick={() => { addItem(p); toast.success(`${p.name} added to cart`); }}
                    className="absolute inset-x-0 bottom-0 bg-gold text-espresso py-3 text-xs uppercase tracking-[0.15em] translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                  >
                    Add to Cart
                  </button>
                </div>
                <h3 className="font-heading text-xl text-cream mt-4">{p.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gold">${p.price}</span>
                  <span className="text-cream/40 text-xs uppercase tracking-wider">{p.category}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* WHY US + salon image (parallax) */}
      <section className="relative py-24 md:py-40 overflow-hidden border-y border-white/5">
        <div className="absolute inset-0">
          <img src={SALON_IMG} alt="Salon interior" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-espresso/85" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Why toyerr_hair</p>
            <h2 className="font-heading text-4xl md:text-6xl font-light text-cream max-w-2xl">A studio experience, elevated</h2>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: ShieldCheck, t: "Certified Stylists", d: "Every artist is trained specifically in Afro-textured hair care and protective styling." },
              { icon: Sparkles, t: "Premium Products", d: "We use and sell only sulfate-free, moisture-rich products made for your hair." },
              { icon: Clock, t: "Real-Time Booking", d: "See open slots live, book in seconds, and get instant email confirmation." },
            ].map((f) => (
              <StaggerItem key={f.t}>
                <div className="bg-surface/60 backdrop-blur border border-white/10 p-8 h-full hover:border-gold/40 transition-colors">
                  <f.icon className="text-gold" size={30} strokeWidth={1.3} />
                  <h3 className="font-heading text-2xl text-cream mt-5">{f.t}</h3>
                  <p className="text-cream/55 text-sm mt-3 leading-relaxed">{f.d}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 md:px-12">
        <Reveal className="mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">The Gallery</p>
          <h2 className="font-heading text-4xl md:text-6xl font-light text-cream">Styles that speak</h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GALLERY.map((g, i) => (
            <Reveal key={i} delay={i * 0.1} className={i % 2 === 0 ? "md:mt-8" : ""}>
              <div className="overflow-hidden group aspect-[3/4]">
                <img src={g} alt="Hairstyle" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 md:py-32 bg-surface/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal className="mb-14 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Loved by our clients</p>
            <h2 className="font-heading text-4xl md:text-6xl font-light text-cream">Words from the chair</h2>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "Amara O.", t: "My knotless braids lasted 8 weeks and looked flawless. The best salon experience I've had, period." },
              { n: "Zainab K.", t: "The custom wig install is unmatched — so natural nobody believes it's a wig. I'm a client for life." },
              { n: "Ngozi A.", t: "Booking was effortless and the growth oil they sell actually works. My edges have never been healthier." },
            ].map((r) => (
              <StaggerItem key={r.n}>
                <div className="bg-espresso border border-white/10 p-8 h-full">
                  <div className="flex gap-1 text-gold mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#C79A63" />)}
                  </div>
                  <p className="font-heading text-xl text-cream/90 italic leading-relaxed">"{r.t}"</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-gold mt-6">{r.n}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-40 max-w-7xl mx-auto px-6 md:px-12">
        <Reveal className="relative bg-gradient-to-br from-clay/40 to-surface border border-gold/20 p-12 md:p-20 text-center overflow-hidden grain">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-5">Ready when you are</p>
          <h2 className="font-heading text-4xl md:text-7xl font-light text-cream leading-tight max-w-3xl mx-auto">
            Your best hair day is <span className="italic text-gold-gradient">one click</span> away
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <button data-testid="cta-book-btn" onClick={() => navigate("/book")} className="bg-gold text-espresso px-10 py-4 uppercase tracking-[0.15em] text-sm hover:bg-goldLight transition-colors">
              Book Appointment
            </button>
            <button data-testid="cta-shop-btn" onClick={() => navigate("/shop")} className="border border-white/25 text-cream px-10 py-4 uppercase tracking-[0.15em] text-sm hover:bg-cream hover:text-espresso transition-colors">
              Shop the Collection
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
