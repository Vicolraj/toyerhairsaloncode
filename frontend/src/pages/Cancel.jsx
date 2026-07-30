import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, CalendarX, CheckCircle2 } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { toast } from "sonner";

export default function Cancel() {
  const { token } = useParams();
  const [appt, setAppt] = useState(null);
  const [state, setState] = useState("loading"); // loading | found | cancelled | notfound
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/appointments/by-token/${token}`)
      .then((r) => {
        setAppt(r.data);
        setState(r.data.status === "cancelled" ? "cancelled" : "found");
      })
      .catch(() => setState("notfound"));
  }, [token]);

  const doCancel = async () => {
    setBusy(true);
    try {
      await api.post("/appointments/cancel", { cancel_token: token });
      setState("cancelled");
      toast.success("Appointment cancelled. Confirmation sent to your email.");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Could not cancel");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-espresso min-h-screen pt-40 pb-28">
      <div className="max-w-xl mx-auto px-6">
        <Reveal className="border border-white/10 bg-surface/40 p-12 text-center">
          {state === "loading" && <Loader2 className="mx-auto text-gold animate-spin" size={44} />}

          {state === "notfound" && (
            <>
              <CalendarX className="mx-auto text-destructive" size={52} />
              <h1 className="font-heading text-4xl font-light text-cream mt-6">Appointment not found</h1>
              <p className="text-cream/60 mt-3">This cancellation link is invalid or has expired.</p>
              <Link to="/book" className="inline-block mt-8 bg-gold text-espresso px-8 py-3 uppercase tracking-[0.15em] text-sm hover:bg-goldLight transition-colors">Book an Appointment</Link>
            </>
          )}

          {state === "found" && appt && (
            <>
              <CalendarX className="mx-auto text-gold" size={52} strokeWidth={1.3} />
              <h1 className="font-heading text-4xl font-light text-cream mt-6">Cancel this appointment?</h1>
              <div className="text-left bg-espresso border border-white/10 mt-8 p-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gold uppercase tracking-[0.15em] text-xs">Service</span><span className="text-cream">{appt.service_name}</span></div>
                <div className="flex justify-between"><span className="text-gold uppercase tracking-[0.15em] text-xs">Date</span><span className="text-cream">{appt.date}</span></div>
                <div className="flex justify-between"><span className="text-gold uppercase tracking-[0.15em] text-xs">Time</span><span className="text-cream">{appt.time}</span></div>
              </div>
              <button data-testid="confirm-cancel-btn" onClick={doCancel} disabled={busy} className="w-full mt-8 bg-destructive text-white py-4 uppercase tracking-[0.15em] text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? <><Loader2 size={16} className="animate-spin" /> Cancelling…</> : "Yes, Cancel Appointment"}
              </button>
              <Link to="/" className="inline-block mt-4 text-cream/50 text-xs uppercase tracking-[0.15em] hover:text-gold">Keep my appointment</Link>
            </>
          )}

          {state === "cancelled" && (
            <>
              <CheckCircle2 className="mx-auto text-gold" size={52} />
              <h1 className="font-heading text-4xl font-light text-cream mt-6">Appointment cancelled</h1>
              <p className="text-cream/60 mt-3">We've sent a confirmation to your email. We hope to see you again soon!</p>
              <Link to="/book" className="inline-block mt-8 bg-gold text-espresso px-8 py-3 uppercase tracking-[0.15em] text-sm hover:bg-goldLight transition-colors">Rebook</Link>
            </>
          )}
        </Reveal>
      </div>
    </div>
  );
}
