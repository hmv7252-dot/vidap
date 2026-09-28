from fastapi import APIRouter, HTTPException
from typing import List
from app.models.database_models import PaymentPackage, RewardedAdClaimRequest, UserProfileResponse
from app.services.payment_service import PaymentService
from app.services.ad_service import get_ad_provider
from app.services.credit_manager import CreditManager
from app.database import get_or_create_user

router = APIRouter(prefix="/api/credits", tags=["credits"])

@router.get("/packages", response_model=List[PaymentPackage])
async def list_packages():
    return PaymentService.get_available_packages()

@router.get("/ad-config")
async def get_ad_config():
    provider = get_ad_provider()
    return {
        "rewarded_ads_enabled": provider.is_configured(),
        "reward_credits_per_view": 1
    }

@router.post("/claim-rewarded", response_model=UserProfileResponse)
async def claim_rewarded_credit(body: RewardedAdClaimRequest):
    provider = get_ad_provider()
    if not provider.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Rewarded ad network is not configured on this server."
        )

    # Legitimate cryptographic check - no fake claim
    verified = provider.verify_rewarded_completion(body.ad_network_verification_token)
    if not verified:
        raise HTTPException(
            status_code=403,
            detail="Ad view verification failed. Invalid completion token."
        )

    user = await get_or_create_user(body.device_id)
    await CreditManager.add_credits(user["user_id"], 1, is_paid=False)
    updated_user = await get_or_create_user(body.device_id)
    return UserProfileResponse(**updated_user)
