import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { ChatWidget } from "@/components/ChatWidget";
import { ScrollProgress } from "@/components/Reveal";
import { useAutoReveal } from "@/lib/useAutoReveal";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Gallery from "@/pages/Gallery";
import Pricing from "@/pages/Pricing";
import SpecialOffers from "@/pages/SpecialOffers";
import Reviews from "@/pages/Reviews";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import Booking from "@/pages/Booking";
import Appointment from "@/pages/Appointment";
import Login from "@/pages/Login";
import Account from "@/pages/Account";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const BraidBackground = () => (
  <div aria-hidden="true" style={{
    position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", opacity: 0.06,
    backgroundImage: `url(${process.env.PUBLIC_URL}/braid-pattern.png)`,
    backgroundSize: "460px auto", backgroundRepeat: "repeat",
  }} />
);

const Layout = ({ children }) => {
  useAutoReveal();
  return (
    <>
      <BraidBackground />
      <ScrollProgress />
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <FloatingActions />
      <ChatWidget />
    </>
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/about" element={<Layout><About /></Layout>} />
              <Route path="/services" element={<Layout><Services /></Layout>} />
              <Route path="/shop" element={<Layout><Shop /></Layout>} />
              <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/checkout/success" element={<Layout><CheckoutSuccess /></Layout>} />
              <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
              <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
              <Route path="/offers" element={<Layout><SpecialOffers /></Layout>} />
              <Route path="/reviews" element={<Layout><Reviews /></Layout>} />
              <Route path="/faq" element={<Layout><FAQ /></Layout>} />
              <Route path="/contact" element={<Layout><Contact /></Layout>} />
              <Route path="/book" element={<Layout><Booking /></Layout>} />
              <Route path="/appointment/:token" element={<Layout><Appointment /></Layout>} />
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/account" element={<Layout><Account /></Layout>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
