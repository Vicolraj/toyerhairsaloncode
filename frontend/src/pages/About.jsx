import React from "react";
import { Link } from "react-router-dom";
import { Heart, Sparkles, Users, Award, ArrowRight } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/Reveal";
import { useSEO } from "@/lib/seo";
import { BUSINESS } from "@/lib/business";

export default function About() {
  useSEO({ title: "About Us", description: "Learn about Toyer Hair, an Afro-Caribbean beauty & wig studio in Sarnia, Ontario dedicated to healthy hair, quality products and warm customer service.", path: "/about" });
  return (
    <div>
      <section className="bg-secondary/50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Our Story</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Passion for Afro-Caribbean beauty</h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            Toyer Hair began with a simple belief: everyone deserves to feel confident in their natural crown. Based in {BUSINESS.city}, we're a full-service beauty studio and beauty supply store dedicated to healthy, beautiful Afro-Caribbean hair.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <img src="https://images.unsplash.com/photo-1592520113018-180c8bc831c9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000" alt="Toyer Hair studio" className="rounded-3xl w-full h-[440px] object-cover" />
        </Reveal>
        <Reveal delay={0.1}>
          <SectionHeading overline="Who We Are" title="Rooted in culture, focused on healthy hair" />
          <p className="text-muted-foreground mt-5 leading-relaxed">
            From protective braids and locs to natural hair care, custom wigs and kids' styles, our stylists specialize in textured hair of every kind. We take the time to understand your hair, your lifestyle and your goals.
          </p>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Our on-site beauty supply store stocks the braiding hair, extensions, wigs and premium care products we trust and use — so you can maintain your look at home with confidence.
          </p>
          <Link to="/book" className="inline-flex items-center gap-2 mt-8 bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-goldLight transition-colors">Book with us <ArrowRight size={16} /></Link>
        </Reveal>
      </section>

      <section className="bg-cream py-16">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading overline="Our Values" title="What we stand for" center />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {[[Heart, "Healthy Hair First", "Gentle techniques that protect your edges and promote growth."], [Sparkles, "Quality Products", "Only trusted, salon-grade products for you and your family."], [Users, "Warm & Welcoming", "A friendly space for clients of all ages and hair types."], [Award, "Skilled Stylists", "Experienced specialists in Afro-Caribbean & textured hair."]].map(([Icon, t, d]) => (
              <Reveal key={t}>
                <div className="bg-white rounded-2xl border border-greyc p-6 h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto"><Icon className="text-gold" size={22} /></div>
                  <h3 className="font-heading text-lg font-semibold text-ink mt-4">{t}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
