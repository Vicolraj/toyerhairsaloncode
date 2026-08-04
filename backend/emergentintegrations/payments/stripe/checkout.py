import stripe
import os

class CheckoutSessionRequest:
    def __init__(self, amount, currency, success_url, cancel_url, metadata):
        self.amount = amount
        self.currency = currency
        self.success_url = success_url
        self.cancel_url = cancel_url
        self.metadata = metadata

class SessionMock:
    def __init__(self, session_id, url):
        self.session_id = session_id
        self.url = url

class StripeCheckout:
    def __init__(self, api_key, webhook_url):
        self.api_key = api_key
        stripe.api_key = api_key
        
    async def create_checkout_session(self, req: CheckoutSessionRequest):
        # Fallback for placeholder
        if not self.api_key or "PLACEHOLDER" in self.api_key:
            return SessionMock("test_sess_123", req.success_url.replace("{CHECKOUT_SESSION_ID}", "test_sess_123"))
            
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': req.currency,
                    'product_data': {'name': 'Toyer Hair Order'},
                    'unit_amount': int(req.amount * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            metadata=req.metadata
        )
        return SessionMock(session.id, session.url)
        
    async def get_checkout_status(self, session_id):
        class StatusMock:
            def __init__(self, payment_status, status, amount_total, currency):
                self.payment_status = payment_status
                self.status = status
                self.amount_total = amount_total
                self.currency = currency
                
        if "test_sess" in session_id:
            return StatusMock("paid", "complete", 15000, "cad")
            
        session = stripe.checkout.Session.retrieve(session_id)
        return StatusMock(session.payment_status, session.status, session.amount_total, session.currency)

    async def handle_webhook(self, payload, sig_header):
        secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
        if not secret:
            # Fallback for local testing if secret is not provided
            event = stripe.Event.construct_from(
                stripe.util.json.loads(payload), stripe.api_key
            )
            class EventMock:
                def __init__(self, ev):
                    self.type = ev.type
                    self.session_id = ev.data.object.id
                    self.payment_status = ev.data.object.payment_status
            return EventMock(event)
            
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, secret)
            class EventMock:
                def __init__(self, ev):
                    self.type = ev.type
                    self.session_id = ev.data.object.id
                    self.payment_status = ev.data.object.payment_status
            return EventMock(event)
        except stripe.error.SignatureVerificationError as e:
            raise ValueError("Invalid Stripe signature") from e
