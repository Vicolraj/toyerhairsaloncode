import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Music2, MessageCircle, Loader2 } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { SectionHeading } from "@/components/Reveal";
import { useSEO } from "@/lib/seo";
import { BUSINESS } from "@/lib/business";
import { toast } from "sonner";

export default function Contact() {
  useSEO({ title: "Contact", description: "Contact Toyer Hair in Sarnia, Ontario. Call, email, WhatsApp or visit us. See hours and directions.", path: "/contact" });
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/contact", form);
      toast.success(data.message);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (e2) { toast.error(formatApiErrorDetail(e2.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <section className="bg-secondary/50 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Get in Touch</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">We'd love to hear from you</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-2 gap-10">
        <div>
          <SectionHeading overline="Visit / Call" title="Contact details" />
          <div className="mt-6 space-y-4">
            <a href={`tel:${BUSINESS.phoneRaw}`} data-testid="contact-call" className="flex items-center gap-3 bg-white rounded-2xl border border-greyc p-4 hover:border-gold transition-colors"><Phone className="text-gold" size={20} /><div><p className="text-xs text-muted-foreground">Call us</p><p className="font-semibold text-ink">{BUSINESS.phone}</p></div></a>
            <a href={`mailto:${BUSINESS.email}`} data-testid="contact-email" className="flex items-center gap-3 bg-white rounded-2xl border border-greyc p-4 hover:border-gold transition-colors"><Mail className="text-gold" size={20} /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-semibold text-ink">{BUSINESS.email}</p></div></a>
            <a href={BUSINESS.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white rounded-2xl border border-greyc p-4 hover:border-gold transition-colors"><MessageCircle className="text-[#25D366]" size={20} /><div><p className="text-xs text-muted-foreground">WhatsApp</p><p className="font-semibold text-ink">Chat with us</p></div></a>
            <a href={BUSINESS.maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white rounded-2xl border border-greyc p-4 hover:border-gold transition-colors"><MapPin className="text-gold" size={20} /><div><p className="text-xs text-muted-foreground">Location</p><p className="font-semibold text-ink">{BUSINESS.city} — Get directions</p></div></a>
          </div>

          <div className="bg-white rounded-2xl border border-greyc p-5 mt-4">
            <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><Clock size={18} className="text-gold" /> Business Hours</h3>
            <ul className="text-sm space-y-1.5">
              {BUSINESS.hours.map((h) => (
                <li key={h.day} className="flex justify-between"><span className="text-muted-foreground">{h.day}</span><span className="text-ink font-medium">{h.time}</span></li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 mt-4">
            <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-greyc flex items-center justify-center text-ink hover:text-gold hover:border-gold"><Instagram size={18} /></a>
            <a href={BUSINESS.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-greyc flex items-center justify-center text-ink hover:text-gold hover:border-gold"><Facebook size={18} /></a>
            <a href={BUSINESS.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-greyc flex items-center justify-center text-ink hover:text-gold hover:border-gold"><Music2 size={18} /></a>
          </div>
        </div>

        <div>
          <SectionHeading overline="Message" title="Send us a note" />
          <form onSubmit={submit} className="bg-white rounded-2xl border border-greyc p-6 mt-6 space-y-4">
            <input data-testid="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            <div className="grid sm:grid-cols-2 gap-4">
              <input data-testid="contact-form-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
              <input data-testid="contact-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <textarea data-testid="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" className="w-full border border-greyc rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            <button data-testid="contact-submit" disabled={busy} className="w-full bg-gold text-white py-3.5 rounded-full font-semibold hover:bg-goldLight transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Send Message"}
            </button>
          </form>
          <div className="rounded-2xl overflow-hidden border border-greyc mt-6 h-64">
            <iframe title="map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Sarnia,Ontario,Canada&output=embed"></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
