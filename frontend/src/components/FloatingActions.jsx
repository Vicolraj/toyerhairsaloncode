import React from "react";
import { MessageCircle, Phone, MapPin } from "lucide-react";
import { BUSINESS } from "@/lib/business";

export const FloatingActions = () => (
  <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
    <a href={BUSINESS.whatsapp} target="_blank" rel="noopener noreferrer" data-testid="fab-whatsapp" aria-label="WhatsApp"
      className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
      <MessageCircle size={22} />
    </a>
    <a href={`tel:${BUSINESS.phoneRaw}`} data-testid="fab-call" aria-label="Call"
      className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
      <Phone size={20} />
    </a>
    <a href={BUSINESS.maps} target="_blank" rel="noopener noreferrer" data-testid="fab-directions" aria-label="Directions"
      className="w-12 h-12 rounded-full bg-gold text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
      <MapPin size={20} />
    </a>
  </div>
);
