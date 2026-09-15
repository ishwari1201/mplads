from sklearn.ensemble import IsolationForest
import numpy as np

class RiskAnomalyModel:
    def __init__(self):
        # Initialize pretrained Isolation Forest
        self.clf = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        # Mock background training fit
        dummy_data = np.array([
            [2500000.0, 1],
            [3500000.0, 3],
            [1500000.0, 2],
            [6500000.0, 4],
            [4800000.0, 1],
            [25000000.0, 5] # Anomaly high cost
        ])
        self.clf.fit(dummy_data)

    def predict_risk(self, estimated_cost: float, sector_id: int) -> dict:
        features = np.array([[estimated_cost, sector_id]])
        score = self.clf.decision_function(features)[0]
        
        # Normalize score to 0 - 100 risk scale
        risk_score = float(np.clip(round((0.5 - score) * 80.0, 2), 0.0, 100.0))
        
        if risk_score >= 75.0:
            level = "CRITICAL"
        elif risk_score >= 50.0:
            level = "HIGH"
        elif risk_score >= 25.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "risk_score": risk_score,
            "risk_level": level,
            "raw_decision_score": float(score)
        }

risk_anomaly_model = RiskAnomalyModel()
