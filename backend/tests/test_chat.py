# Tests for the /api/chat concierge endpoint (Toya)
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
CHAT_URL = f"{BASE_URL}/api/chat"


@pytest.fixture(scope="module")
def catalog():
    services = requests.get(f"{BASE_URL}/api/services", timeout=30).json()
    products = requests.get(f"{BASE_URL}/api/products", timeout=30).json()
    return {
        "service_ids": {s["id"] for s in services},
        "product_ids": {p["id"] for p in products},
        "service_names": {s["name"].lower() for s in services},
        "product_names": {p["name"].lower() for p in products},
    }


def _post_chat(messages, timeout=90):
    r = requests.post(CHAT_URL, json={"messages": messages}, timeout=timeout)
    assert r.status_code == 200, f"Unexpected status {r.status_code}: {r.text[:400]}"
    data = r.json()
    assert "reply" in data and isinstance(data["reply"], str) and len(data["reply"]) > 5, f"Bad reply: {data}"
    return data["reply"]


def _links(reply):
    # returns list of (label, url) for markdown links
    return re.findall(r"\[([^\]]+)\]\(([^)]+)\)", reply)


class TestChatGrounding:
    def test_empty_messages_returns_400(self):
        r = requests.post(CHAT_URL, json={"messages": []}, timeout=30)
        assert r.status_code == 400

    def test_service_query_references_real_service(self, catalog):
        reply = _post_chat([{"role": "user", "content": "I want knotless braids, how do I book?"}])
        # Should mention booking and include a booking link
        lower = reply.lower()
        assert "book" in lower or "/book" in lower
        links = _links(reply)
        assert links, f"No markdown links in reply: {reply}"
        # At least one link should be a booking link pointing at a real service id, or a plain /book
        booking_links = [u for _, u in links if u.startswith("/book")]
        assert booking_links, f"No booking links: {links}"
        service_ids_referenced = []
        for u in booking_links:
            m = re.match(r"/book\?service=([\w-]+)", u)
            if m:
                service_ids_referenced.append(m.group(1))
        # If a service is referenced, it must exist in the real catalog
        for sid in service_ids_referenced:
            assert sid in catalog["service_ids"], f"Hallucinated service id: {sid}"
        # For knotless braids specifically, prefer that knotless-braids id is referenced
        # but at minimum it should not reference an invalid id.
        assert any(sid == "knotless-braids" for sid in service_ids_referenced) or "/book" in reply, \
            f"Expected reference to knotless-braids or /book: {reply}"

    def test_product_query_references_real_product(self, catalog):
        reply = _post_chat([{"role": "user", "content": "show me a wig under $300"}])
        links = _links(reply)
        assert links, f"No links in reply: {reply}"
        product_links = [u for _, u in links if u.startswith("/product/")]
        assert product_links, f"No product links referenced: {reply}"
        for u in product_links:
            pid = u.replace("/product/", "").strip()
            assert pid in catalog["product_ids"], f"Hallucinated product id: {pid} in {reply}"

    def test_hours_query_responds_sensibly(self):
        reply = _post_chat([{"role": "user", "content": "what are your hours?"}])
        lower = reply.lower()
        # System prompt says Mon–Wed 9–6, Thu–Fri 9–7, Sat 9–6, Sun closed.
        assert any(k in lower for k in ["hour", "open", "mon", "sun", "9"]), f"Doesn't mention hours: {reply}"

    def test_no_hallucinated_links(self, catalog):
        reply = _post_chat([{"role": "user", "content": "Recommend a braid style and a wig"}])
        for _, u in _links(reply):
            if u.startswith("/product/"):
                pid = u.replace("/product/", "").strip()
                assert pid in catalog["product_ids"], f"Hallucinated product id {pid}"
            elif u.startswith("/book?service="):
                sid = re.match(r"/book\?service=([\w-]+)", u).group(1)
                assert sid in catalog["service_ids"], f"Hallucinated service id {sid}"
            else:
                # /book, /shop, tel:, mailto:, http(s):// -> allowed generic
                assert (
                    u in ("/book", "/shop", "/")
                    or u.startswith(("tel:", "mailto:", "http://", "https://"))
                ), f"Unexpected link target: {u}"

    def test_multi_turn_context(self, catalog):
        history = [
            {"role": "user", "content": "I want a wig"},
            {"role": "assistant", "content": "Great! We have several wigs. What's your budget?"},
            {"role": "user", "content": "which is cheapest?"},
        ]
        reply = _post_chat(history)
        # Cheapest wig in seed is Signature Afro Wig at $220 (afro-wig).
        # The reply should still be about wigs (contextual) and reference a real product.
        links = _links(reply)
        product_ids = [
            u.replace("/product/", "").strip()
            for _, u in links
            if u.startswith("/product/")
        ]
        assert product_ids, f"Follow-up should still reference a product: {reply}"
        for pid in product_ids:
            assert pid in catalog["product_ids"], f"Hallucinated product id {pid}"
        # At least one of the referenced products should be in the Wigs category
        wigs = {"afro-wig", "lace-wig", "curly-wig"}
        assert any(pid in wigs for pid in product_ids), \
            f"Context lost - expected a wig product, got {product_ids}. Reply: {reply}"
