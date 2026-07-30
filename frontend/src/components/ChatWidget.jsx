import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

const WELCOME = { role: "assistant", content: "Hi, I'm **Toya** 💇🏾‍♀️ your Toyer Hair concierge! I can help you [book an appointment](/book) or find the perfect product in [our shop](/shop). What are you looking for today?" };
const CHIPS = ["Book an appointment", "Find a wig", "Hair care products", "Store hours & location"];

function RichText({ text, onNav }) {
  const nodes = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0, m, key = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      const url = m[2];
      if (url.startsWith("/")) {
        nodes.push(<button key={key++} onClick={() => onNav(url)} className="text-gold font-semibold underline underline-offset-2 hover:text-goldLight">{m[1]}</button>);
      } else {
        nodes.push(<a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold underline">{m[1]}</a>);
      }
    } else if (m[3]) {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <span className="whitespace-pre-wrap">{nodes}</span>;
}

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const endRef = useRef(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open, loading]);

  const onNav = (url) => { setOpen(false); navigate(url); };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/chat", { messages: next.filter((m) => m.role !== "system").slice(-10) });
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I had trouble responding. Please [book online](/book) or call 519-330-8967." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button data-testid="chat-toggle" onClick={() => setOpen(!open)} aria-label="Chat with us"
        className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full bg-gold text-white shadow-lg flex items-center justify-center hover:bg-goldLight transition-colors">
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {open && (
        <div data-testid="chat-panel" className="fixed bottom-24 left-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white rounded-3xl shadow-2xl border border-greyc flex flex-col overflow-hidden">
          <div className="bg-ink text-white px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center"><Sparkles size={18} /></div>
            <div>
              <p className="font-heading font-semibold leading-none">Toya · Toyer Hair</p>
              <p className="text-[11px] text-white/60 mt-1">Booking & product help</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cream/40">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div data-testid={`chat-msg-${m.role}`} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-gold text-white rounded-br-sm" : "bg-white border border-greyc text-ink rounded-bl-sm"}`}>
                  <RichText text={m.content} onNav={onNav} />
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white border border-greyc rounded-2xl px-4 py-3 flex gap-1"><span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} /><span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} /></div></div>}
            <div ref={endRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <button key={c} data-testid={`chat-chip-${c.split(" ")[0].toLowerCase()}`} onClick={() => send(c)} className="text-xs bg-secondary text-ink/80 rounded-full px-3 py-1.5 hover:bg-gold hover:text-white transition-colors">{c}</button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-greyc flex items-center gap-2">
            <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about styles, prices, booking…" className="flex-1 border border-greyc rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            <button data-testid="chat-send" type="submit" disabled={loading} className="w-10 h-10 rounded-full bg-gold text-white flex items-center justify-center hover:bg-goldLight transition-colors disabled:opacity-50 shrink-0"><Send size={17} /></button>
          </form>
        </div>
      )}
    </>
  );
};
