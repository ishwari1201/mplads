from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.models.ocr_voucher_processor import ocr_voucher_processor

router = APIRouter(prefix="/ml", tags=["ocr-voucher-scanner"])

class VoucherOcrRequest(BaseModel):
    file_name: str = Field(..., example="INV-PWD-2026-084.pdf")
    claimed_amount: float = Field(..., example=450000.0)
    bill_date: str = Field(..., example="2026-08-15")
    sanctioned_budget: float = Field(..., example=2500000.0)
    recommendation_date: Optional[str] = Field("2026-08-12", example="2026-08-12")
    sla_limit_days: Optional[int] = Field(75, example=75)

@router.post("/process-voucher-ocr")
def process_voucher_ocr(req: VoucherOcrRequest):
    """
    OCR Slip Reader & Voucher Scanner Endpoint.
    1. Extracts invoice claim amount & compares against Sanctioned Budget (Must be <= Sanctioned Price).
    2. Extracts bill date & verifies it is safely within the Statutory SLA deadline.
    3. Outputs OCR Compliance Risk Score (0.00 to 1.00 Scale).
    """
    try:
        res = ocr_voucher_processor.process_voucher(
            file_name=req.file_name,
            claimed_amount=req.claimed_amount,
            bill_date_str=req.bill_date,
            sanctioned_budget=req.sanctioned_budget,
            recommendation_date_str=req.recommendation_date,
            sla_limit_days=req.sla_limit_days
        )
        return res
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"OCR Voucher Scanner Error: {str(err)}")
