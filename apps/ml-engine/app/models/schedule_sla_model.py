import math
from datetime import datetime
from typing import List, Optional, Dict

class StatutoryScheduleSlaRiskModel:
    """
    Evaluates project schedule timelines against the statutory 75-day SLA limit,
    calculating milestone velocity, buffer margins, and outputting a Timeline Risk Factor on a 0.0 to 1.0 scale.
    """

    def __init__(self, statutory_limit_days: int = 75):
        self.statutory_limit_days = statutory_limit_days

    def calculate_schedule_duration(self, start_date_str: str, completion_date_str: str) -> int:
        """
        Calculates total scheduled days between start date and target completion date.
        """
        try:
            d1 = datetime.strptime(start_date_str[:10], "%Y-%m-%d")
            d2 = datetime.strptime(completion_date_str[:10], "%Y-%m-%d")
            return max(1, (d2 - d1).days)
        except Exception:
            return 60  # Default 60 days baseline

    def sigmoid(self, x: float) -> float:
        return 1.0 / (1.0 + math.exp(-x))

    def evaluate_schedule_risk(
        self,
        recommendation_date: str,
        target_completion_date: str,
        milestones: Optional[List[Dict[str, int]]] = None,
        statutory_limit_days: int = 75
    ) -> Dict:
        """
        Takes project schedule dates and milestone breakdown, evaluates statutory 75-day limit,
        and outputs Timeline Risk Factor on a 0.0 to 1.0 scale.
        """
        scheduled_days = self.calculate_schedule_duration(recommendation_date, target_completion_date)
        limit = statutory_limit_days or self.statutory_limit_days
        
        sla_margin_days = limit - scheduled_days
        sla_utilization_ratio = scheduled_days / float(limit)

        # Milestone Schedule Analysis
        total_milestone_days = 0
        milestone_breakdown = []
        if milestones and len(milestones) > 0:
            for m in milestones:
                name = m.get("name", "Milestone Stage")
                days = m.get("duration_days", 15)
                total_milestone_days += days
                milestone_breakdown.append({"milestone": name, "duration_days": days})
        else:
            # Standard Statutory 4-Stage Milestone Schedule
            total_milestone_days = scheduled_days
            milestone_breakdown = [
                {"milestone": "Sanction & Administrative Clearance", "duration_days": min(14, int(scheduled_days * 0.2))},
                {"milestone": "Agency Assignment & Tendering", "duration_days": min(14, int(scheduled_days * 0.2))},
                {"milestone": "Physical Construction Execution", "duration_days": min(35, int(scheduled_days * 0.5))},
                {"milestone": "Final Inspection & Quality Certification", "duration_days": min(12, int(scheduled_days * 0.1))},
            ]

        # Timeline Risk Logit Equation:
        # Logit = Intercept + 6.0*(Utilization - 1.0) - 0.05*Margin
        overrun_ratio = max(0.0, (scheduled_days - limit) / float(limit))
        
        if scheduled_days <= limit:
            # Within Statutory 75-Day Limit: Low/Moderate Risk
            raw_logit = -2.5 + (3.0 * sla_utilization_ratio)
            timeline_risk_0_to_1 = float(round(self.sigmoid(raw_logit), 3))
            sla_status = "WITHIN_STATUTORY_LIMIT"
            risk_band = "LOW" if timeline_risk_0_to_1 < 0.35 else "MEDIUM"
            explanation = f"Project schedule ({scheduled_days} days) complies with statutory {limit}-day SLA limit (+{sla_margin_days} days safety margin). Timeline Risk: {timeline_risk_0_to_1:.2f} / 1.0"
        else:
            # Overrun Statutory 75-Day Limit: High/Critical SLA Breach Risk
            raw_logit = 0.5 + (8.0 * overrun_ratio)
            timeline_risk_0_to_1 = float(round(self.sigmoid(raw_logit), 3))
            sla_status = "STATUTORY_SLA_BREACH"
            risk_band = "CRITICAL" if timeline_risk_0_to_1 >= 0.75 else "HIGH"
            explanation = f"CRITICAL: Project schedule ({scheduled_days} days) breaches statutory {limit}-day limit by {abs(sla_margin_days)} days! High SLA breach risk. Timeline Risk: {timeline_risk_0_to_1:.2f} / 1.0"

        return {
            "model_type": "Statutory 75-Day Schedule SLA Risk Engine",
            "recommendation_date": recommendation_date,
            "target_completion_date": target_completion_date,
            "total_scheduled_duration_days": scheduled_days,
            "statutory_limit_days": limit,
            "sla_margin_days": sla_margin_days,
            "sla_utilization_ratio": float(round(sla_utilization_ratio, 2)),
            "timeline_risk_factor_0_to_1": timeline_risk_0_to_1,
            "sla_status": sla_status,
            "risk_band": risk_band,
            "explanation": explanation,
            "milestone_schedule_breakdown": milestone_breakdown
        }

schedule_sla_risk_model = StatutoryScheduleSlaRiskModel()
