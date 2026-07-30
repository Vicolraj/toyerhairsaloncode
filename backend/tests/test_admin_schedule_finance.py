"""Iteration 3 tests: Admin Schedule (block/unblock/cancel booking) + Finance/Expenses.
Uses future 2026 dates to avoid collisions with existing bookings."""
import os
import uuid
import pytest
import requests
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL'):
                BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@toyerhair.com"
ADMIN_PASSWORD = "ToyerAdmin2026"

# Use a fixed far-future date for isolation
FUTURE_DATE = (datetime(2026, 6, 15) + timedelta(days=(uuid.uuid4().int % 30))).strftime("%Y-%m-%d")


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin(anon):
    r = anon.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def customer(anon):
    creds = {"name": "TEST Cust", "email": f"testcust+{uuid.uuid4().hex[:8]}@test.com", "password": "pass1234"}
    r = anon.post(f"{API}/auth/register", json=creds)
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {tok}"})
    return s


# ---- Auth gating ----
class TestAdminAuthGating:
    ENDPOINTS = [
        ("GET", "/admin/schedule?date=2026-06-01"),
        ("POST", "/admin/block"),
        ("POST", "/admin/unblock"),
        ("GET", "/admin/finance"),
        ("GET", "/admin/expenses"),
        ("POST", "/admin/expenses"),
    ]

    def test_no_token_returns_401_or_403(self, anon):
        for method, path in self.ENDPOINTS:
            r = anon.request(method, f"{API}{path}", json={} if method == "POST" else None)
            assert r.status_code in (401, 403), f"{method} {path} expected 401/403 got {r.status_code}"

    def test_customer_token_returns_403(self, customer):
        for method, path in self.ENDPOINTS:
            r = customer.request(method, f"{API}{path}", json={} if method == "POST" else None)
            assert r.status_code == 403, f"{method} {path} expected 403 got {r.status_code}"


# ---- Schedule / Block / Unblock ----
class TestAdminSchedule:
    def test_schedule_returns_10_slots(self, admin):
        r = admin.get(f"{API}/admin/schedule", params={"date": FUTURE_DATE})
        assert r.status_code == 200
        d = r.json()
        assert d["date"] == FUTURE_DATE
        assert len(d["slots"]) == 10
        for s in d["slots"]:
            assert s["status"] in ("open", "booked", "blocked")
            assert "time" in s

    def test_block_slot_makes_it_blocked(self, admin, anon):
        target = "11:00"
        r = admin.post(f"{API}/admin/block", json={"date": FUTURE_DATE, "time": target})
        assert r.status_code == 200
        # verify admin schedule shows blocked
        r2 = admin.get(f"{API}/admin/schedule", params={"date": FUTURE_DATE})
        slot = next(s for s in r2.json()["slots"] if s["time"] == target)
        assert slot["status"] == "blocked"
        # verify public availability shows unavailable
        r3 = anon.get(f"{API}/availability", params={"date": FUTURE_DATE})
        pub = next(s for s in r3.json()["slots"] if s["time"] == target)
        assert pub["available"] is False

    def test_booking_blocked_slot_returns_409(self, anon):
        r = anon.post(f"{API}/appointments", json={
            "service_id": "box-braids", "customer_name": "TEST Blocked",
            "customer_email": "test_blocked@test.com", "date": FUTURE_DATE, "time": "11:00"
        })
        assert r.status_code == 409

    def test_unblock_slot_reverses_it(self, admin, anon):
        target = "11:00"
        r = admin.post(f"{API}/admin/unblock", json={"date": FUTURE_DATE, "time": target})
        assert r.status_code == 200
        r2 = admin.get(f"{API}/admin/schedule", params={"date": FUTURE_DATE})
        slot = next(s for s in r2.json()["slots"] if s["time"] == target)
        assert slot["status"] == "open"
        r3 = anon.get(f"{API}/availability", params={"date": FUTURE_DATE})
        pub = next(s for s in r3.json()["slots"] if s["time"] == target)
        assert pub["available"] is True

    def test_admin_cancel_booking(self, admin, anon):
        # Create appointment
        target = "15:00"
        cr = anon.post(f"{API}/appointments", json={
            "service_id": "box-braids", "customer_name": "TEST AdmCancel",
            "customer_email": "test_admcancel@test.com", "date": FUTURE_DATE, "time": target
        })
        assert cr.status_code == 200, cr.text
        appt_id = cr.json()["id"]
        # Verify schedule shows booked with appointment info
        r2 = admin.get(f"{API}/admin/schedule", params={"date": FUTURE_DATE})
        slot = next(s for s in r2.json()["slots"] if s["time"] == target)
        assert slot["status"] == "booked"
        assert slot["appointment"] and slot["appointment"]["id"] == appt_id
        # Cancel via admin
        rc = admin.post(f"{API}/admin/appointments/{appt_id}/cancel")
        assert rc.status_code == 200
        # Verify status cancelled in admin list
        ra = admin.get(f"{API}/admin/appointments")
        found = next((a for a in ra.json() if a["service_name"] and a["date"] == FUTURE_DATE and a["time"] == target), None)
        # Match any cancelled at this slot
        cancelled = [a for a in ra.json() if a["date"] == FUTURE_DATE and a["time"] == target and a["status"] == "cancelled"]
        assert len(cancelled) >= 1, "Booking not marked cancelled"
        # Slot should be open again in availability
        rav = anon.get(f"{API}/availability", params={"date": FUTURE_DATE})
        pub = next(s for s in rav.json()["slots"] if s["time"] == target)
        assert pub["available"] is True

    def test_admin_cancel_bad_id(self, admin):
        r = admin.post(f"{API}/admin/appointments/nonexistent-id-xyz/cancel")
        assert r.status_code == 404


# ---- Finance / Expenses ----
class TestAdminFinance:
    def test_finance_shape(self, admin):
        r = admin.get(f"{API}/admin/finance")
        assert r.status_code == 200
        d = r.json()
        for k in ("income_total", "sales_total", "deposits_total", "expenses_total", "net_profit", "by_month"):
            assert k in d, f"missing key {k}"
        assert isinstance(d["by_month"], list)

    def test_add_expense_updates_totals(self, admin):
        # baseline
        base = admin.get(f"{API}/admin/finance").json()
        base_exp = base["expenses_total"]
        base_net = base["net_profit"]
        # Add expense
        payload = {"description": f"TEST expense {uuid.uuid4().hex[:6]}", "amount": 42.50, "category": "Inventory"}
        r = admin.post(f"{API}/admin/expenses", json=payload)
        assert r.status_code == 200
        eid = r.json()["id"]
        # Verify list
        rl = admin.get(f"{API}/admin/expenses")
        assert rl.status_code == 200
        assert any(e["id"] == eid for e in rl.json())
        # Verify totals
        after = admin.get(f"{API}/admin/finance").json()
        assert round(after["expenses_total"] - base_exp, 2) == 42.50
        assert round(base_net - after["net_profit"], 2) == 42.50
        # Delete
        rd = admin.delete(f"{API}/admin/expenses/{eid}")
        assert rd.status_code == 200
        # Verify removed
        rl2 = admin.get(f"{API}/admin/expenses")
        assert not any(e["id"] == eid for e in rl2.json())
        # Totals back to baseline
        final = admin.get(f"{API}/admin/finance").json()
        assert round(final["expenses_total"], 2) == round(base_exp, 2)
