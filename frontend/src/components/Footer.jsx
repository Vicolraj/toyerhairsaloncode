import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail, Clock, Music2 } from "lucide-react";
import { toast } from "sonner";
import { BUSINESS } from "@/lib/business";
import { api } from "@/lib/api";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const subscribe = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/newsletter", { email });
      toast.success(data.message);
      setEmail("");
    } catch {
      toast.error("Could not subscribe. Try again.");
    }
  };

  return (
    <footer className="bg-ink text-white/70" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <span className="font-heading text-2xl font-semibold text-white">TOYER <span className="text-gold-gradient">HAIR</span></span>
          <p className="text-[9px] uppercase tracking-[0.25em] text-white/50 mt-1">{BUSINESS.tagline}</p>
          <p className="text-sm mt-4 leading-relaxed">Afro-Caribbean beauty studio & beauty supply store in Sarnia, Ontario. Braids, locs, natural hair, wigs & more.</p>
          <div className="flex gap-3 mt-5">
            <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:border-gold transition-colors"><Instagram size={16} /></a>
            <a href={BUSINESS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:border-gold transition-colors"><Facebook size={16} /></a>
            <a href={BUSINESS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:border-gold transition-colors"><Music2 size={16} /></a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            {[["About", "/about"], ["Services", "/services"], ["Shop", "/shop"], ["Gallery", "/gallery"], ["Pricing", "/pricing"], ["Special Offers", "/offers"], ["Reviews", "/reviews"], ["FAQ", "/faq"], ["Book Appointment", "/book"]].map(([l, to]) => (
              <li key={l}><Link to={to} className="hover:text-gold transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5"><MapPin size={16} className="text-gold shrink-0 mt-0.5" /> {BUSINESS.city}</li>
            <li className="flex gap-2.5"><Phone size={16} className="text-gold shrink-0 mt-0.5" /> <a href={`tel:${BUSINESS.phoneRaw}`} className="hover:text-gold">{BUSINESS.phone}</a></li>
            <li className="flex gap-2.5"><Mail size={16} className="text-gold shrink-0 mt-0.5" /> <a href={`mailto:${BUSINESS.email}`} className="hover:text-gold">{BUSINESS.email}</a></li>
            <li className="flex gap-2.5"><Clock size={16} className="text-gold shrink-0 mt-0.5" /> Mon–Sat 9–6 · Sun Closed</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Newsletter</h4>
          <p className="text-sm mb-4">Get exclusive offers and new style drops.</p>
          <form onSubmit={subscribe} className="flex flex-col gap-2">
            <input data-testid="newsletter-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold" />
            <button data-testid="newsletter-submit" className="bg-gold text-white rounded-full py-2.5 text-sm font-semibold hover:bg-goldLight transition-colors">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} {BUSINESS.fullName}. All rights reserved.</span>
          <span>Serving Sarnia, Point Edward, Corunna, Petrolia, Chatham-Kent, London & Lambton County.</span>
        </div>
      </div>
    </footer>
  );
};
