from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Header, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import uuid
import jwt
import bcrypt
import resend
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

import cloudinary
import cloudinary.uploader

from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ['JWT_SECRET']
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
BUSINESS_EMAIL = os.environ.get('BUSINESS_EMAIL', 'Toyerhair@gmail.com')
GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY', '')
GOOGLE_PLACE_ID = os.environ.get('GOOGLE_PLACE_ID', '')
GOOGLE_PLACE_QUERY = os.environ.get('GOOGLE_PLACE_QUERY', 'Toyer Hair Afro-Caribbean Beauty and wig Studio Sarnia Ontario')
GOOGLE_MAPS_URL = os.environ.get('GOOGLE_MAPS_URL', 'https://www.google.com/search?q=toyer+hair+sarnia')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
CURRENCY = "cad"
DEPOSIT_AMOUNT = 30.0
resend.api_key = RESEND_API_KEY

# Cloudinary configuration
if os.environ.get('CLOUDINARY_CLOUD_NAME') and "PLACEHOLDER" not in os.environ.get('CLOUDINARY_CLOUD_NAME'):
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET')
    )

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BUSINESS_HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]


# ---------------- Helpers ----------------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(days=14), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def _user_from_token(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    except Exception:
        return None

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    user = await _user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def get_current_admin(authorization: Optional[str] = Header(None)) -> dict:
    user = await _user_from_token(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_optional_user(authorization: Optional[str] = Header(None)):
    return await _user_from_token(authorization)


# ---------------- Email ----------------
async def send_email(to_email: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.info(f"[EMAIL SKIPPED - no RESEND_API_KEY] to={to_email} subject={subject}")
        return
    try:
        await asyncio.to_thread(resend.Emails.send,
            {"from": SENDER_EMAIL, "to": [to_email], "subject": subject, "html": html})
    except Exception as e:
        logger.error(f"Email failed: {e}")

def email_shell(title, body):
    return f"""<div style="font-family:Arial,sans-serif;background:#FBF8F3;padding:32px;color:#1a1a1a;">
    <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #eee;border-radius:16px;overflow:hidden;">
      <div style="background:#111;padding:24px 32px;"><span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">TOYER <span style="color:#C79A63;">HAIR</span></span>
      <div style="color:#C79A63;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Afro-Caribbean Beauty & Wig Studio</div></div>
      <div style="padding:32px;"><h1 style="font-size:22px;margin:0 0 16px;">{title}</h1>{body}
      <p style="color:#888;font-size:12px;margin-top:32px;">Toyer Hair · Sarnia, ON · 519-330-8967</p></div></div></div>"""


# ---------------- Models ----------------
class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = ""

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class AppointmentCreate(BaseModel):
    service_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = ""
    date: str
    time: str
    hair_length: Optional[str] = ""
    hair_included: Optional[bool] = False
    inspiration_url: Optional[str] = ""
    notes: Optional[str] = ""

class CancelReq(BaseModel):
    cancel_token: str

class RescheduleReq(BaseModel):
    cancel_token: str
    date: str
    time: str

class CheckoutItem(BaseModel):
    product_id: str
    quantity: int = 1

class CheckoutReq(BaseModel):
    items: List[CheckoutItem]
    origin_url: str
    customer_email: Optional[str] = ""
    coupon: Optional[str] = ""

class ReviewCreate(BaseModel):
    name: str
    rating: int = 5
    text: str
    service: Optional[str] = ""

class NewsletterReq(BaseModel):
    email: EmailStr

class ContactReq(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    message: str

class ProductIn(BaseModel):
    name: str
    description: str = ""
    price: float
    category: str
    stock: int = 0
    image: str = ""
    images: List[str] = []
    badge: Optional[str] = ""

class FavoriteReq(BaseModel):
    kind: str  # product | style
    ref: str

class ExpenseIn(BaseModel):
    description: str
    amount: float
    category: str = "General"
    date: Optional[str] = ""

class BlockReq(BaseModel):
    date: str
    time: str

# =============== SEED DATA ===============
IMG = {
    "salon": "https://images.pexels.com/photos/36441633/pexels-photo-36441633.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "salon2": "https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "box": "https://images.unsplash.com/photo-1592520113018-180c8bc831c9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "knotless": "https://images.unsplash.com/photo-1629145810320-aec9e63dd798?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "cornrows": "https://images.unsplash.com/photo-1770182023775-4706ce1bed72?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "afro": "https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "twist": "https://images.unsplash.com/photo-1658497730270-b5f4fef00ae1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "locs": "https://images.pexels.com/photos/37010087/pexels-photo-37010087.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "locs2": "https://images.pexels.com/photos/17669816/pexels-photo-17669816.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "kids": "https://images.pexels.com/photos/4671331/pexels-photo-4671331.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "kids2": "https://images.pexels.com/photos/14421111/pexels-photo-14421111.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "ext": "https://images.pexels.com/photos/7295013/pexels-photo-7295013.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "wig1": "https://images.unsplash.com/photo-1615453261246-4b32e335a4a0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "wig2": "https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "wig3": "https://images.unsplash.com/photo-1628682814595-a3f0816b25ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "shampoo": "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "oil": "https://images.unsplash.com/photo-1631390179406-0bfe17e9f89d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "butter": "https://images.unsplash.com/photo-1722872065547-515a2e6ec7bb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "edge": "https://images.unsplash.com/photo-1701992679010-7cf5dfee49d5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "bonnet": "https://images.unsplash.com/photo-1658497714148-eb009d3ea195?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
}

def svc(id, cat, name, desc, price, dur, img, pop=False):
    return {"id": id, "category": cat, "name": name, "description": desc, "price": price,
            "duration_minutes": dur, "image": img, "popular": pop}

SERVICES_SEED = [
    svc("box-braids", "Braiding", "Box Braids", "Classic three-strand box braids in your chosen length and size.", 160, 240, IMG["box"], True),
    svc("knotless-braids", "Braiding", "Knotless Braids", "Lightweight, natural-looking knotless braids that are gentle on your edges.", 190, 270, IMG["knotless"], True),
    svc("boho-braids", "Braiding", "Boho Braids", "Knotless braids with wavy human-hair curls for a soft bohemian look.", 220, 300, IMG["ext"]),
    svc("french-curl-braids", "Braiding", "French Curl Braids", "Trendy braids finished with bouncy French curl ends.", 210, 300, IMG["cornrows"]),
    svc("cornrows", "Braiding", "Cornrows / Feed-in", "Neat cornrows or feed-in braids styled to your design.", 90, 150, IMG["cornrows"], True),
    svc("stitch-braids", "Braiding", "Stitch Braids", "Crisp, defined stitch cornrows with clean parting.", 110, 180, IMG["cornrows"]),
    svc("ghana-braids", "Braiding", "Ghana Braids", "Feed-in Ghana braids for a sleek, long-lasting protective style.", 130, 210, IMG["box"]),
    svc("crochet-braids", "Braiding", "Crochet Braids", "Fast, versatile crochet install with your choice of hair.", 100, 120, IMG["afro"]),
    svc("twists", "Twists", "Twists", "Two-strand twists / Senegalese / passion twists.", 150, 240, IMG["twist"], True),
    svc("consultation", "Natural Hair", "Hair Consultation", "One-on-one consultation to plan your hair care journey.", 30, 30, IMG["afro"]),
    svc("deep-conditioning", "Natural Hair", "Deep Conditioning", "Intensive moisture treatment to restore soft, healthy hair.", 45, 45, IMG["shampoo"]),
    svc("wash-go", "Natural Hair", "Wash & Go", "Cleanse, condition and define your natural curls.", 55, 60, IMG["afro"]),
    svc("twist-out", "Natural Hair", "Twist Out / Bantu Knots", "Defined twist-out or bantu knot-out styling.", 65, 90, IMG["twist"]),
    svc("protective-styling", "Natural Hair", "Protective Styling", "Custom protective style to retain length and moisture.", 80, 120, IMG["knotless"]),
    svc("starter-locs", "Locs", "Starter Locs", "Begin your loc journey with neatly sectioned starter locs.", 120, 180, IMG["locs"], True),
    svc("retwist", "Locs", "Loc Retwist & Style", "Root retwist, scalp care and a fresh style.", 85, 120, IMG["locs2"]),
    svc("interlocking", "Locs", "Interlocking", "Low-manipulation interlocking maintenance.", 95, 150, IMG["locs"]),
    svc("loc-repair", "Locs", "Loc Repair / Maintenance", "Repair thinning or broken locs and general upkeep.", 110, 150, IMG["locs2"]),
    svc("wig-install", "Wigs", "Wig Installation", "Seamless lace wig install, customized and styled.", 120, 120, IMG["wig1"], True),
    svc("custom-wig", "Wigs", "Custom Wig Order", "Made-to-measure custom wig built for your head and style.", 300, 180, IMG["wig2"]),
    svc("wig-revamp", "Wigs", "Wig Revamp / Maintenance", "Refresh, wash and restyle your existing wig.", 70, 90, IMG["wig3"]),
    svc("kids-braids", "Kids Hair", "Kids Braids / Cornrows", "Gentle, age-appropriate braids and cornrows for children.", 60, 120, IMG["kids"], True),
    svc("kids-protective", "Kids Hair", "Kids Protective Style", "Beads and protective styles for little ones.", 55, 90, IMG["kids2"]),
    svc("occasion", "Kids Hair", "Special Occasion Style", "Beautiful styles for birthdays, recitals and events.", 70, 90, IMG["kids"]),
]

def prod(id, cat, name, desc, price, stock, img, badge=""):
    return {"id": id, "category": cat, "name": name, "description": desc, "price": price,
            "stock": stock, "image": img, "badge": badge}

PRODUCTS_SEED = []

GALLERY_SEED = []

REVIEWS_SEED = [
    {"name": "Amara O.", "rating": 5, "service": "Knotless Braids", "text": "My knotless braids lasted 8 weeks and looked flawless. Best salon in Sarnia!", "source": "Google"},
    {"name": "Zainab K.", "rating": 5, "service": "Wig Installation", "text": "The custom wig install is unmatched — so natural nobody believes it's a wig.", "source": "Facebook"},
    {"name": "Ngozi A.", "rating": 5, "service": "Loc Retwist", "text": "Booking was effortless and my locs have never looked healthier. Highly recommend.", "source": "Google"},
    {"name": "Chantal D.", "rating": 5, "service": "Kids Braids", "text": "So patient and gentle with my daughter's hair. She loves her beads!", "source": "Google"},
]

PROMOS_SEED = [
    {"id": "new-client", "title": "15% Off Your First Visit", "description": "New clients save 15% on any braiding or natural hair service.", "code": "WELCOME15", "badge": "New Clients"},
    {"id": "bundle", "title": "Free Edge Control", "description": "Get a free edge control with any wig purchase over $200.", "code": "WIGLOVE", "badge": "Shop"},
    {"id": "kids", "title": "Kids Tuesdays", "description": "$10 off kids styles every Tuesday. Beads included!", "code": "KIDS10", "badge": "Weekly"},
]

COUPONS = {"WELCOME15": 0.15, "KIDS10": 0.0}


# ---------------- Public routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Toyer Hair API"}

@api_router.get("/services")
async def get_services():
    return await db.services.find({}, {"_id": 0}).to_list(200)

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    q = {} if not category or category == "All" else {"category": category}
    return await db.products.find(q, {"_id": 0}).to_list(200)

@api_router.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    related = await db.products.find({"category": p["category"], "id": {"$ne": pid}}, {"_id": 0}).to_list(4)
    return {"product": p, "related": related}

@api_router.get("/gallery")
async def get_gallery():
    return await db.gallery.find({}, {"_id": 0}).to_list(300)

@api_router.get("/reviews")
async def get_reviews():
    return await db.reviews.find({"approved": True}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/reviews")
async def create_review(r: ReviewCreate):
    doc = {"id": str(uuid.uuid4()), "name": r.name, "rating": max(1, min(5, r.rating)),
           "text": r.text, "service": r.service, "source": "Website", "approved": False,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.reviews.insert_one(doc)
    return {"message": "Thank you! Your review will appear after approval."}

@api_router.get("/promotions")
async def get_promotions():
    return await db.promotions.find({}, {"_id": 0}).to_list(50)


async def _resolve_place_id() -> str:
    global GOOGLE_PLACE_ID
    if GOOGLE_PLACE_ID:
        return GOOGLE_PLACE_ID
    cached = await db.google_reviews_cache.find_one({"key": "place_id"})
    if cached and cached.get("place_id"):
        GOOGLE_PLACE_ID = cached["place_id"]
        return GOOGLE_PLACE_ID
    async with httpx.AsyncClient(timeout=15) as hc:
        resp = await hc.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={"X-Goog-Api-Key": GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": "places.id,places.displayName", "Content-Type": "application/json"},
            json={"textQuery": GOOGLE_PLACE_QUERY},
        )
    resp.raise_for_status()
    places = resp.json().get("places", [])
    if not places:
        raise HTTPException(404, "Business not found on Google")
    pid = places[0]["id"]
    await db.google_reviews_cache.update_one({"key": "place_id"}, {"$set": {"key": "place_id", "place_id": pid}}, upsert=True)
    GOOGLE_PLACE_ID = pid
    return pid


@api_router.get("/google-reviews")
async def google_reviews():
    if not GOOGLE_PLACES_API_KEY:
        return {"source": "none", "rating": None, "total": None, "reviews": [], "maps_url": GOOGLE_MAPS_URL}
    cached = await db.google_reviews_cache.find_one({"key": "reviews"})
    if cached and (datetime.now(timezone.utc) - datetime.fromisoformat(cached["updated_at"]) < timedelta(hours=24)):
        return cached["data"]
    try:
        pid = await _resolve_place_id()
        async with httpx.AsyncClient(timeout=15) as hc:
            resp = await hc.get(
                f"https://places.googleapis.com/v1/places/{pid}",
                headers={"X-Goog-Api-Key": GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews"},
            )
        resp.raise_for_status()
        d = resp.json()
        reviews = []
        for r in d.get("reviews", []):
            reviews.append({
                "author": r.get("authorAttribution", {}).get("displayName", "Google User"),
                "photo": r.get("authorAttribution", {}).get("photoUri", ""),
                "rating": r.get("rating", 5),
                "text": (r.get("originalText") or r.get("text") or {}).get("text", ""),
                "relative_time": r.get("relativePublishTimeDescription", ""),
            })
        data = {"source": "google", "rating": d.get("rating"), "total": d.get("userRatingCount"),
                "reviews": reviews, "maps_url": d.get("googleMapsUri", GOOGLE_MAPS_URL)}
        await db.google_reviews_cache.update_one({"key": "reviews"},
            {"$set": {"key": "reviews", "data": data, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google reviews error: {e}")
        if cached:
            return cached["data"]
        return {"source": "error", "rating": None, "total": None, "reviews": [], "maps_url": GOOGLE_MAPS_URL}

@api_router.post("/newsletter")
async def newsletter(n: NewsletterReq):
    await db.newsletter.update_one({"email": n.email.lower()},
        {"$setOnInsert": {"email": n.email.lower(), "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"message": "Subscribed! Watch your inbox for offers."}

@api_router.post("/contact")
async def contact(c: ContactReq):
    doc = {"id": str(uuid.uuid4()), **c.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.contact_messages.insert_one(doc)
    asyncio.create_task(send_email(BUSINESS_EMAIL, f"New enquiry from {c.name}",
        email_shell("New Contact Message", f"<p><b>{c.name}</b> ({c.email}, {c.phone})</p><p>{c.message}</p>")))
    return {"message": "Thanks! We'll get back to you shortly."}


class ChatReq(BaseModel):
    messages: List[dict] = []

@api_router.post("/chat")
async def chat(req: ChatReq):
    if not EMERGENT_LLM_KEY:
        return {"reply": "Our chat assistant is not configured yet. Please call us at 519-330-8967 or [book online](/book)."}
    if not req.messages:
        raise HTTPException(400, "No message provided")
    services = await db.services.find({}, {"_id": 0, "id": 1, "name": 1, "category": 1, "price": 1}).to_list(200)
    products = await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "category": 1, "price": 1, "stock": 1}).to_list(200)
    svc_lines = "\n".join([f"- {s['name']} ({s['category']}) from ${s['price']} CAD — book: /book?service={s['id']}" for s in services])
    prod_lines = "\n".join([f"- {p['name']} ({p['category']}) ${p['price']} CAD{' — OUT OF STOCK' if p.get('stock',0)<=0 else ''} — view: /product/{p['id']}" for p in products])
    system = (
        "You are Toya, the friendly virtual concierge for Toyer Hair – Afro-Caribbean Beauty & Wig Studio in Sarnia, Ontario, Canada. "
        "Your goal is to make it effortless for customers to (1) book an appointment and (2) find the right products. "
        "Be warm, concise (2-4 sentences), and encouraging. Prices are in CAD and are starting points.\n\n"
        "ALWAYS guide the customer to take action by including relevant markdown links from the lists below, e.g. [Book Knotless Braids](/book?service=knotless-braids) or [View Signature Afro Wig](/product/afro-wig). "
        "To book, tell them to pick a date & time on the booking page; a small deposit secures the slot. "
        "Use [our booking page](/book) and [the shop](/shop) when appropriate. Never invent services, products, prices, or links that are not in the lists.\n\n"
        f"Business info: Phone 519-330-8967, Email Toyerhair@gmail.com, located in Sarnia ON. Hours: Mon–Wed 9–6, Thu–Fri 9–7, Sat 9–6, Sun closed. Serving Sarnia, Point Edward, Corunna, Petrolia, Chatham-Kent, London & Lambton County.\n\n"
        f"SERVICES:\n{svc_lines}\n\nPRODUCTS:\n{prod_lines}\n\n"
        "If asked something unrelated to the salon, politely steer back to booking or shopping."
    )
    history = req.messages[-9:]
    latest = history[-1].get("content", "")
    prior = history[:-1]
    transcript = "\n".join([f"{'Customer' if m.get('role')=='user' else 'Toya'}: {m.get('content','')}" for m in prior])
    text = latest if not transcript else f"Conversation so far:\n{transcript}\n\nCustomer: {latest}"
    try:
        chat_client = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=system).with_model("openai", "gpt-5.4-mini")
        reply = await chat_client.send_message(UserMessage(text=text))
        return {"reply": reply}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {"reply": "Sorry, I had trouble responding just now. You can [book online](/book), browse [the shop](/shop), or call us at 519-330-8967."}


# ---------------- Auth ----------------
@api_router.post("/auth/register")
async def register(r: RegisterReq):
    email = r.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "An account with this email already exists")
    user = {"id": str(uuid.uuid4()), "name": r.name, "email": email, "phone": r.phone,
            "password_hash": hash_password(r.password), "role": "customer",
            "favorites": [], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(user)
    token = create_token(user["id"], email, "customer")
    return {"token": token, "user": {"id": user["id"], "name": r.name, "email": email, "phone": r.phone, "role": "customer"}}

@api_router.post("/auth/login")
async def login(r: LoginReq):
    user = await db.users.find_one({"email": r.email.lower()})
    if not user or not verify_password(r.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user["id"], user["email"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"],
            "phone": user.get("phone", ""), "role": user["role"]}}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------- Appointments ----------------
@api_router.get("/availability")
async def availability(date: str):
    booked = await db.appointments.find({"date": date, "status": "booked"}, {"_id": 0, "time": 1}).to_list(100)
    blocked = await db.blocked_slots.find({"date": date}, {"_id": 0, "time": 1}).to_list(100)
    taken = [b["time"] for b in booked] + [b["time"] for b in blocked]
    return {"date": date, "slots": [{"time": t, "available": t not in taken} for t in BUSINESS_HOURS]}

@api_router.post("/appointments")
async def create_appointment(p: AppointmentCreate, user=Depends(get_optional_user)):
    service = await db.services.find_one({"id": p.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(404, "Service not found")
    if p.time not in BUSINESS_HOURS:
        raise HTTPException(400, "Invalid time")
    if await db.appointments.find_one({"date": p.date, "time": p.time, "status": "booked"}):
        raise HTTPException(409, "That time is already booked. Please choose another.")
    if await db.blocked_slots.find_one({"date": p.date, "time": p.time}):
        raise HTTPException(409, "That time is unavailable. Please choose another.")
    token = str(uuid.uuid4())
    appt = {"id": str(uuid.uuid4()), "service_id": p.service_id, "service_name": service["name"],
            "price": service["price"], "customer_name": p.customer_name, "customer_email": p.customer_email.lower(),
            "customer_phone": p.customer_phone, "date": p.date, "time": p.time, "hair_length": p.hair_length,
            "hair_included": p.hair_included, "inspiration_url": p.inspiration_url, "notes": p.notes,
            "status": "booked", "deposit_paid": False, "cancel_token": token,
            "user_id": user["id"] if user else None, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.appointments.insert_one(appt)
    origin = os.environ.get('PUBLIC_ORIGIN', '')
    link = f"{origin}/appointment/{token}"
    body = f"""<p>Hi {p.customer_name}, your appointment is confirmed.</p>
    <table style="margin:16px 0;"><tr><td style="color:#C79A63;padding:4px 16px 4px 0;">Service</td><td>{service['name']}</td></tr>
    <tr><td style="color:#C79A63;padding:4px 16px 4px 0;">Date</td><td>{p.date}</td></tr>
    <tr><td style="color:#C79A63;padding:4px 16px 4px 0;">Time</td><td>{p.time}</td></tr></table>
    <p>Manage or cancel: <a href="{link}" style="color:#C79A63;">{link}</a></p>"""
    asyncio.create_task(send_email(p.customer_email, "Your Toyer Hair Appointment is Confirmed", email_shell("Appointment Confirmed", body)))
    asyncio.create_task(send_email(BUSINESS_EMAIL, f"New booking: {service['name']} — {p.date} {p.time}",
        email_shell("New Booking", f"<p>{p.customer_name} ({p.customer_email}, {p.customer_phone})</p><p>{service['name']} on {p.date} at {p.time}</p><p>Hair length: {p.hair_length or '—'} · Hair included: {'Yes' if p.hair_included else 'No'}</p><p>Notes: {p.notes or '—'}</p>")))
    return {"id": appt["id"], "cancel_token": token, "message": "Appointment booked"}

@api_router.get("/appointments/by-token/{token}")
async def appt_by_token(token: str):
    a = await db.appointments.find_one({"cancel_token": token}, {"_id": 0, "customer_email": 0})
    if not a:
        raise HTTPException(404, "Appointment not found")
    return a

@api_router.post("/appointments/cancel")
async def cancel_appt(r: CancelReq):
    a = await db.appointments.find_one({"cancel_token": r.cancel_token})
    if not a:
        raise HTTPException(404, "Appointment not found")
    if a["status"] != "cancelled":
        await db.appointments.update_one({"cancel_token": r.cancel_token}, {"$set": {"status": "cancelled"}})
        asyncio.create_task(send_email(a["customer_email"], "Your Toyer Hair Appointment was Cancelled",
            email_shell("Appointment Cancelled", f"<p>Hi {a['customer_name']}, your appointment for {a['service_name']} on {a['date']} at {a['time']} has been cancelled.</p>")))
    return {"message": "Appointment cancelled"}

@api_router.post("/appointments/reschedule")
async def reschedule(r: RescheduleReq):
    a = await db.appointments.find_one({"cancel_token": r.cancel_token})
    if not a:
        raise HTTPException(404, "Appointment not found")
    if r.time not in BUSINESS_HOURS:
        raise HTTPException(400, "Invalid time")
    if await db.appointments.find_one({"date": r.date, "time": r.time, "status": "booked", "cancel_token": {"$ne": r.cancel_token}}):
        raise HTTPException(409, "That time is already booked.")
    await db.appointments.update_one({"cancel_token": r.cancel_token}, {"$set": {"date": r.date, "time": r.time, "status": "booked"}})
    asyncio.create_task(send_email(a["customer_email"], "Your Toyer Hair Appointment was Rescheduled",
        email_shell("Appointment Rescheduled", f"<p>Your appointment is now on {r.date} at {r.time}.</p>")))
    return {"message": "Rescheduled"}

@api_router.get("/my/appointments")
async def my_appointments(user: dict = Depends(get_current_user)):
    return await db.appointments.find({"$or": [{"user_id": user["id"]}, {"customer_email": user["email"]}]},
                                      {"_id": 0}).sort("date", -1).to_list(200)


# ---------------- Favorites ----------------
@api_router.get("/my/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0, "favorites": 1})
    return u.get("favorites", []) if u else []

@api_router.post("/my/favorites")
async def add_favorite(f: FavoriteReq, user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$addToSet": {"favorites": {"kind": f.kind, "ref": f.ref}}})
    return {"message": "Saved"}

@api_router.delete("/my/favorites")
async def remove_favorite(f: FavoriteReq, user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$pull": {"favorites": {"kind": f.kind, "ref": f.ref}}})
    return {"message": "Removed"}


# ---------------- Payments ----------------
@api_router.post("/checkout/session")
async def checkout(p: CheckoutReq, request: Request, user=Depends(get_optional_user)):
    if not p.items:
        raise HTTPException(400, "Cart is empty")
    total, line_items = 0.0, []
    for it in p.items:
        prod_doc = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not prod_doc:
            raise HTTPException(404, f"Product {it.product_id} not found")
        qty = max(1, it.quantity)
        total += prod_doc["price"] * qty
        line_items.append({"product_id": prod_doc["id"], "name": prod_doc["name"], "price": prod_doc["price"], "quantity": qty})
    discount = 0.0
    code = (p.coupon or "").upper()
    if code in COUPONS and COUPONS[code] > 0:
        discount = round(total * COUPONS[code], 2)
    if total < 150:
        total += 8.0  # shipping
    total = round(total - discount, 2)
    host = str(request.base_url)
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host}api/webhook/stripe")
    success = f"{p.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel = f"{p.origin_url}/cart"
    meta = {"type": "order", "customer_email": p.customer_email or (user["email"] if user else ""), "coupon": code}
    session = await sc.create_checkout_session(CheckoutSessionRequest(amount=total, currency=CURRENCY, success_url=success, cancel_url=cancel, metadata=meta))
    await db.payment_transactions.insert_one({"id": str(uuid.uuid4()), "session_id": session.session_id, "type": "order",
        "amount": total, "currency": CURRENCY, "items": line_items, "customer_email": meta["customer_email"],
        "user_id": user["id"] if user else None, "payment_status": "pending", "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": session.url, "session_id": session.session_id}

@api_router.post("/appointments/{token}/deposit")
async def pay_deposit(token: str, request: Request):
    a = await db.appointments.find_one({"cancel_token": token}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Appointment not found")
    body = await request.json()
    origin = body.get("origin_url", "")
    host = str(request.base_url)
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host}api/webhook/stripe")
    success = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel = f"{origin}/appointment/{token}"
    meta = {"type": "deposit", "appointment_token": token, "customer_email": a["customer_email"]}
    session = await sc.create_checkout_session(CheckoutSessionRequest(amount=DEPOSIT_AMOUNT, currency=CURRENCY, success_url=success, cancel_url=cancel, metadata=meta))
    await db.payment_transactions.insert_one({"id": str(uuid.uuid4()), "session_id": session.session_id, "type": "deposit",
        "amount": DEPOSIT_AMOUNT, "currency": CURRENCY, "appointment_token": token, "customer_email": a["customer_email"],
        "payment_status": "pending", "status": "initiated", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(404, "Transaction not found")
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{str(request.base_url)}api/webhook/stripe")
    st = await sc.get_checkout_status(session_id)
    if txn["payment_status"] != "paid" and st.payment_status == "paid":
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": "paid", "status": st.status}})
        if txn["type"] == "deposit" and txn.get("appointment_token"):
            await db.appointments.update_one({"cancel_token": txn["appointment_token"]}, {"$set": {"deposit_paid": True}})
    elif txn["status"] != st.status:
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": st.status}})
    return {"payment_status": st.payment_status, "status": st.status, "amount": st.amount_total / 100,
            "currency": st.currency, "type": txn["type"], "items": txn.get("items", [])}

@api_router.post("/webhook/stripe")
async def webhook(request: Request):
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{str(request.base_url)}api/webhook/stripe")
    try:
        ev = await sc.handle_webhook(await request.body(), request.headers.get("Stripe-Signature"))
        if ev.payment_status == "paid":
            await db.payment_transactions.update_one({"session_id": ev.session_id}, {"$set": {"payment_status": "paid", "status": "complete"}})
    except Exception as e:
        logger.error(f"Webhook: {e}")
    return {"received": True}

@api_router.get("/my/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    return await db.payment_transactions.find(
        {"type": "order", "$or": [{"user_id": user["id"]}, {"customer_email": user["email"]}]},
        {"_id": 0}).sort("created_at", -1).to_list(200)


# ---------------- Admin ----------------
@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    booked = await db.appointments.count_documents({"status": "booked"})
    cancelled = await db.appointments.count_documents({"status": "cancelled"})
    paid = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(2000)
    revenue = round(sum(t.get("amount", 0) for t in paid), 2)
    today = datetime.now(timezone.utc).date().isoformat()
    month = today[:7]
    daily = round(sum(t.get("amount", 0) for t in paid if t.get("created_at", "").startswith(today)), 2)
    monthly = round(sum(t.get("amount", 0) for t in paid if t.get("created_at", "").startswith(month)), 2)
    customers = await db.users.count_documents({"role": "customer"})
    products = await db.products.count_documents({})
    return {"booked": booked, "cancelled": cancelled, "paid_orders": len(paid), "revenue": revenue,
            "daily_sales": daily, "monthly_sales": monthly, "customers": customers, "products": products}

@api_router.get("/admin/appointments")
async def admin_appts(admin: dict = Depends(get_current_admin)):
    return await db.appointments.find({}, {"_id": 0, "cancel_token": 0}).sort("date", -1).to_list(1000)

@api_router.get("/admin/orders")
async def admin_orders(admin: dict = Depends(get_current_admin)):
    return await db.payment_transactions.find({"type": "order"}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/admin/customers")
async def admin_customers(admin: dict = Depends(get_current_admin)):
    return await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/admin/reviews")
async def admin_reviews(admin: dict = Depends(get_current_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.put("/admin/reviews/{rid}")
async def approve_review(rid: str, admin: dict = Depends(get_current_admin)):
    await db.reviews.update_one({"id": rid}, {"$set": {"approved": True}})
    return {"message": "Approved"}

@api_router.delete("/admin/reviews/{rid}")
async def delete_review(rid: str, admin: dict = Depends(get_current_admin)):
    await db.reviews.delete_one({"id": rid})
    return {"message": "Deleted"}

@api_router.post("/admin/products")
async def add_product(p: ProductIn, admin: dict = Depends(get_current_admin)):
    doc = {"id": str(uuid.uuid4()), **p.model_dump()}
    await db.products.insert_one(doc)
    return {"message": "Product added", "id": doc["id"]}

@api_router.put("/admin/products/{pid}")
async def update_product(pid: str, p: ProductIn, admin: dict = Depends(get_current_admin)):
    await db.products.update_one({"id": pid}, {"$set": p.model_dump()})
    return {"message": "Updated"}

@api_router.delete("/admin/products/{pid}")
async def delete_product(pid: str, admin: dict = Depends(get_current_admin)):
    await db.products.delete_one({"id": pid})
    return {"message": "Deleted"}

@api_router.get("/admin/newsletter")
async def admin_newsletter(admin: dict = Depends(get_current_admin)):
    return await db.newsletter.find({}, {"_id": 0}).to_list(2000)

@api_router.post("/images/upload")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    if not os.environ.get('CLOUDINARY_CLOUD_NAME') or "PLACEHOLDER" in os.environ.get('CLOUDINARY_CLOUD_NAME'):
        # Mock upload for development
        return {"url": "https://images.unsplash.com/photo-1592520113018-180c8bc831c9?auto=format&fit=crop&w=800"}
    
    try:
        content = await file.read()
        res = await asyncio.to_thread(
            cloudinary.uploader.unsigned_upload, content, "toyerhair"
        )
        return {"url": res["secure_url"]}
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(500, "Image upload failed")

class GalleryReq(BaseModel):
    category: str
    url: str

@api_router.post("/admin/gallery")
async def add_gallery_image(g: GalleryReq, admin: dict = Depends(get_current_admin)):
    doc = {"id": str(uuid.uuid4()), "category": g.category, "url": g.url}
    await db.gallery.insert_one(doc)
    return {"message": "Added to gallery", "id": doc["id"]}

@api_router.delete("/admin/gallery/{gid}")
async def delete_gallery_image(gid: str, admin: dict = Depends(get_current_admin)):
    await db.gallery.delete_one({"id": gid})
    return {"message": "Deleted from gallery"}


# ---------------- Admin: Finances ----------------
@api_router.get("/admin/finance")
async def admin_finance(admin: dict = Depends(get_current_admin)):
    paid = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(5000)
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(5000)
    sales_total = round(sum(t.get("amount", 0) for t in paid if t.get("type") == "order"), 2)
    deposits_total = round(sum(t.get("amount", 0) for t in paid if t.get("type") == "deposit"), 2)
    income_total = round(sales_total + deposits_total, 2)
    expenses_total = round(sum(e.get("amount", 0) for e in expenses), 2)
    months = {}
    for t in paid:
        m = (t.get("created_at") or "")[:7]
        if m:
            months.setdefault(m, {"month": m, "income": 0, "expenses": 0})
            months[m]["income"] = round(months[m]["income"] + t.get("amount", 0), 2)
    for e in expenses:
        m = (e.get("date") or e.get("created_at") or "")[:7]
        if m:
            months.setdefault(m, {"month": m, "income": 0, "expenses": 0})
            months[m]["expenses"] = round(months[m]["expenses"] + e.get("amount", 0), 2)
    by_month = sorted(months.values(), key=lambda x: x["month"], reverse=True)
    for m in by_month:
        m["net"] = round(m["income"] - m["expenses"], 2)
    return {"income_total": income_total, "sales_total": sales_total, "deposits_total": deposits_total,
            "expenses_total": expenses_total, "net_profit": round(income_total - expenses_total, 2), "by_month": by_month}

@api_router.get("/admin/expenses")
async def list_expenses(admin: dict = Depends(get_current_admin)):
    return await db.expenses.find({}, {"_id": 0}).sort("date", -1).to_list(2000)

@api_router.post("/admin/expenses")
async def add_expense(e: ExpenseIn, admin: dict = Depends(get_current_admin)):
    doc = {"id": str(uuid.uuid4()), "description": e.description, "amount": round(e.amount, 2),
           "category": e.category, "date": e.date or datetime.now(timezone.utc).date().isoformat(),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.expenses.insert_one(doc)
    return {"message": "Expense added", "id": doc["id"]}

@api_router.delete("/admin/expenses/{eid}")
async def delete_expense(eid: str, admin: dict = Depends(get_current_admin)):
    await db.expenses.delete_one({"id": eid})
    return {"message": "Deleted"}


# ---------------- Admin: Schedule ----------------
@api_router.get("/admin/schedule")
async def admin_schedule(date: str, admin: dict = Depends(get_current_admin)):
    appts = await db.appointments.find({"date": date}, {"_id": 0}).to_list(100)
    blocked = await db.blocked_slots.find({"date": date}, {"_id": 0}).to_list(100)
    blocked_times = [b["time"] for b in blocked]
    slots = []
    for t in BUSINESS_HOURS:
        appt = next((a for a in appts if a["time"] == t and a["status"] == "booked"), None)
        slots.append({"time": t, "status": "booked" if appt else ("blocked" if t in blocked_times else "open"),
                      "appointment": {"id": appt["id"], "service_name": appt["service_name"], "customer_name": appt["customer_name"], "customer_phone": appt.get("customer_phone", "")} if appt else None})
    return {"date": date, "slots": slots}

@api_router.post("/admin/block")
async def block_slot(b: BlockReq, admin: dict = Depends(get_current_admin)):
    if b.time not in BUSINESS_HOURS:
        raise HTTPException(400, "Invalid time slot")
    await db.blocked_slots.update_one({"date": b.date, "time": b.time}, {"$set": {"date": b.date, "time": b.time}}, upsert=True)
    return {"message": "Blocked"}

@api_router.post("/admin/unblock")
async def unblock_slot(b: BlockReq, admin: dict = Depends(get_current_admin)):
    await db.blocked_slots.delete_one({"date": b.date, "time": b.time})
    return {"message": "Unblocked"}

@api_router.post("/admin/appointments/{aid}/cancel")
async def admin_cancel_appt(aid: str, admin: dict = Depends(get_current_admin)):
    a = await db.appointments.find_one({"id": aid})
    if not a:
        raise HTTPException(404, "Appointment not found")
    await db.appointments.update_one({"id": aid}, {"$set": {"status": "cancelled"}})
    asyncio.create_task(send_email(a["customer_email"], "Your Toyer Hair Appointment was Cancelled",
        email_shell("Appointment Cancelled", f"<p>Hi {a['customer_name']}, your appointment for {a['service_name']} on {a['date']} at {a['time']} has been cancelled by the salon. Please contact us to rebook.</p>")))
    return {"message": "Cancelled"}


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
                   allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
async def startup():
    for s in SERVICES_SEED:
        await db.services.update_one({"id": s["id"]}, {"$set": s}, upsert=True)
    for p in PRODUCTS_SEED:
        await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
    for pr in PROMOS_SEED:
        await db.promotions.update_one({"id": pr["id"]}, {"$set": pr}, upsert=True)
    if not await db.gallery.find_one() and GALLERY_SEED:
        await db.gallery.insert_many([{"id": str(uuid.uuid4()), "category": c, "url": u} for c, u in GALLERY_SEED])
    if not await db.reviews.find_one() and REVIEWS_SEED:
        await db.reviews.insert_many([{"id": str(uuid.uuid4()), **r, "approved": True,
                                       "created_at": datetime.now(timezone.utc).isoformat()} for r in REVIEWS_SEED])
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@toyerhair.com").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"id": str(uuid.uuid4()), "name": "Salon Admin", "email": admin_email,
            "password_hash": hash_password(admin_pw), "role": "admin", "favorites": [],
            "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})
    logger.info("Startup seeding complete")


@app.on_event("shutdown")
async def shutdown():
    client.close()
