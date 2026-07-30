import React from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/lib/seo";

const FAQS = [
  ["Do I need to bring my own hair?", "For most braiding and extension styles you can bring your own hair, or purchase it from our in-store beauty supply. Let us know when booking and we'll advise on how much you'll need."],
  ["Is a deposit required to book?", "A deposit may be required to secure certain appointments. After booking online you'll have the option to pay a deposit, which is applied to your final total."],
  ["How do I prepare for my braiding appointment?", "Come with clean, blow-dried, detangled hair unless a wash is part of your service. This helps us give you the best, longest-lasting result."],
  ["Do you style children's hair?", "Yes! We love working with kids and offer gentle, age-appropriate braids, cornrows and protective styles. Ask about Kids Tuesdays for a discount."],
  ["Where are you located?", "We're based in Sarnia, Ontario, proudly serving Point Edward, Corunna, Petrolia, Chatham-Kent, London and all of Lambton County. Use the Directions button for the map."],
  ["What payment methods do you accept?", "Online we accept Visa, Mastercard, Amex, debit, Apple Pay and Google Pay via secure Stripe checkout, in Canadian dollars (CAD)."],
  ["Can I cancel or reschedule?", "Absolutely. Use the manage link in your confirmation email, or log into your account to reschedule or cancel your appointment."],
  ["Do you ship products?", "Yes, we ship across Ontario with free shipping on orders over $150 CAD. Local pickup in Sarnia is also available."],
];

export default function FAQ() {
  useSEO({ title: "FAQ", description: "Frequently asked questions about booking, deposits, products, payments and services at Toyer Hair Sarnia.", path: "/faq" });
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">Help Centre</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-medium text-ink">Frequently asked questions</h1>
      </div>
      <Accordion type="single" collapsible className="bg-white rounded-2xl border border-greyc px-5">
        {FAQS.map(([q, a], i) => (
          <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-${i}`}>
            <AccordionTrigger className="text-left font-semibold text-ink">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="text-center mt-10">
        <p className="text-muted-foreground">Still have questions?</p>
        <Link to="/contact" className="inline-block mt-3 bg-gold text-white px-7 py-3 rounded-full font-semibold hover:bg-goldLight transition-colors">Contact Us</Link>
      </div>
    </div>
  );
}
