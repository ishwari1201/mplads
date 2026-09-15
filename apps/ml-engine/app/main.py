from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import duplicate_check, image_hash, risk_score, similarity, evidence_processor, budget_risk, schedule_risk, photo_verifier, ocr_voucher

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MPLADS AI Machine Learning Service for Anomaly Detection, SBERT Duplication, pHash 2-Photo Verification Engine, Multimodal Image-Budget Risk Engine, Statutory 75-Day SLA Model & OCR Slip Scanner"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(duplicate_check.router)
app.include_router(image_hash.router)
app.include_router(risk_score.router)
app.include_router(similarity.router)
app.include_router(evidence_processor.router)
app.include_router(budget_risk.router)
app.include_router(schedule_risk.router)
app.include_router(photo_verifier.router)
app.include_router(ocr_voucher.router)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
