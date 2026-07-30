import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Calendar, Package, Heart, User, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSEO } from "@/lib/seo";

export default function Account() {
  useSEO({ title: "My Account", description: "Manage your Toyer Hair appointments, orders and favourites." });
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("appointments");
  const [appts, setAppts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) navigate("/login");
  }, [ready, user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/my/appointments").then((r) => setAppts(r.data)).catch(() => {}),
      api.get("/my/orders").then((r) => setOrders(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (!ready || !user) return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin text-gold" size={36} /></div>;

  const tabs = [["appointments", "Appointments", Calendar], ["orders", "Orders", Package], ["profile", "Profile", User]];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-medium text-ink">Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>
        <button data-testid="account-logout" onClick={() => { logout(); navigate("/"); }} className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-destructive"><LogOut size={16} /> Logout</button>
      </div>

      <div className="flex gap-2 mb-8 border-b border-greyc">
        {tabs.map(([k, label, Icon]) => (
          <button key={k} data-testid={`account-tab-${k}`} onClick={() => setTab(k)} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-ink"}`}><Icon size={16} /> {label}</button>
        ))}
      </div>

      {loading ? <Loader2 className="animate-spin text-gold" /> : (
        <>
          {tab === "appointments" && (
            <div className="space-y-3">
              {appts.length === 0 ? <Empty text="No appointments yet." cta="Book now" to="/book" /> : appts.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-greyc p-5 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-ink">{a.service_name}</p>
                    <p className="text-sm text-muted-foreground">{a.date} at {a.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${a.status === "booked" ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>{a.status}</span>
                    {a.status === "booked" && <Link to={`/appointment/${a.cancel_token || ""}`} className="text-sm font-semibold text-gold">Manage</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? <Empty text="No orders yet." cta="Shop now" to="/shop" /> : orders.map((o) => (
                <div key={o.session_id} className="bg-white rounded-2xl border border-greyc p-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${o.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>{o.payment_status}</span>
                  </div>
                  <div className="mt-2 text-sm text-ink/80">{(o.items || []).map((i) => `${i.name} ×${i.quantity}`).join(", ")}</div>
                  <p className="font-heading text-lg font-semibold mt-2">${o.amount?.toFixed(2)} CAD</p>
                </div>
              ))}
            </div>
          )}
          {tab === "profile" && (
            <div className="bg-white rounded-2xl border border-greyc p-6 max-w-md space-y-3 text-sm">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={user.phone || "—"} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const Empty = ({ text, cta, to }) => (
  <div className="bg-white rounded-2xl border border-greyc p-12 text-center">
    <p className="text-muted-foreground">{text}</p>
    <Link to={to} className="inline-block mt-4 bg-gold text-white px-6 py-2.5 rounded-full font-semibold">{cta}</Link>
  </div>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-greyc pb-2"><span className="text-muted-foreground">{label}</span><span className="font-medium text-ink">{value}</span></div>
);
