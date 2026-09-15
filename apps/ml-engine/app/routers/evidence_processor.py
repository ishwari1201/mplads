import math
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.models.phash_engine import phash_engine
from app.models.deep_cnn_model import deep_cnn_classifier

router = APIRouter(prefix="/ml", tags=["IA Evidence Verification Microservice"])

class ProcessEvidenceRequest(BaseModel):
    photo_id: str
    file_path: str
    work_latitude: float
    work_longitude: float
    exif_latitude: Optional[float] = None
    exif_longitude: Optional[float] = None
    capture_timestamp: Optional[str] = None
    historical_hashes: List[str] = []

class ProcessEvidenceResponse(BaseModel):
    photo_id: str
    phash: str
    min_hamming_distance: int
    is_phash_suspicious: bool
    reused_photo_flag: bool
    gps_distance_offset_meters: float
    is_gps_mismatch: bool
    is_gps_missing: bool
    is_photo_quality_low: bool
    deep_cnn_classification: Dict
    signals: List[str]

def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

@router.post("/process-evidence", response_model=ProcessEvidenceResponse)
def process_evidence(payload: ProcessEvidenceRequest):
    phash_val = phash_engine.compute_phash(payload.file_path)
    
    # Run Deep Convolutional Neural Network (CNN) with Softmax functional activation
    cnn_result = deep_cnn_classifier.classify_image(payload.file_path)
    
    # Default reference hash for demo verification
    reference_hashes = payload.historical_hashes or ["a8f09c3d7e12b456", "f0a89c3d7e12b999"]
    
    min_dist = 999
    for ref in reference_hashes:
        dist = phash_engine.hamming_distance(phash_val, ref)
        if dist < min_dist:
            min_dist = dist
            
    is_reused = min_dist < 5
    signals: List[str] = []
    
    if is_reused:
        signals.append(f"REUSED_PHOTO_DETECTED: pHash Hamming distance {min_dist} (< 5 threshold)")

    # Geodesic GPS Distance Offset Verification
    is_missing_gps = payload.exif_latitude is None or payload.exif_longitude is None
    gps_offset = 0.0
    is_gps_mismatch = False

    if is_missing_gps:
        signals.append("GPS_METADATA_MISSING: Photo contains no EXIF location tags")
    else:
        gps_offset = haversine_meters(
            payload.work_latitude, payload.work_longitude,
            payload.exif_latitude, payload.exif_longitude
        )
        if gps_offset > 500.0:
            is_gps_mismatch = True
            signals.append(f"GPS_MISMATCH_EXCEEDS_RADIUS: Photo location is {gps_offset:.1f}m from registered site (>500m radius)")

    # Add Deep CNN Softmax Classification Signal
    if cnn_result["is_suspicious_evidence"]:
        signals.append(f"CNN_DEEP_FEATURE_FLAG: Deep ConvNet classified image as {cnn_result['predicted_class']} ({cnn_result['confidence_percentage']}% confidence)")

    # Quality check
    is_low_quality = cnn_result["predicted_class"] == "POOR_QUALITY_BLURRY"

    return ProcessEvidenceResponse(
        photo_id=payload.photo_id,
        phash=phash_val,
        min_hamming_distance=min_dist,
        is_phash_suspicious=is_reused,
        reused_photo_flag=is_reused,
        gps_distance_offset_meters=round(gps_offset, 1),
        is_gps_mismatch=is_gps_mismatch,
        is_gps_missing=is_missing_gps,
        is_photo_quality_low=is_low_quality,
        deep_cnn_classification=cnn_result,
        signals=signals,
    )
