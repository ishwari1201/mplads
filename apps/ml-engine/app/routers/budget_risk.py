from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict
from app.models.budget_image_risk_model import budget_site_risk_model

router = APIRouter(prefix="/ml", tags=["Multimodal Budget & Image Risk Engine"])

class BudgetSiteRiskRequest(BaseModel):
    photo_id: Optional[str] = "photo-101"
    file_path: str
    budget_amount: float
    claimed_progress_percent: Optional[float] = 35.0
    exif_distance_meters: Optional[float] = 0.0
    is_reused_photo: Optional[bool] = False

class BudgetSiteRiskResponse(BaseModel):
    photo_id: Optional[str]
    budget_amount_inr: float
    visual_site_maturity_index: float
    budget_utilization_ratio: float
    budget_visual_divergence_delta: float
    risk_score_0_to_1: float
    risk_band: str
    explanation: str
    deep_cnn_output: Dict

@router.post("/budget-site-risk", response_model=BudgetSiteRiskResponse)
def evaluate_budget_site_risk(payload: BudgetSiteRiskRequest):
    result = budget_site_risk_model.evaluate_budget_site_risk(
        file_path=payload.file_path,
        budget_amount=payload.budget_amount,
        claimed_progress_percent=payload.claimed_progress_percent or 35.0,
        exif_distance_meters=payload.exif_distance_meters or 0.0,
        is_reused_photo=payload.is_reused_photo or False
    )
    
    return BudgetSiteRiskResponse(
        photo_id=payload.photo_id,
        budget_amount_inr=result["budget_amount_inr"],
        visual_site_maturity_index=result["visual_site_maturity_index"],
        budget_utilization_ratio=result["budget_utilization_ratio"],
        budget_visual_divergence_delta=result["budget_visual_divergence_delta"],
        risk_score_0_to_1=result["risk_score_0_to_1"],
        risk_band=result["risk_band"],
        explanation=result["explanation"],
        deep_cnn_output=result["deep_cnn_output"]
    )
