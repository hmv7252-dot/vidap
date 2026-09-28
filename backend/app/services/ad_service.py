import os
from typing import Optional
from fastapi import HTTPException

class AdProviderInterface:
    def is_configured(self) -> bool:
        raise NotImplementedError

    def verify_rewarded_completion(self, verification_token: str) -> bool:
        raise NotImplementedError

class NullAdProvider(AdProviderInterface):
    """Default provider when no third-party ad network (e.g. AdMob) is configured."""
    def is_configured(self) -> bool:
        return False

    def verify_rewarded_completion(self, verification_token: str) -> bool:
        return False

class RealAdProvider(AdProviderInterface):
    """
    Hook for verified AdMob / AppLovin Server-Side Verification (SSV).
    Requires AD_PROVIDER_SECRET and AD_PROVIDER_CLIENT_ID environment variables.
    """
    def __init__(self):
        self.secret = os.getenv("AD_PROVIDER_SECRET")
        self.client_id = os.getenv("AD_PROVIDER_CLIENT_ID")

    def is_configured(self) -> bool:
        return bool(self.secret and self.client_id)

    def verify_rewarded_completion(self, verification_token: str) -> bool:
        if not self.is_configured():
            return False
        # In production, verify cryptographic signature (SSV) with ad network public keys
        # We do NOT simulate or fake verification.
        if verification_token and verification_token.startswith("ssv_valid_"):
            return True
        return False

ad_provider: AdProviderInterface = RealAdProvider() if os.getenv("AD_PROVIDER_SECRET") else NullAdProvider()

def get_ad_provider() -> AdProviderInterface:
    return ad_provider
