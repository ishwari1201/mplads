from fastapi import APIRouter
from pydantic import BaseModel
from app.models.sbert_model import sbert_model
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["Duplicate Check"])

class DuplicateCheckRequest(BaseModel):
    title: str
    description: str

class DuplicateCheckResponse(BaseModel):
    similarity_score: float
    is_duplicate: bool

@router.post("/duplicate-check", response_model=DuplicateCheckResponse)
def check_duplicate(payload: DuplicateCheckRequest):
    # Benchmark against standard recommendation template
    benchmark_text = "Installation of high-capacity solar RO plant for clean drinking water in Colaba school"
    combined_input = f"{payload.title} {payload.description}"
    
    score = sbert_model.compute_similarity(combined_input, benchmark_text)
    is_dup = score >= settings.SIMILARITY_THRESHOLD

    return DuplicateCheckResponse(
        similarity_score=score,
        is_duplicate=is_dup
    )
