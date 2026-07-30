"""Backend API tests for Toyer Hair salon full-business site (iteration 2)."""
import os
import uuid
import pytest
import requests
from datetime import datetime, timedelta

# Read backend URL from frontend .env
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL'):
                BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')

ADMIN_EMAIL = "admin@toyerhair.com"
ADMIN_PASSWORD = "ToyerAdmin2026"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api_client):
    r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_client(admin_token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"})
    return s


@pytest.fixture(scope="session")
def customer_creds():
    return {"name": "TEST Customer", "email": f"testcust+{uuid.uuid4().hex[:8]}@test.com", "password": "pass1234"}


@pytest.fixture(scope="session")
def customer_client(customer_creds):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/register", json=customer_creds)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    tok = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


# ---------- Public seed / catalog ----------
class TestPublic:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()

    def test_services_seeded_24(self, api_client):
        r = api_client.get(f"{API}/services")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 24, f"Expected 24 services, got {len(data)}"
        ids = {s["id"] for s in data}
        for expected in ("box-braids", "knotless-braids", "starter-locs", "wig-install", "kids-braids"):
            assert expected in ids, f"Missing service {expected}"
        # Categories present
        cats = {s["category"] for s in data}
        for c in ("Braiding", "Twists", "Natural Hair", "Locs", "Wigs", "Kids Hair"):
            assert c in cats
        for s in data:
            assert "_id" not in s
            assert "price" in s and isinstance(s["price"], (int, float))
            assert "duration_minutes" in s

    def test_products_seeded_16(self, api_client):
        r = api_client.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 16
        ids = {p["id"] for p in data}
        assert "afro-wig" in ids
        assert "hair-oil" in ids
        for p in data:
            assert "_id" not in p

    def test_products_category_filter(self, api_client):
        r = api_client.get(f"{API}/products", params={"category": "Wigs"})
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "Wigs"

    def test_product_detail_with_related(self, api_client):
        r = api_client.get(f"{API}/products/afro-wig")
        assert r.status_code == 200
        d = r.json()
        assert d["product"]["id"] == "afro-wig"
        assert isinstance(d["related"], list)
        # Related must be same category and different id
        for rel in d["related"]:
            assert rel["id"] != "afro-wig"

    def test_product_detail_404(self, api_client):
        r = api_client.get(f"{API}/products/nope-xyz")
        assert r.status_code == 404

    def test_gallery(self, api_client):
        r = api_client.get(f"{API}/gallery")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 8
        for g in data:
            assert "url" in g and "category" in g

    def test_reviews_public_seeded(self, api_client):
        r = api_client.get(f"{API}/reviews")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 4
        for rv in data:
            assert rv.get("approved", True) is True
            assert "_id" not in rv

    def test_promotions(self, api_client):
        r = api_client.get(f"{API}/promotions")
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_newsletter_signup(self, api_client):
        email = f"news+{uuid.uuid4().hex[:6]}@test.com"
        r = api_client.post(f"{API}/newsletter", json={"email": email})
        assert r.status_code == 200
        assert "message" in r.json()

    def test_contact_submit(self, api_client):
        r = api_client.post(f"{API}/contact", json={
            "name": "TEST Contact", "email": "TEST_contact@test.com",
            "phone": "555-1234", "message": "TEST hello"
        })
        assert r.status_code == 200

    def test_create_review_pending(self, api_client):
        r = api_client.post(f"{API}/reviews", json={
            "name": "TEST Reviewer", "rating": 5, "text": "TEST review body", "service": "Wigs"
        })
        assert r.status_code == 200
        assert "approv" in r.json()["message"].lower()


# ---------- Availability ----------
class TestAvailability:
    def test_availability_future(self, api_client):
        date = (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d")
        r = api_client.get(f"{API}/availability", params={"date": date})
        assert r.status_code == 200
        d = r.json()
        assert d["date"] == date
        assert len(d["slots"]) == 10  # 09..18 inclusive
        for s in d["slots"]:
            assert "time" in s and "available" in s


# ---------- Appointments ----------
class TestAppointments:
    booked_token = None
    booked_date = None
    booked_time = None

    def test_create_appointment(self, api_client):
        date = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")
        payload = {
            "service_id": "box-braids",
            "customer_name": "TEST Ada",
            "customer_email": "TEST_ada@example.com",
            "customer_phone": "555-0001",
            "date": date, "time": "10:00",
            "hair_length": "Medium", "hair_included": True, "notes": "TEST"
        }
        r = api_client.post(f"{API}/appointments", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "cancel_token" in d
        TestAppointments.booked_token = d["cancel_token"]
        TestAppointments.booked_date = date
        TestAppointments.booked_time = "10:00"

    def test_slot_now_taken(self, api_client):
        r = api_client.get(f"{API}/availability", params={"date": TestAppointments.booked_date})
        slot = next(s for s in r.json()["slots"] if s["time"] == TestAppointments.booked_time)
        assert slot["available"] is False

    def test_double_booking_409(self, api_client):
        r = api_client.post(f"{API}/appointments", json={
            "service_id": "box-braids",
            "customer_name": "TEST Dup", "customer_email": "TEST_dup@test.com",
            "date": TestAppointments.booked_date, "time": TestAppointments.booked_time,
        })
        assert r.status_code == 409

    def test_invalid_time(self, api_client):
        date = (datetime.utcnow() + timedelta(days=4)).strftime("%Y-%m-%d")
        r = api_client.post(f"{API}/appointments", json={
            "service_id": "box-braids", "customer_name": "TEST",
            "customer_email": "TEST_a@test.com", "date": date, "time": "08:30"
        })
        assert r.status_code == 400

    def test_invalid_service(self, api_client):
        date = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d")
        r = api_client.post(f"{API}/appointments", json={
            "service_id": "not-real", "customer_name": "TEST",
            "customer_email": "TEST_b@test.com", "date": date, "time": "11:00"
        })
        assert r.status_code == 404

    def test_get_by_token(self, api_client):
        r = api_client.get(f"{API}/appointments/by-token/{TestAppointments.booked_token}")
        assert r.status_code == 200
        d = r.json()
        assert d["date"] == TestAppointments.booked_date
        assert d["time"] == TestAppointments.booked_time
        assert "customer_email" not in d  # sanitized
        assert "_id" not in d

    def test_get_by_token_invalid(self, api_client):
        r = api_client.get(f"{API}/appointments/by-token/not-a-real-token")
        assert r.status_code == 404

    def test_reschedule(self, api_client):
        new_date = (datetime.utcnow() + timedelta(days=6)).strftime("%Y-%m-%d")
        r = api_client.post(f"{API}/appointments/reschedule", json={
            "cancel_token": TestAppointments.booked_token,
            "date": new_date, "time": "14:00"
        })
        assert r.status_code == 200
        TestAppointments.booked_date = new_date
        TestAppointments.booked_time = "14:00"
        # confirm updated
        r2 = api_client.get(f"{API}/appointments/by-token/{TestAppointments.booked_token}")
        assert r2.json()["date"] == new_date and r2.json()["time"] == "14:00"

    def test_deposit_creates_stripe_session(self, api_client):
        r = api_client.post(f"{API}/appointments/{TestAppointments.booked_token}/deposit",
                            json={"origin_url": BASE_URL})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and "session_id" in d
        assert "stripe.com" in d["url"]

    def test_cancel(self, api_client):
        r = api_client.post(f"{API}/appointments/cancel", json={"cancel_token": TestAppointments.booked_token})
        assert r.status_code == 200

    def test_slot_free_after_cancel(self, api_client):
        r = api_client.get(f"{API}/availability", params={"date": TestAppointments.booked_date})
        slot = next(s for s in r.json()["slots"] if s["time"] == TestAppointments.booked_time)
        assert slot["available"] is True


# ---------- Customer auth & my/* ----------
class TestCustomerAuth:
    def test_register_login_me(self, api_client, customer_creds, customer_client):
        # customer_client fixture registered already
        r = customer_client.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == customer_creds["email"].lower()
        assert r.json()["role"] == "customer"

    def test_login_again(self, api_client, customer_creds):
        r = api_client.post(f"{API}/auth/login",
                            json={"email": customer_creds["email"], "password": customer_creds["password"]})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_bad_password(self, api_client, customer_creds):
        r = api_client.post(f"{API}/auth/login",
                            json={"email": customer_creds["email"], "password": "wrong"})
        assert r.status_code == 401

    def test_duplicate_register(self, api_client, customer_creds):
        r = api_client.post(f"{API}/auth/register", json=customer_creds)
        assert r.status_code == 400

    def test_my_appointments(self, customer_client):
        r = customer_client.get(f"{API}/my/appointments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_my_orders(self, customer_client):
        r = customer_client.get(f"{API}/my/orders")
        assert r.status_code == 200

    def test_my_favorites_add_get_remove(self, customer_client):
        # Add
        r = customer_client.post(f"{API}/my/favorites", json={"kind": "product", "ref": "afro-wig"})
        assert r.status_code == 200
        # List
        r2 = customer_client.get(f"{API}/my/favorites")
        assert r2.status_code == 200
        favs = r2.json()
        assert any(f["kind"] == "product" and f["ref"] == "afro-wig" for f in favs)
        # Remove
        r3 = customer_client.delete(f"{API}/my/favorites", json={"kind": "product", "ref": "afro-wig"})
        assert r3.status_code == 200

    def test_me_no_token(self, api_client):
        r = api_client.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Admin ----------
class TestAdmin:
    def test_admin_login_ok(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_admin_endpoints_reject_customer(self, customer_client):
        for path in ("stats", "appointments", "orders", "customers", "reviews", "newsletter"):
            r = customer_client.get(f"{API}/admin/{path}")
            assert r.status_code == 403, f"/admin/{path} did not 403 for customer: {r.status_code}"

    def test_admin_stats(self, admin_client):
        r = admin_client.get(f"{API}/admin/stats")
        assert r.status_code == 200
        for k in ("booked", "cancelled", "paid_orders", "revenue", "customers", "products"):
            assert k in r.json()

    def test_admin_appointments(self, admin_client):
        r = admin_client.get(f"{API}/admin/appointments")
        assert r.status_code == 200
        for a in r.json():
            assert "_id" not in a and "cancel_token" not in a

    def test_admin_customers(self, admin_client):
        r = admin_client.get(f"{API}/admin/customers")
        assert r.status_code == 200
        for u in r.json():
            assert "password_hash" not in u

    def test_admin_reviews_and_approve_delete(self, admin_client):
        # Create a fresh review
        rr = requests.post(f"{API}/reviews", json={"name": "TEST Rev2", "rating": 4, "text": "TEST rev body"})
        assert rr.status_code == 200
        # List
        r = admin_client.get(f"{API}/admin/reviews")
        assert r.status_code == 200
        pending = [x for x in r.json() if x["name"] == "TEST Rev2"]
        assert pending, "New review not in admin list"
        rid = pending[0]["id"]
        # Approve
        r2 = admin_client.put(f"{API}/admin/reviews/{rid}")
        assert r2.status_code == 200
        # Delete
        r3 = admin_client.delete(f"{API}/admin/reviews/{rid}")
        assert r3.status_code == 200

    def test_admin_add_and_delete_product(self, admin_client):
        payload = {"name": "TEST Product", "description": "TEST desc", "price": 9.99,
                   "category": "Hair Care", "stock": 5, "image": "https://x/y.jpg", "badge": ""}
        r = admin_client.post(f"{API}/admin/products", json=payload)
        assert r.status_code == 200
        pid = r.json()["id"]
        # verify visible in /api/products
        g = requests.get(f"{API}/products").json()
        assert any(p["id"] == pid for p in g)
        # delete
        d = admin_client.delete(f"{API}/admin/products/{pid}")
        assert d.status_code == 200

    def test_admin_newsletter(self, admin_client):
        r = admin_client.get(f"{API}/admin/newsletter")
        assert r.status_code == 200


# ---------- Stripe checkout (cart) ----------
class TestCheckout:
    def test_create_session_cad(self, api_client):
        r = api_client.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "hair-oil", "quantity": 2}],
            "origin_url": BASE_URL,
            "customer_email": "TEST_buyer@test.com",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "stripe.com" in d["url"]
        TestCheckout.sid = d["session_id"]

    def test_coupon_welcome15(self, api_client):
        r = api_client.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "afro-wig", "quantity": 1}],
            "origin_url": BASE_URL, "coupon": "WELCOME15"
        })
        assert r.status_code == 200

    def test_empty_cart(self, api_client):
        r = api_client.post(f"{API}/checkout/session", json={"items": [], "origin_url": BASE_URL})
        assert r.status_code == 400

    def test_invalid_product(self, api_client):
        r = api_client.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "does-not-exist", "quantity": 1}], "origin_url": BASE_URL
        })
        assert r.status_code == 404

    def test_status_endpoint(self, api_client):
        sid = getattr(TestCheckout, "sid", None)
        if not sid:
            pytest.skip("no session id")
        r = api_client.get(f"{API}/checkout/status/{sid}")
        assert r.status_code == 200
        d = r.json()
        assert d["currency"].lower() == "cad"
        assert "payment_status" in d


# ---------- SEO static ----------
class TestSEO:
    def test_robots(self):
        r = requests.get(f"{BASE_URL}/robots.txt")
        assert r.status_code == 200
        assert "User-agent" in r.text or "user-agent" in r.text.lower()

    def test_sitemap(self):
        r = requests.get(f"{BASE_URL}/sitemap.xml")
        assert r.status_code == 200
        assert "<urlset" in r.text or "<sitemap" in r.text
