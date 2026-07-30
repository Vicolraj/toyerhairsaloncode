import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, CalendarCheck2, CalendarX2, ShoppingBag, DollarSign, Users, Package, TrendingUp, TrendingDown, Wallet, Ban, CalendarClock, Loader2, Check, Trash2, Plus, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const todayStr = () => new Date().toISOString().slice(0, 10);
const TABS = ["Overview", "Schedule", "Appointments", "Orders", "Finance", "Products", "Customers", "Reviews", "Newsletter"];

export default function AdminDashboard() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [appts, setAppts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subs, setSubs] = useState([]);
  const [finance, setFinance] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [schedDate, setSchedDate] = useState(todayStr());
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "Inventory", date: todayStr() });
  const [loading, setLoading] = useState(true);
  const [newProd, setNewProd] = useState({ name: "", price: "", category: "Hair Care", stock: 0, image: "", description: "", badge: "" });
  const [apptFilter, setApptFilter] = useState("upcoming");
  const [apptSearch, setApptSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");

  useEffect(() => { if (ready && (!user || user.role !== "admin")) navigate("/admin/login"); }, [ready, user]);

  const loadAll = async () => {
    try {
      const [s, a, o, p, c, r, n, f, ex] = await Promise.all([
        api.get("/admin/stats"), api.get("/admin/appointments"), api.get("/admin/orders"),
        api.get("/products"), api.get("/admin/customers"), api.get("/admin/reviews"), api.get("/admin/newsletter"),
        api.get("/admin/finance"), api.get("/admin/expenses"),
      ]);
      setStats(s.data); setAppts(a.data); setOrders(o.data); setProducts(p.data);
      setCustomers(c.data); setReviews(r.data); setSubs(n.data); setFinance(f.data); setExpenses(ex.data);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) { logout(); navigate("/admin/login"); }
    } finally { setLoading(false); }
  };
  useEffect(() => { if (user?.role === "admin") loadAll(); }, [user]);

  const loadSchedule = async (d) => {
    try { const { data } = await api.get(`/admin/schedule?date=${d}`); setSchedule(data); } catch { /* ignore */ }
  };
  useEffect(() => { if (user?.role === "admin" && tab === "Schedule") loadSchedule(schedDate); }, [tab, schedDate, user]);

  const block = async (time) => { await api.post("/admin/block", { date: schedDate, time }); loadSchedule(schedDate); };
  const shiftDate = (n) => { const d = new Date(schedDate); d.setDate(d.getDate() + n); setSchedDate(d.toISOString().slice(0, 10)); };
  const unblock = async (time) => { await api.post("/admin/unblock", { date: schedDate, time }); loadSchedule(schedDate); };
  const cancelAppt = async (id) => { await api.post(`/admin/appointments/${id}/cancel`); toast.success("Appointment cancelled"); loadSchedule(schedDate); loadAll(); };
  const addExpense = async (e) => {
    e.preventDefault();
    try { await api.post("/admin/expenses", { ...newExpense, amount: parseFloat(newExpense.amount) }); toast.success("Expense recorded"); setNewExpense({ description: "", amount: "", category: "Inventory", date: todayStr() }); loadAll(); }
    catch { toast.error("Could not add expense"); }
  };
  const delExpense = async (id) => { await api.delete(`/admin/expenses/${id}`); toast.success("Deleted"); loadAll(); };

  const approve = async (id) => { await api.put(`/admin/reviews/${id}`); toast.success("Approved"); loadAll(); };
  const delReview = async (id) => { await api.delete(`/admin/reviews/${id}`); toast.success("Deleted"); loadAll(); };
  const delProduct = async (id) => { await api.delete(`/admin/products/${id}`); toast.success("Deleted"); loadAll(); };
  const addProduct = async (e) => {
    e.preventDefault();
    try { await api.post("/admin/products", { ...newProd, price: parseFloat(newProd.price), stock: parseInt(newProd.stock) || 0 }); toast.success("Product added"); setNewProd({ name: "", price: "", category: "Hair Care", stock: 0, image: "", description: "", badge: "" }); loadAll(); }
    catch { toast.error("Could not add product"); }
  };

  if (!ready || loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={40} /></div>;

  const isPast = (a) => new Date(`${a.date}T${a.time || "00:00"}`) < new Date();
  const filteredAppts = appts.filter((a) => {
    const q = apptSearch.trim().toLowerCase();
    const matchQ = !q || [a.customer_name, a.service_name, a.customer_phone, a.customer_email].some((v) => (v || "").toLowerCase().includes(q));
    if (!matchQ) return false;
    if (apptFilter === "all") return true;
    if (apptFilter === "cancelled") return a.status === "cancelled";
    if (apptFilter === "past") return a.status !== "cancelled" && isPast(a);
    return a.status !== "cancelled" && !isPast(a);
  }).sort((a, b) => {
    const da = new Date(`${a.date}T${a.time || "00:00"}`), db = new Date(`${b.date}T${b.time || "00:00"}`);
    return apptFilter === "upcoming" ? da - db : db - da;
  });
  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.trim().toLowerCase();
    const matchQ = !q || (o.customer_email || "").toLowerCase().includes(q) || (o.items || []).some((i) => (i.name || "").toLowerCase().includes(q));
    if (!matchQ) return false;
    if (orderFilter === "all") return true;
    return o.payment_status === orderFilter;
  });

  const cards = [
    [CalendarCheck2, "Booked", stats?.booked], [CalendarX2, "Cancelled", stats?.cancelled],
    [ShoppingBag, "Paid Orders", stats?.paid_orders], [DollarSign, "Revenue", `$${stats?.revenue}`],
    [TrendingUp, "Today", `$${stats?.daily_sales}`], [TrendingUp, "This Month", `$${stats?.monthly_sales}`],
    [Users, "Customers", stats?.customers], [Package, "Products", stats?.products],
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-greyc px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="font-heading text-xl font-semibold text-ink">TOYER <span className="text-gold-gradient">HAIR</span> <span className="text-xs text-muted-foreground ml-1">Admin</span></Link>
        <button data-testid="admin-logout" onClick={() => { logout(); navigate("/admin/login"); }} className="flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-destructive"><LogOut size={16} /> Logout</button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {TABS.map((t) => (
            <button key={t} data-testid={`admin-tab-${t.toLowerCase()}`} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${tab === t ? "bg-gold text-white" : "bg-white border border-greyc text-ink/70"}`}>{t}</button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map(([Icon, label, val]) => (
              <div key={label} data-testid={`stat-${label.toLowerCase().replace(/\s/g,'-')}`} className="bg-white rounded-2xl border border-greyc p-5">
                <Icon className="text-gold mb-3" size={22} />
                <div className="font-heading text-3xl font-semibold text-ink">{val ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "Appointments" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex gap-2">
                {[["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"], ["all", "All"]].map(([k, l]) => (
                  <button key={k} data-testid={`appt-filter-${k}`} onClick={() => setApptFilter(k)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${apptFilter === k ? "bg-ink text-white" : "bg-white border border-greyc text-ink/60 hover:text-ink"}`}>{l}</button>
                ))}
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input data-testid="appt-search" value={apptSearch} onChange={(e) => setApptSearch(e.target.value)} placeholder="Search client or service" className="pl-9 pr-3 py-2 text-sm border border-greyc rounded-full w-64 max-w-full" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{filteredAppts.length} appointment{filteredAppts.length !== 1 ? "s" : ""}</p>
            <Table head={["Date", "Time", "Service", "Client", "Phone", "Status", ""]} rows={filteredAppts.map((a) => [a.date, a.time, a.service_name, a.customer_name, a.customer_phone || "—", <StatusBadge status={a.status} />, a.status !== "cancelled" ? <button data-testid={`appt-cancel-${a.id}`} onClick={() => cancelAppt(a.id)} className="text-xs font-semibold text-destructive inline-flex items-center gap-1 hover:underline"><X size={13} /> Cancel</button> : null])} />
          </div>
        )}
        {tab === "Orders" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex gap-2">
                {[["all", "All"], ["paid", "Paid"], ["pending", "Pending"]].map(([k, l]) => (
                  <button key={k} data-testid={`order-filter-${k}`} onClick={() => setOrderFilter(k)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${orderFilter === k ? "bg-ink text-white" : "bg-white border border-greyc text-ink/60 hover:text-ink"}`}>{l}</button>
                ))}
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input data-testid="order-search" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search email or item" className="pl-9 pr-3 py-2 text-sm border border-greyc rounded-full w-64 max-w-full" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</p>
            <Table head={["Date", "Items", "Amount", "Email", "Status"]} rows={filteredOrders.map((o) => [new Date(o.created_at).toLocaleDateString(), (o.items || []).map((i) => `${i.name}×${i.quantity}`).join(", "), `$${o.amount}`, o.customer_email || "—", <StatusBadge status={o.payment_status} />])} />
          </div>
        )}
        {tab === "Customers" && <Table head={["Name", "Email", "Phone", "Joined"]} rows={customers.map((c) => [c.name, c.email, c.phone || "—", new Date(c.created_at).toLocaleDateString()])} />}
        {tab === "Newsletter" && <Table head={["Email", "Subscribed"]} rows={subs.map((s) => [s.email, new Date(s.created_at).toLocaleDateString()])} />}

        {tab === "Schedule" && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <CalendarClock size={20} className="text-gold" />
              <button data-testid="sched-prev" onClick={() => shiftDate(-1)} className="p-2 rounded-full border border-greyc hover:bg-white transition-colors"><ChevronLeft size={16} /></button>
              <input type="date" data-testid="schedule-date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} className="border border-greyc rounded-xl px-4 py-2 text-sm" />
              <button data-testid="sched-next" onClick={() => shiftDate(1)} className="p-2 rounded-full border border-greyc hover:bg-white transition-colors"><ChevronRight size={16} /></button>
              <button data-testid="sched-today" onClick={() => setSchedDate(todayStr())} className="px-4 py-2 rounded-full border border-greyc text-sm font-semibold hover:bg-white transition-colors">Today</button>
              {schedule?.slots && (
                <div className="flex gap-2 text-xs ml-auto">
                  <span className="px-2.5 py-1 rounded-full bg-gold/15 text-gold font-semibold">{schedule.slots.filter((s) => s.status === "booked").length} booked</span>
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-semibold">{schedule.slots.filter((s) => s.status === "open").length} open</span>
                  <span className="px-2.5 py-1 rounded-full bg-red-50 text-destructive font-semibold">{schedule.slots.filter((s) => s.status === "blocked").length} blocked</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-5">Block times off or cancel bookings for this day.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedule?.slots?.map((s) => (
                <div key={s.time} data-testid={`sched-slot-${s.time}`} className={`rounded-2xl border p-4 ${s.status === "booked" ? "border-gold/40 bg-gold/5" : s.status === "blocked" ? "border-destructive/30 bg-red-50" : "border-greyc bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{s.time}</span>
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${s.status === "booked" ? "bg-gold/20 text-gold" : s.status === "blocked" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}>{s.status}</span>
                  </div>
                  {s.status === "booked" && s.appointment && (
                    <div className="mt-2 text-sm">
                      <p className="text-ink font-medium">{s.appointment.service_name}</p>
                      <p className="text-muted-foreground text-xs">{s.appointment.customer_name} · {s.appointment.customer_phone || "no phone"}</p>
                      <button onClick={() => cancelAppt(s.appointment.id)} className="mt-2 text-xs font-semibold text-destructive inline-flex items-center gap-1"><X size={13} /> Cancel booking</button>
                    </div>
                  )}
                  {s.status === "open" && <button data-testid={`block-${s.time}`} onClick={() => block(s.time)} className="mt-2 text-xs font-semibold text-ink/70 inline-flex items-center gap-1 hover:text-destructive"><Ban size={13} /> Block time</button>}
                  {s.status === "blocked" && <button data-testid={`unblock-${s.time}`} onClick={() => unblock(s.time)} className="mt-2 text-xs font-semibold text-green-700 inline-flex items-center gap-1"><Check size={13} /> Make available</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Finance" && finance && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[[Wallet, "Total Income", `$${finance.income_total}`], [ShoppingBag, "Product Sales", `$${finance.sales_total}`], [TrendingDown, "Expenses", `$${finance.expenses_total}`], [TrendingUp, "Net Profit", `$${finance.net_profit}`]].map(([Icon, label, val]) => (
                <div key={label} data-testid={`finance-${label.toLowerCase().replace(/\s/g,'-')}`} className="bg-white rounded-2xl border border-greyc p-5">
                  <Icon className="text-gold mb-3" size={22} />
                  <div className={`font-heading text-2xl font-semibold ${label === "Net Profit" ? (finance.net_profit >= 0 ? "text-green-700" : "text-destructive") : "text-ink"}`}>{val}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label} <span className="uppercase">CAD</span></div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <form onSubmit={addExpense} className="bg-white rounded-2xl border border-greyc p-5 space-y-3 h-fit">
                <h3 className="font-semibold text-ink flex items-center gap-2"><Plus size={16} /> Record Spending</h3>
                <input required placeholder="Description (e.g. Braiding hair stock)" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" data-testid="expense-desc" />
                <input required type="number" step="0.01" placeholder="Amount (CAD)" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" data-testid="expense-amount" />
                <input placeholder="Category" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
                <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
                <button data-testid="expense-submit" className="w-full bg-gold text-white py-2.5 rounded-full font-semibold">Add Expense</button>
              </form>

              <div className="lg:col-span-2 space-y-5">
                <div>
                  <h3 className="font-semibold text-ink mb-3">Monthly breakdown</h3>
                  <Table head={["Month", "Income", "Expenses", "Net"]} rows={(finance.by_month || []).map((m) => [m.month, `$${m.income}`, `$${m.expenses}`, `$${m.net}`])} />
                </div>
                <div>
                  <h3 className="font-semibold text-ink mb-3">Recent expenses</h3>
                  <div className="space-y-2">
                    {expenses.length === 0 ? <p className="text-sm text-muted-foreground">No expenses recorded yet.</p> : expenses.map((e) => (
                      <div key={e.id} className="bg-white rounded-xl border border-greyc p-3 flex items-center justify-between">
                        <div><p className="text-sm font-medium text-ink">{e.description}</p><p className="text-xs text-muted-foreground">{e.category} · {e.date}</p></div>
                        <div className="flex items-center gap-3"><span className="font-semibold text-ink">${e.amount}</span><button onClick={() => delExpense(e.id)} className="text-destructive"><Trash2 size={15} /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {tab === "Reviews" && (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-greyc p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{r.name} · {"★".repeat(r.rating)} <span className="text-xs text-muted-foreground">({r.source})</span></p>
                  <p className="text-sm text-ink/80 mt-1">"{r.text}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!r.approved && <button onClick={() => approve(r.id)} className="bg-green-100 text-green-700 rounded-full p-2" title="Approve"><Check size={16} /></button>}
                  {r.approved && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Live</span>}
                  <button onClick={() => delReview(r.id)} className="bg-red-50 text-destructive rounded-full p-2"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Products" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <form onSubmit={addProduct} className="bg-white rounded-2xl border border-greyc p-5 space-y-3 h-fit">
              <h3 className="font-semibold text-ink flex items-center gap-2"><Plus size={16} /> Add Product</h3>
              <input required placeholder="Name" value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
              <input required placeholder="Price (CAD)" type="number" step="0.01" value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Category" value={newProd.category} onChange={(e) => setNewProd({ ...newProd, category: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Stock" type="number" value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Image URL" value={newProd.image} onChange={(e) => setNewProd({ ...newProd, image: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
              <textarea placeholder="Description" value={newProd.description} onChange={(e) => setNewProd({ ...newProd, description: e.target.value })} className="w-full border border-greyc rounded-xl px-3 py-2 text-sm" />
              <button className="w-full bg-gold text-white py-2.5 rounded-full font-semibold">Add Product</button>
            </form>
            <div className="lg:col-span-2 space-y-3">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-greyc p-4 flex items-center gap-4">
                  <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1"><p className="font-semibold text-ink text-sm">{p.name}</p><p className="text-xs text-muted-foreground">{p.category} · ${p.price} · stock {p.stock}</p></div>
                  <button onClick={() => delProduct(p.id)} className="bg-red-50 text-destructive rounded-full p-2"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  booked: "bg-green-100 text-green-700", confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700", cancelled: "bg-red-100 text-red-600",
  refunded: "bg-gray-100 text-gray-600",
};
const StatusBadge = ({ status }) => (
  <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] || "bg-secondary text-muted-foreground"}`}>{status || "—"}</span>
);

const Table = ({ head, rows }) => (
  <div className="bg-white rounded-2xl border border-greyc overflow-x-auto">
    <table className="w-full text-sm">
      <thead><tr className="text-left text-muted-foreground border-b border-greyc">{head.map((h) => <th key={h} className="p-4 font-semibold text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0 ? <tr><td colSpan={head.length} className="p-8 text-center text-muted-foreground">No records.</td></tr> :
          rows.map((r, i) => <tr key={i} className="border-b border-greyc/60 last:border-0 hover:bg-cream/50">{r.map((c, j) => <td key={j} className="p-4 text-ink/80">{c}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);
