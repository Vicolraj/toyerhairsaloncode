import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Check, RefreshCw, Copy } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Booking() {
  useSEO({ title: "Book Appointment", description: "Book your hair appointment online at Toyer Hair Sarnia. Choose your service, date and time in seconds.", path: "/book" });
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(params.get("service") || "");
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", hair_length: "", hair_included: false, inspiration_url: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const dateStr = date ? format(date, "yyyy-MM-dd") : "";

  useEffect(() => {
    api.get("/services").then((r) => { setServices(r.data); if (!serviceId && r.data[0]) setServiceId(r.data[0].id); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone || "" }));
  }, [user]);

  const loadAvailability = useCallback(async (silent = false) => {
    if (!dateStr) return;
    if (!silent) setLoadingSlots(true);
    try {
      const { data } = await api.get(`/availability?date=${dateStr}`);
      setSlots(data.slots);
      setTime((prev) => (data.slots.find((s) => s.time === prev && s.available) ? prev : ""));
    } catch { /* ignore */ } finally { setLoadingSlots(false); }
  }, [dateStr]);

  useEffect(() => {
    loadAvailability();
    const id = setInterval(() => loadAvailability(true), 15000);
    return () => clearInterval(id);
  }, [loadAvailability]);

  const submit = async () => {
    if (!serviceId) return toast.error("Please select a service");
    if (!time) return toast.error("Please pick an available time");
    if (!form.name || !form.email) return toast.error("Please enter your name and email");
    setSubmitting(true);
    try {
      const { data } = await api.post("/appointments", { service_id: serviceId, customer_name: form.name, customer_email: form.email, customer_phone: form.phone, date: dateStr, time, hair_length: form.hair_length, hair_included: form.hair_included, inspiration_url: form.inspiration_url, notes: form.notes });
      const svc = services.find((s) => s.id === serviceId);
      setConfirmation({ ...data, service: svc?.name, date: dateStr, time });
      toast.success("Appointment booked! Check your email.");
      loadAvailability(true);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Booking failed");
      loadAvailability(true);
    } finally { setSubmitting(false); }
  };

  if (confirmation) {
    const link = `${window.location.origin}/appointment/${confirmation.cancel_token}`;
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-greyc p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto"><Check className="text-green-600" size={30} /></div>
          <h1 className="font-heading text-4xl font-medium text-ink mt-5">You're booked!</h1>
          <p className="text-muted-foreground mt-2">A confirmation email is on its way.</p>
          <div className="text-left bg-cream rounded-2xl mt-6 p-5 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-semibold">{confirmation.service}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{confirmation.date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-semibold">{confirmation.time}</span></div>
          </div>
          <div className="flex items-center gap-2 bg-cream rounded-full mt-4 p-2 pl-4">
            <input readOnly value={link} data-testid="manage-link" className="flex-1 bg-transparent text-xs text-muted-foreground focus:outline-none" />
            <button onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }} className="text-gold p-1"><Copy size={16} /></button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            <Link to={`/appointment/${confirmation.cancel_token}`} className="bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-goldLight transition-colors">Manage / Pay Deposit</Link>
            <button onClick={() => { setConfirmation(null); setTime(""); }} className="bg-secondary text-ink px-6 py-3 rounded-full font-semibold">Book Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Book Online</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Reserve your appointment</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-semibold text-ink mb-4">1 · Select a service</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <button key={s.id} data-testid={`booking-service-${s.id}`} onClick={() => setServiceId(s.id)}
                  className={`text-left p-4 rounded-xl border transition-colors ${serviceId === s.id ? "border-gold bg-gold/5" : "border-greyc bg-white hover:border-gold/50"}`}>
                  <div className="flex justify-between items-center"><span className="font-semibold text-ink text-sm">{s.name}</span><span className="text-gold font-semibold text-sm">${s.price}</span></div>
                  <span className="text-xs text-muted-foreground">{s.category}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-semibold text-ink mb-4">2 · Pick a date</h2>
              <div className="bg-white rounded-2xl border border-greyc p-2 inline-block">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={{ before: new Date() }} data-testid="booking-calendar" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-ink">3 · Choose a time</h2>
                <button onClick={() => loadAvailability()} data-testid="refresh-slots" className="text-xs text-muted-foreground hover:text-gold flex items-center gap-1"><RefreshCw size={13} className={loadingSlots ? "animate-spin" : ""} /> Live</button>
              </div>
              {loadingSlots ? <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div> : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button key={s.time} data-testid={`slot-${s.time}`} disabled={!s.available} onClick={() => setTime(s.time)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${time === s.time ? "bg-gold text-white border-gold" : s.available ? "bg-white border-greyc text-ink hover:border-gold" : "bg-secondary/60 border-transparent text-muted-foreground line-through cursor-not-allowed"}`}>{s.time}</button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">Crossed-out times are already booked.</p>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-greyc p-6 sticky top-24">
            <h2 className="font-semibold text-ink mb-4">4 · Your details</h2>
            <div className="space-y-3">
              <input data-testid="booking-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name *" className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <input data-testid="booking-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email *" className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <input data-testid="booking-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <input data-testid="booking-length" value={form.hair_length} onChange={(e) => setForm({ ...form, hair_length: e.target.value })} placeholder="Desired hair length (e.g. waist)" className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <label className="flex items-center gap-2 text-sm text-ink/80"><input type="checkbox" data-testid="booking-hair-included" checked={form.hair_included} onChange={(e) => setForm({ ...form, hair_included: e.target.checked })} className="accent-gold w-4 h-4" /> I will bring my own hair</label>
              <input data-testid="booking-inspiration" value={form.inspiration_url} onChange={(e) => setForm({ ...form, inspiration_url: e.target.value })} placeholder="Inspiration photo link (optional)" className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              <textarea data-testid="booking-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes for your stylist" rows={2} className="w-full border border-greyc rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div className="border-t border-greyc mt-4 pt-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{dateStr || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{time || "—"}</span></div>
            </div>
            <button data-testid="booking-submit" onClick={submit} disabled={submitting} className="w-full mt-5 bg-gold text-white py-3.5 rounded-full font-semibold hover:bg-goldLight transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Booking…</> : "Confirm Booking"}
            </button>
            <p className="text-muted-foreground text-[11px] text-center mt-3">You can pay a deposit and manage your booking after confirming.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
