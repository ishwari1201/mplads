from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.models.sbert_model import sbert_model

router = APIRouter(prefix="/ml", tags=["Hybrid Similarity Engine"])

class PreSanctionScreenRequest(BaseModel):
    proposed_work_id: Optional[str] = None
    title: str
    description: str
    sector: Optional[str] = None
    estimated_cost: float
    latitude: Optional[float] = 18.9067
    longitude: Optional[float] = 72.8258
    district_id: Optional[str] = None

class MatchedWork(BaseModel):
    work_id: str
    title: str
    similarity_score: float
    distance_meters: float

class PreSanctionScreenResponse(BaseModel):
    proposed_work_id: Optional[str]
    semantic_score: float
    lexical_score: float
    spatial_score: float
    cost_score: float
    final_similarity_score: float
    is_potentially_duplicate: bool
    recommendation_flag: str
    top_matches: List[MatchedWork]

@router.post("/pre-sanction-screen", response_model=PreSanctionScreenResponse)
def pre_sanction_screen(payload: PreSanctionScreenRequest):
    # Benchmark against historical constituency work
    historical_benchmark = "Solar RO Water Purifier Plant Installation in Colaba School"
    text_input = f"{payload.title} {payload.description}"

    semantic = sbert_model.compute_similarity(text_input, historical_benchmark)
    
    # Lexical TF-IDF approximation
    words_input = set(text_input.lower().split())
    words_bench = set(historical_benchmark.lower().split())
    intersection = words_input.intersection(words_bench)
    lexical = round(len(intersection) / max(1, len(words_bench)), 4)

    # Spatial proximity calculation (150m mock proximity)
    spatial = 0.88

    # Cost ratio variance calculation
    benchmark_cost = 2500000.0
    cost_diff = abs(payload.estimated_cost - benchmark_cost) / benchmark_cost
    cost_score = float(max(0.0, round(1.0 - cost_diff, 4)))

    # Weighted Hybrid Similarity Formula: 0.4*Semantic + 0.25*Lexical + 0.2*Spatial + 0.15*Cost
    final_score = round(
        (0.40 * semantic) + (0.25 * lexical) + (0.20 * spatial) + (0.15 * cost_score),
        4
    )

    is_dup = final_score >= 0.75
    flag = "POTENTIALLY SIMILAR EXISTING WORK — HUMAN REVIEW REQUIRED" if is_dup else "UNIQUE PROPOSAL"

    matches = [
      MatchedWork(
          work_id="r1000000-0000-0000-0000-000000000001",
          title="Solar RO Water Purifier Plant (Colaba Ward 1)",
          similarity_score=final_score,
          distance_meters=145.2
      )
    ] if is_dup else []

    return PreSanctionScreenResponse(
        proposed_work_id=payload.proposed_work_id,
        semantic_score=semantic,
        lexical_score=lexical,
        spatial_score=spatial,
        cost_score=cost_score,
        final_similarity_score=final_score,
        is_potentially_duplicate=is_dup,
        recommendation_flag=flag,
        top_matches=matches
    )
