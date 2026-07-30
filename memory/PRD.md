# Toyer Hair – Afro-Caribbean Beauty & Wig Studio — PRD

## Business
Toyer Hair – Afro-Caribbean Beauty & Wig Studio · Sarnia, Ontario, Canada
Phone 519-330-8967 · Email Toyerhair@gmail.com · toyerhair.com
Socials: FB /ToyerrHairShop · IG @toyerr_hair · TikTok @toyerr_hair (placeholder)
Service area: Sarnia, Point Edward, Bright's Grove, Corunna, Petrolia, Wyoming, Forest, Wallaceburg, Chatham, Chatham-Kent, London, Lambton County.

## Stack & Choices
- React (light professional theme: cream/white, black text, gold accents; Fraunces + Plus Jakarta Sans; rounded buttons; minimal animation, mobile-first)
- FastAPI + MongoDB; JWT auth (customer + admin) via localStorage `toyer_token`
- Payments: Stripe in CAD (cards + Apple/Google Pay). PayPal/Square deferred.
- Email: Resend (built, INACTIVE until RESEND_API_KEY set — sends logged/skipped)
- Logo: text logo now; image swap pending user upload

## Implemented — Phase 1 (2026-07-07)
- Rebrand + full business info, socials, service area, SEO (per-page titles/meta, JSON-LD LocalBusiness, robots.txt, sitemap.xml)
- Nav with Services/Shop dropdowns; floating WhatsApp/Call/Directions
- Pages: Home, About, Services (24 services, 6 categories), Pricing, Shop (16 products, filters), Product Detail, Cart (+coupon), Checkout Success, Gallery (categorized + lightbox), Special Offers, Reviews (list + submit), FAQ, Contact (form + map + hours), Book, Appointment manage
- Booking: service/date/time (live availability), hair length, hair-included, inspiration link, notes; confirmation + manage link; reschedule, cancel, $30 CAD deposit via Stripe
- Customer accounts: register/login/logout, /account (appointments, orders, profile); product favourites API
- E-commerce: Stripe CAD checkout, order history, coupon codes (WELCOME15/KIDS10), shipping (free >$150)
- Owner dashboard: overview stats (bookings, revenue, daily/monthly sales, customers, products), appointments, orders, customers, products CRUD, reviews moderation, newsletter list
- Newsletter signup + contact form (emails business on new enquiry/booking when key active)
- Verified: backend 47/47 tests pass; all frontend flows pass (iteration_2)

## Credentials
- Admin: admin@toyerhair.com / ToyerAdmin2026

## Deferred — Phase 2 backlog
- P0: Add RESEND_API_KEY (activate booking/cancel/order emails + reminders); upload real logo/favicon
- P1: Gift cards; wishlist/favourites UI page; automated review request after appointment; inventory auto-decrement on paid orders; product edit UI; promotions/gallery admin CRUD; appointment reminders
- P2: Live Google/Facebook reviews API; TikTok feed embed; shipping-rate calculator; order tracking statuses; PayPal/Square; blog/SEO landing pages per service-area

## Next Tasks
- Provide Resend API key + logo image to complete branding & email activation
