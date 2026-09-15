from typing import List, Dict, Any

class ShapExplainerUtility:
    @staticmethod
    def generate_explainers(estimated_cost: float, sector_id: int, risk_score: float) -> List[Dict[str, Any]]:
        explainers = []
        
        # Feature 1: Cost Variance
        cost_baseline = 3000000.0 # 30 Lakh benchmark
        cost_diff = estimated_cost - cost_baseline
        cost_shap = round((cost_diff / cost_baseline) * 25.0, 2)
        
        explainers.append({
          "feature_name": "Estimated Cost Benchmark",
          "feature_value": float(estimated_cost),
          "shap_value": float(cost_shap),
          "impact_description": f"Cost is ₹{abs(cost_diff):,.2f} {'above' if cost_diff > 0 else 'below'} sector baseline benchmark."
        })

        # Feature 2: Sector Priority Weight
        priority_sectors = [1, 2, 3, 5]
        is_priority = sector_id in priority_sectors
        sector_shap = -12.5 if is_priority else 15.0

        explainers.append({
          "feature_name": "Sector Priority Weight",
          "feature_value": float(sector_id),
          "shap_value": float(sector_shap),
          "impact_description": "High priority sector reduces risk rating." if is_priority else "Non-priority sector increases audit risk weight."
        })

        return explainers

shap_explainer = ShapExplainerUtility()
