import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarX, CheckCircle2, CreditCard, CalendarClock } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";

export default function Appointment() {
  useSEO({ title: "Manage Appointment", description: "Manage, reschedule, cancel or pay a deposit for your Toyer Hair appointment.", path: "/appointment" });
  const { token } = useParams();
  const [appt, setAppt] = useState(null);
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [showResched, setShowResched] = useState(false);
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState("");

  const load = () => api.get(`/appointments/by-token/${token}`)
    .then((r) => { setAppt(r.data); setState(r.data.status === "cancelled" ? "cancelled" : "found"); })
    .catch(() => setState("notfound"));
  useEffect(() => { load(); }, [token]);

  useEffect(() => {
    if (!showResched) return;
    const ds = format(date, "yyyy-MM-dd");
    api.get(`/availability?date=${ds}`).then((r) => setSlots(r.data.slots)).catch(() => {});
  }, [date, showResched]);

  const cancel = async () => {
    setBusy(true);
    try { await api.post("/appointments/cancel", { cancel_token: token }); setState("cancelled"); toast.success("Appointment cancelled"); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); } finally { setBusy(false); }
  };

  const reschedule = async () => {
    if (!time) return toast.error("Pick a time");
    setBusy(true);
    try {
      await api.post("/appointments/reschedule", { cancel_token: token, date: format(date, "yyyy-MM-dd"), time });
      toast.success("Rescheduled!"); setShowResched(false); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); } finally { setBusy(false); }
  };

  const payDeposit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/appointments/${token}/deposit`, { origin_url: window.location.origin });
      window.location.href = data.url;
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); setBusy(false); }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="bg-white rounded-3xl border border-greyc p-10">
        {state === "loading" && <div className="text-center"><Loader2 className="mx-auto text-gold animate-spin" size={40} /></div>}
        {state === "notfound" && <div className="text-center"><CalendarX className="mx-auto text-destructive" size={48} /><h1 className="font-heading text-3xl font-medium text-ink mt-4">Appointment not found</h1><Link to="/book" className="inline-block mt-6 bg-gold text-white px-6 py-3 rounded-full font-semibold">Book an Appointment</Link></div>}
        {state === "cancelled" && <div className="text-center"><CheckCircle2 className="mx-auto text-gold" size={48} /><h1 className="font-heading text-3xl font-medium text-ink mt-4">Appointment cancelled</h1><p className="text-muted-foreground mt-2">We hope to see you again soon.</p><Link to="/book" className="inline-block mt-6 bg-gold text-white px-6 py-3 rounded-full font-semibold">Rebook</Link></div>}
        {state === "found" && appt && (
          <div>
            <h1 className="font-heading text-3xl font-medium text-ink text-center">Manage your appointment</h1>
            <div className="bg-cream rounded-2xl mt-6 p-5 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-semibold">{appt.service_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{appt.date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-semibold">{appt.time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deposit</span><span className={`font-semibold ${appt.deposit_paid ? "text-green-700" : "text-ink"}`}>{appt.deposit_paid ? "Paid ✓" : "Not paid"}</span></div>
            </div>

            {!appt.deposit_paid && (
              <button data-testid="pay-deposit" onClick={payDeposit} disabled={busy} className="w-full mt-4 bg-gold text-white py-3 rounded-full font-semibold hover:bg-goldLight transition-colors flex items-center justify-center gap-2 disabled:opacity-60"><CreditCard size={17} /> Pay $30 CAD Deposit</button>
            )}

            {!showResched ? (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button data-testid="show-reschedule" onClick={() => setShowResched(true)} className="bg-secondary text-ink py-3 rounded-full font-semibold flex items-center justify-center gap-2"><CalendarClock size={16} /> Reschedule</button>
                <button data-testid="confirm-cancel-btn" onClick={cancel} disabled={busy} className="bg-white border border-destructive/40 text-destructive py-3 rounded-full font-semibold hover:bg-destructive hover:text-white transition-colors disabled:opacity-60">Cancel</button>
              </div>
            ) : (
              <div className="mt-4 border-t border-greyc pt-4">
                <p className="font-semibold text-ink mb-3">Pick a new date & time</p>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-cream rounded-2xl p-2"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={{ before: new Date() }} /></div>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {slots.map((s) => (<button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)} className={`py-2 rounded-lg text-sm border ${time === s.time ? "bg-gold text-white border-gold" : s.available ? "bg-white border-greyc hover:border-gold" : "bg-secondary/60 text-muted-foreground line-through"}`}>{s.time}</button>))}
                  </div>
                  <div className="flex gap-3 w-full">
                    <button onClick={reschedule} disabled={busy} className="flex-1 bg-gold text-white py-3 rounded-full font-semibold disabled:opacity-60">Confirm</button>
                    <button onClick={() => setShowResched(false)} className="flex-1 bg-secondary text-ink py-3 rounded-full font-semibold">Back</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
