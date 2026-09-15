from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.models.schedule_sla_model import schedule_sla_risk_model

router = APIRouter(prefix="/ml", tags=["Statutory 75-Day Schedule SLA Risk Engine"])

class ScheduleSlaRiskRequest(BaseModel):
    work_id: Optional[str] = "W-1074"
    recommendation_date: str
    target_completion_date: str
    statutory_limit_days: Optional[int] = 75
    milestones: Optional[List[Dict]] = None

class ScheduleSlaRiskResponse(BaseModel):
    work_id: Optional[str]
    recommendation_date: str
    target_completion_date: str
    total_scheduled_duration_days: int
    statutory_limit_days: int
    sla_margin_days: int
    sla_utilization_ratio: float
    timeline_risk_factor_0_to_1: float
    sla_status: str
    risk_band: str
    explanation: str
    milestone_schedule_breakdown: List[Dict]

@router.post("/schedule-sla-risk", response_model=ScheduleSlaRiskResponse)
def evaluate_schedule_sla_risk(payload: ScheduleSlaRiskRequest):
    result = schedule_sla_risk_model.evaluate_schedule_risk(
        recommendation_date=payload.recommendation_date,
        target_completion_date=payload.target_completion_date,
        milestones=payload.milestones,
        statutory_limit_days=payload.statutory_limit_days or 75
    )
    
    return ScheduleSlaRiskResponse(
        work_id=payload.work_id,
        recommendation_date=result["recommendation_date"],
        target_completion_date=result["target_completion_date"],
        total_scheduled_duration_days=result["total_scheduled_duration_days"],
        statutory_limit_days=result["statutory_limit_days"],
        sla_margin_days=result["sla_margin_days"],
        sla_utilization_ratio=result["sla_utilization_ratio"],
        timeline_risk_factor_0_to_1=result["timeline_risk_factor_0_to_1"],
        sla_status=result["sla_status"],
        risk_band=result["risk_band"],
        explanation=result["explanation"],
        milestone_schedule_breakdown=result["milestone_schedule_breakdown"]
    )
