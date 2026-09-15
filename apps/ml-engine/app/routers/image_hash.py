from fastapi import APIRouter
from pydantic import BaseModel
from app.models.phash_engine import phash_engine

router = APIRouter(prefix="/api/v1", tags=["Image Hash Fraud Detection"])

class ImageHashRequest(BaseModel):
    file_path: str

class ImageHashResponse(BaseModel):
    phash: str
    is_suspicious: bool
    reason: str | None = None

@router.post("/image-hash", response_model=ImageHashResponse)
def analyze_image_hash(payload: ImageHashRequest):
    phash_val = phash_engine.compute_phash(payload.file_path)
    
    # Mock reference check against known stock / reused photos
    known_reused_hash = "a8f09c3d7e12b456"
    dist = phash_engine.hamming_distance(phash_val, known_reused_hash)
    
    is_suspicious = dist <= 3
    reason = "Photo perceptual hash matches previously submitted site photo from another constituency." if is_suspicious else None

    return ImageHashResponse(
        phash=phash_val,
        is_suspicious=is_suspicious,
        reason=reason
    )
