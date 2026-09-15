from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.models.anomaly_model import risk_anomaly_model
from app.utils.shap_explainer import shap_explainer

router = APIRouter(prefix="/api/v1", tags=["ML Risk Scoring"])

class RiskScoreRequest(BaseModel):
    recommendation_id: str
    estimated_cost: float
    sector_id: int

class ShapFeatureExplainer(BaseModel):
    feature_name: str
    feature_value: float
    shap_value: float
    impact_description: str

class RiskScoreResponse(BaseModel):
    recommendation_id: str
    risk_score: float
    risk_level: str
    explainers: List[ShapFeatureExplainer]

@router.post("/risk-score", response_model=RiskScoreResponse)
def evaluate_risk(payload: RiskScoreRequest):
    pred = risk_anomaly_model.predict_risk(payload.estimated_cost, payload.sector_id)
    explainers_data = shap_explainer.generate_explainers(payload.estimated_cost, payload.sector_id, pred["risk_score"])

    return RiskScoreResponse(
        recommendation_id=payload.recommendation_id,
        risk_score=pred["risk_score"],
        risk_level=pred["risk_level"],
        explainers=explainers_data
    )
