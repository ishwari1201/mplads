from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.models.phash_comparator import phash_photo_comparator

router = APIRouter(prefix="/ml", tags=["pHash 2-Photo Verification Microservice"])

class ComparePhotosRequest(BaseModel):
    image_path_1: str
    image_path_2: str

class ComparePhotosResponse(BaseModel):
    image_1_phash: str
    image_2_phash: str
    hamming_distance_bits: int
    perceptual_similarity_index: float
    photo_reuse_risk_score_0_to_1: float
    risk_band: str
    is_reused_photo: bool
    explanation: str

@router.post("/compare-photos", response_model=ComparePhotosResponse)
def compare_photos(payload: ComparePhotosRequest):
    result = phash_photo_comparator.compare_two_photos(
        image_path_1=payload.image_path_1,
        image_path_2=payload.image_path_2
    )
    
    return ComparePhotosResponse(
        image_1_phash=result["image_1_phash"],
        image_2_phash=result["image_2_phash"],
        hamming_distance_bits=result["hamming_distance_bits"],
        perceptual_similarity_index=result["perceptual_similarity_index"],
        photo_reuse_risk_score_0_to_1=result["photo_reuse_risk_score_0_to_1"],
        risk_band=result["risk_band"],
        is_reused_photo=result["is_reused_photo"],
        explanation=result["explanation"]
    )
