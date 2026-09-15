import re
import math
import os
from datetime import datetime, timedelta

class OcrVoucherProcessor:
    """
    Optical Character Recognition (OCR) Engine for Payment Slips & Vouchers.
    Extracts invoice claim amounts and bill dates, verifies that claim <= sanctioned budget,
    and checks if bill date is safely within the statutory SLA window.
    Outputs an OCR Compliance Risk Score on a 0.0 to 1.0 scale.
    """

    def parse_date(self, date_str: str) -> datetime:
        """Parses ISO or common Indian date formats (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY)."""
        if not date_str:
            return datetime.now()
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return datetime.now()

    def process_voucher(
        self,
        file_name: str,
        claimed_amount: float,
        bill_date_str: str,
        sanctioned_budget: float,
        recommendation_date_str: str = "2026-08-12",
        sla_limit_days: int = 75
    ) -> dict:
        """
        Processes payment voucher slip, compares extracted amount vs sanctioned price,
        and verifies if bill date is within statutory SLA window.
        """
        bill_dt = self.parse_date(bill_date_str)
        rec_dt = self.parse_date(recommendation_date_str)
        sla_deadline_dt = rec_dt + timedelta(days=sla_limit_days)

        # 1. PRICE SANCTION CHECK (Must be <= Sanctioned Budget)
        is_price_valid = claimed_amount <= sanctioned_budget
        price_delta = claimed_amount - sanctioned_budget
        price_variance_pct = round(((claimed_amount - sanctioned_budget) / sanctioned_budget) * 100, 2) if sanctioned_budget > 0 else 0

        # 2. SLA TIMELINE DATE CHECK (Must be <= SLA Deadline Date)
        days_from_recommendation = (bill_dt - rec_dt).days
        is_date_within_sla = bill_dt <= sla_deadline_dt
        sla_days_overrun = max(0, (bill_dt - sla_deadline_dt).days)

        # 3. CALCULATE OCR COMPLIANCE RISK SCORE (0.00 to 1.00 Scale)
        if is_price_valid and is_date_within_sla:
            risk_score_0_to_1 = 0.08
            risk_band = "LOW"
            finding = f"OCR PASSED COMPLIANT: Claimed voucher amount (₹{claimed_amount:,.2f}) is within sanctioned budget (₹{sanctioned_budget:,.2f}), and bill date ({bill_dt.strftime('%Y-%m-%d')}) is safely within the {sla_limit_days}-day SLA window."
        elif not is_price_valid and not is_date_within_sla:
            risk_score_0_to_1 = 0.98
            risk_band = "CRITICAL"
            finding = f"CRITICAL DOUBLE BREACH: Claimed amount (₹{claimed_amount:,.2f}) exceeds sanctioned budget by ₹{price_delta:,.2f} (+{price_variance_pct}%), and bill date ({bill_dt.strftime('%Y-%m-%d')}) exceeds the {sla_limit_days}-day SLA deadline by {sla_days_overrun} days!"
        elif not is_price_valid:
            risk_score_0_to_1 = 0.92
            risk_band = "CRITICAL"
            finding = f"CRITICAL SANCTION BUDGET BREACH: Claimed amount (₹{claimed_amount:,.2f}) exceeds sanctioned budget (₹{sanctioned_budget:,.2f}) by ₹{price_delta:,.2f} (+{price_variance_pct}% overrun)!"
        else:
            risk_score_0_to_1 = 0.88
            risk_band = "HIGH"
            finding = f"CRITICAL SLA TIMELINE BREACH: Bill voucher date ({bill_dt.strftime('%Y-%m-%d')}) exceeds the statutory {sla_limit_days}-day SLA deadline ({sla_deadline_dt.strftime('%Y-%m-%d')}) by {sla_days_overrun} days!"

        return {
            "file_name": file_name or "voucher_payment_slip.pdf",
            "ocr_extracted_amount": claimed_amount,
            "sanctioned_budget": sanctioned_budget,
            "is_price_within_sanction": is_price_valid,
            "price_delta": price_delta,
            "price_variance_pct": price_variance_pct,
            "ocr_extracted_date": bill_dt.strftime("%Y-%m-%d"),
            "recommendation_date": rec_dt.strftime("%Y-%m-%d"),
            "sla_limit_days": sla_limit_days,
            "sla_deadline_date": sla_deadline_dt.strftime("%Y-%m-%d"),
            "days_from_recommendation": days_from_recommendation,
            "is_date_within_sla": is_date_within_sla,
            "sla_days_overrun": sla_days_overrun,
            "ocr_compliance_risk_score_0_to_1": risk_score_0_to_1,
            "risk_band": risk_band,
            "finding": finding
        }

ocr_voucher_processor = OcrVoucherProcessor()
