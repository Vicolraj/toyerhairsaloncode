import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking");
  const [order, setOrder] = useState(null);
  const { clearCart } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    let attempts = 0;
    const poll = async () => {
      try {
        const { data } = await api.get(`/checkout/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setOrder(data); setStatus("paid");
          if (!cleared.current && data.type === "order") { clearCart(); cleared.current = true; }
          return;
        }
        if (data.status === "expired") { setStatus("error"); return; }
      } catch { /* retry */ }
      attempts += 1;
      if (attempts >= 6) { setStatus("timeout"); return; }
      setTimeout(poll, 2000);
    };
    poll();
  }, [sessionId]);

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <div className="bg-white rounded-3xl border border-greyc p-10 text-center">
        {status === "checking" && (<><Loader2 className="mx-auto text-gold animate-spin" size={44} /><h1 className="font-heading text-3xl font-medium text-ink mt-5">Confirming payment…</h1></>)}
        {status === "paid" && (
          <>
            <CheckCircle2 className="mx-auto text-green-600" size={52} />
            <h1 className="font-heading text-4xl font-medium text-ink mt-5">Thank you!</h1>
            <p className="text-muted-foreground mt-2">{order?.type === "deposit" ? "Your deposit is paid — your appointment is secured." : "Your order is confirmed. A receipt is on its way to your email."}</p>
            {order?.items?.length > 0 && (
              <div className="text-left bg-cream rounded-2xl mt-6 p-5 space-y-2">
                {order.items.map((it) => (
                  <div key={it.product_id} className="flex justify-between text-sm"><span className="text-muted-foreground">{it.name} × {it.quantity}</span><span className="text-ink font-medium">${(it.price * it.quantity).toFixed(2)}</span></div>
                ))}
                <div className="flex justify-between border-t border-greyc pt-3 mt-2"><span className="font-semibold">Paid</span><span className="font-heading text-xl font-semibold">${order.amount?.toFixed(2)} CAD</span></div>
              </div>
            )}
            <div className="flex gap-3 justify-center mt-7">
              <Link to="/shop" className="bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-goldLight transition-colors">Continue Shopping</Link>
              <Link to="/account" className="bg-secondary text-ink px-6 py-3 rounded-full font-semibold">My Account</Link>
            </div>
          </>
        )}
        {(status === "error" || status === "timeout") && (
          <>
            <XCircle className="mx-auto text-destructive" size={52} />
            <h1 className="font-heading text-3xl font-medium text-ink mt-5">{status === "timeout" ? "Still processing" : "Payment not confirmed"}</h1>
            <p className="text-muted-foreground mt-2">{status === "timeout" ? "Check your email for confirmation shortly." : "If you were charged, please contact us and we'll help right away."}</p>
            <Link to="/cart" className="inline-block mt-6 bg-secondary text-ink px-6 py-3 rounded-full font-semibold">Back to Cart</Link>
          </>
        )}
      </div>
    </div>
  );
}
