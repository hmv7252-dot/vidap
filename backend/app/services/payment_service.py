import os
from typing import List, Optional, Dict
from fastapi import HTTPException
from app.models.database_models import PaymentPackage

class PaymentService:
    @staticmethod
    def get_available_packages() -> List[PaymentPackage]:
        # Prices are configurable dynamically via environment or payment gateway
        return [
            PaymentPackage(
                id="pkg_10_credits",
                credits=10,
                name="Starter Pack",
                description="10 high-quality AI video generations",
                price_cents=int(os.getenv("PRICE_PKG_10_CENTS", "499")),
                currency=os.getenv("PAYMENT_CURRENCY", "USD")
            ),
            PaymentPackage(
                id="pkg_50_credits",
                credits=50,
                name="Creator Pack",
                description="50 high-quality AI video generations (Save 20%)",
                price_cents=int(os.getenv("PRICE_PKG_50_CENTS", "1999")),
                currency=os.getenv("PAYMENT_CURRENCY", "USD")
            ),
            PaymentPackage(
                id="pkg_100_credits",
                credits=100,
                name="Studio Pack",
                description="100 high-quality AI video generations (Save 35%)",
                price_cents=int(os.getenv("PRICE_PKG_100_CENTS", "3499")),
                currency=os.getenv("PAYMENT_CURRENCY", "USD")
            ),
        ]

    @staticmethod
    def verify_payment_webhook(provider: str, payload: dict, signature: str) -> Optional[Dict]:
        """
        Modular payment verification hook (Stripe / Google Play Billing / LemonSqueezy).
        Does not fake payment success: requires real gateway signature verification.
        """
        webhook_secret = os.getenv("PAYMENT_WEBHOOK_SECRET")
        if not webhook_secret:
            raise HTTPException(
                status_code=501,
                detail="Payment gateway webhook secret is not configured on this server."
            )
        # Real signature verification would go here based on provider
        return None
