import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, ChevronDown, Instagram, Facebook, Phone, Music2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { BUSINESS, NAV_SERVICES, NAV_SHOP } from "@/lib/business";

const Logo = () => {
  const [imgError, setImgError] = useState(false);
  return (
    <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 leading-none">
      {!imgError ? (
        <img
          src="/logo.png"
          alt="Toyer Hair Logo"
          className="h-10 w-auto object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex flex-col leading-none">
          <span className="font-heading text-2xl font-semibold tracking-tight text-ink">
            TOYER <span className="text-gold-gradient">HAIR</span>
          </span>
          <span className="text-[8px] uppercase tracking-[0.28em] mt-1 text-muted-foreground">
            Afro-Caribbean Beauty &amp; Wig Studio
          </span>
        </div>
      )}
    </Link>
  );
};

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <>
      <div className="hidden md:block bg-ink text-white/80 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-2">
          <span>📍 {BUSINESS.city} · Serving Sarnia & Lambton County</span>
          <div className="flex items-center gap-4">
            <a href={`tel:${BUSINESS.phoneRaw}`} className="hover:text-gold flex items-center gap-1"><Phone size={12} /> {BUSINESS.phone}</a>
            <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold"><Instagram size={14} /></a>
            <a href={BUSINESS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-gold"><Facebook size={14} /></a>
            <a href={BUSINESS.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-gold"><Music2 size={14} /></a>
          </div>
        </div>
      </div>

      <header data-testid="navbar" className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-cream/95 backdrop-blur shadow-sm" : "bg-cream"} border-b border-greyc`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[68px]">
          <Logo />

          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-ink/80 hover:text-gold transition-colors">Home</Link>
            <Link to="/about" className="text-sm font-medium text-ink/80 hover:text-gold transition-colors">About</Link>

            <div className="relative group">
              <button className="text-sm font-medium text-ink/80 hover:text-gold transition-colors flex items-center gap-1" data-testid="nav-services">Services <ChevronDown size={14} /></button>
              <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="bg-white rounded-xl shadow-lg border border-greyc p-2 w-48">
                  <Link to="/services" className="block px-3 py-2 rounded-lg text-sm hover:bg-secondary">All Services</Link>
                  {NAV_SERVICES.map((s) => (
                    <button key={s.label} onClick={() => navigate(s.to)} className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary">{s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="text-sm font-medium text-ink/80 hover:text-gold transition-colors flex items-center gap-1" data-testid="nav-shop">Shop <ChevronDown size={14} /></button>
              <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="bg-white rounded-xl shadow-lg border border-greyc p-2 w-48">
                  <Link to="/shop" className="block px-3 py-2 rounded-lg text-sm hover:bg-secondary">All Products</Link>
                  {NAV_SHOP.map((s) => (
                    <Link key={s.cat} to={`/shop?category=${encodeURIComponent(s.cat)}`} className="block px-3 py-2 rounded-lg text-sm hover:bg-secondary">{s.label}</Link>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/gallery" className="text-sm font-medium text-ink/80 hover:text-gold transition-colors">Gallery</Link>
            <Link to="/pricing" className="text-sm font-medium text-ink/80 hover:text-gold transition-colors">Pricing</Link>
            <Link to="/reviews" className="text-sm font-medium text-ink/80 hover:text-gold transition-colors">Reviews</Link>
            <Link to="/contact" className="text-sm font-medium text-ink/80 hover:text-gold transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to={user ? "/account" : "/login"} data-testid="nav-account" className="text-ink/70 hover:text-gold transition-colors p-1"><User size={21} /></Link>
            <Link to="/cart" data-testid="nav-cart" className="relative text-ink/70 hover:text-gold transition-colors p-1">
              <ShoppingBag size={21} />
              {count > 0 && <span data-testid="cart-count" className="absolute -top-1 -right-1 bg-gold text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{count}</span>}
            </Link>
            <Link to="/book" data-testid="nav-book" className="hidden sm:inline-flex bg-gold text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-goldLight transition-colors">Book Now</Link>
            <button className="lg:hidden text-ink p-1" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle">{open ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden bg-white border-t border-greyc px-6 py-4 max-h-[75vh] overflow-y-auto">
            {[{ label: "Home", to: "/" }, { label: "About", to: "/about" }, { label: "All Services", to: "/services" }, { label: "Shop", to: "/shop" }, { label: "Gallery", to: "/gallery" }, { label: "Pricing", to: "/pricing" }, { label: "Special Offers", to: "/offers" }, { label: "Reviews", to: "/reviews" }, { label: "FAQ", to: "/faq" }, { label: "Contact", to: "/contact" }, { label: user ? "My Account" : "Login", to: user ? "/account" : "/login" }].map((l) => (
              <Link key={l.label} to={l.to} className="block py-2.5 text-ink/80 font-medium border-b border-greyc/60">{l.label}</Link>
            ))}
            <Link to="/book" className="block mt-4 bg-gold text-white text-center px-5 py-3 rounded-full font-semibold">Book Appointment</Link>
          </div>
        )}
      </header>
    </>
  );
};
