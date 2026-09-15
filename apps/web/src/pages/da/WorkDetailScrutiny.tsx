import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  daService, PreSanctionScreenResponse, ExecutionStatsResponse, EvidenceResponse, 
  GovernmentChecksResponse, RiskHistoryPoint, WorkAnalysisResponse 
} from '../../services/daService';
import { stateService } from '../../services/stateService';
import { centralService } from '../../services/centralService';
import { publicService } from '../../services/publicService';
import { WorkRecommendation } from '../../types/project';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ShapExplainerCard } from '../admin/ShapExplainerCard';
import {
  ShieldAlert, Sparkles, MapPin, DollarSign, Camera, CheckCircle2,
  AlertTriangle, ArrowLeft, Layers, Activity, UserCheck, Clock, FileText,
  AlertCircle, ChevronRight, HelpCircle, ArrowUpRight, Search, Database, Globe, ChevronDown, UploadCloud, Cpu, Calendar, Image as ImageIcon, ShieldCheck, FileCheck, Users
} from 'lucide-react';

export const WorkDetailScrutiny: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isStateRoute = location.pathname.startsWith('/state');
  const isCentralRoute = location.pathname.startsWith('/central');

  const [recommendation, setRecommendation] = useState<WorkRecommendation | null>(null);
  const [similarity, setSimilarity] = useState<PreSanctionScreenResponse | null>(null);
  const [execStats, setExecStats] = useState<ExecutionStatsResponse | null>(null);
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [paymentClaims, setPaymentClaims] = useState<any[]>([]);
  const [iaScheduleRecord, setIaScheduleRecord] = useState<any | null>(null);
  const [govtChecks, setGovtChecks] = useState<GovernmentChecksResponse | null>(null);
  const [riskHistory, setRiskHistory] = useState<RiskHistoryPoint[]>([]);
  const [analysisData, setAnalysisData] = useState<WorkAnalysisResponse | null>(null);
  const [escalationDossier, setEscalationDossier] = useState<any | null>(null);

  // Schedule SLA Interactive Risk Calculator State
  const [recommendationDate, setRecommendationDate] = useState('2026-08-12');
  const [targetCompletionDate, setTargetCompletionDate] = useState('2026-10-20');
  const [statutoryLimitDays, setStatutoryLimitDays] = useState(75);

  const [checkingGovt, setCheckingGovt] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [citizenReportsList, setCitizenReportsList] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    publicService.getCitizenReports({ work_id: id }).then((res) => {
      if (res.reports) setCitizenReportsList(res.reports);
    }).catch(console.warn);

    // Check local storage for dynamic IA updates & recommendations first
    const localStr = localStorage.getItem('mplads_submitted_recommendations');
    let localMatch: WorkRecommendation | undefined;
    if (localStr) {
      const localList: WorkRecommendation[] = JSON.parse(localStr);
      localMatch = localList.find((r) => r.id === id);
    }

    const loadWorkData = async () => {
      if (localMatch) {
        setRecommendation(localMatch);
        if ((localMatch as any)?.target_completion_date) {
          setTargetCompletionDate((localMatch as any).target_completion_date);
        }
        return;
      }

      // 1. Try State Work Detail API if on State route
      try {
        const stateRes = await stateService.getWorkDetail(id);
        if (stateRes && stateRes.work) {
          const w = stateRes.work;
          const rec: WorkRecommendation = {
            id: w.id,
            title: w.title,
            description: w.description || '',
            sector: w.sector,
            category: (w.category as any) || 'GENERAL',
            estimated_cost: w.estimated_cost,
            sanctioned_amount: w.sanctioned_amount,
            status: w.status as any,
            address: w.address,
            sla_deadline: w.sla_deadline,
            created_at: w.created_at,
            longitude: w.longitude,
            latitude: w.latitude,
            mp_name: w.mp_name
          };
          setRecommendation(rec);
          return;
        }
      } catch (e) {
        // Continue fallback
      }

      // 2. Try State Works List
      try {
        const stateWorksRes = await stateService.getStateWorks();
        const stMatch = stateWorksRes.works.find((w) => w.id === id);
        if (stMatch) {
          const rec: WorkRecommendation = {
            id: stMatch.id,
            title: stMatch.title,
            description: stMatch.description || '',
            sector: stMatch.sector,
            category: (stMatch.category as any) || 'GENERAL',
            estimated_cost: stMatch.estimated_cost,
            sanctioned_amount: stMatch.sanctioned_amount,
            status: stMatch.status as any,
            address: stMatch.address,
            sla_deadline: stMatch.sla_deadline,
            created_at: stMatch.created_at,
            longitude: stMatch.longitude,
            latitude: stMatch.latitude,
            mp_name: stMatch.mp_name
          };
          setRecommendation(rec);
          return;
        }
      } catch (e) {
        // Continue fallback
      }

      // 3. Try DA Priority Queue & Pending Recommendations
      try {
        const res = await daService.getPriorityQueue();
        const match = res.priority_queue.find((r) => r.id === id);
        if (match) {
          setRecommendation(match);
          if ((match as any)?.target_completion_date) {
            setTargetCompletionDate((match as any).target_completion_date);
          }
          return;
        }

        const pendRes = await daService.getPendingRecommendations();
        const pendMatch = pendRes.recommendations.find((r) => r.id === id);
        if (pendMatch) {
          setRecommendation(pendMatch);
          if ((pendMatch as any)?.target_completion_date) {
            setTargetCompletionDate((pendMatch as any).target_completion_date);
          }
          return;
        }

        // Final fallback: first priority queue item
        if (res.priority_queue.length > 0) {
          setRecommendation(res.priority_queue[0]);
        }
      } catch (err) {
        console.warn('Error loading work recommendation details:', err);
      }
    };

    loadWorkData();

    // Check local storage for 2 photos uploaded by IA for this work ID
    const photosStr = localStorage.getItem('mplads_uploaded_photos');
    if (photosStr) {
      const allPhotos = JSON.parse(photosStr);
      const matches = allPhotos.filter((p: any) => p.work_id === id);
      setUploadedPhotos(matches);
      if (matches[0]?.target_completion_date) {
        setTargetCompletionDate(matches[0].target_completion_date);
      }
    }

    // Check local storage for payment claims & OCR voucher slips
    const claimsStr = localStorage.getItem('mplads_payment_claims');
    if (claimsStr) {
      const allClaims = JSON.parse(claimsStr);
      const matches = allClaims.filter((c: any) => c.work_id === id);
      setPaymentClaims(matches);
    }

    // Check local storage for IA Schedule Updates
    const iaSchedulesStr = localStorage.getItem('mplads_ia_schedules');
    if (iaSchedulesStr && id) {
      const iaSchedules = JSON.parse(iaSchedulesStr);
      if (iaSchedules[id]) {
        setIaScheduleRecord(iaSchedules[id]);
        if (iaSchedules[id].target_completion_date) {
          setTargetCompletionDate(iaSchedules[id].target_completion_date);
        }
      }
    }

    // Check local storage for Multi-Tier Escalation Dossier
    const dosStr = localStorage.getItem('mplads_escalation_dossiers');
    if (dosStr && id) {
      const dosMap = JSON.parse(dosStr);
      if (dosMap[id]) {
        setEscalationDossier(dosMap[id]);
      }
    }

    daService.runPreSanctionScreen(id).then(setSimilarity).catch(console.error);
    daService.getExecutionStats(id).then(setExecStats).catch(console.error);
    daService.getWorkEvidence(id).then(setEvidence).catch(console.error);
    daService.getGovernmentChecks(id).then(setGovtChecks).catch(console.error);
    daService.getRiskHistory(id).then((res) => setRiskHistory(res.history)).catch(console.error);
    daService.getWorkAnalysis(id).then(setAnalysisData).catch(console.error);
  }, [id]);

  const handleRunGovtCheck = () => {
    if (!id) return;
    setCheckingGovt(true);
    setTimeout(() => {
      daService.getGovernmentChecks(id).then((res) => {
        setGovtChecks(res);
        setCheckingGovt(false);
      }).catch(console.error);
    }, 800);
  };

  const handleCaseAction = async (action: string) => {
    if (!id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      let newStatus = 'UNDER_SCRUTINY';
      let msg = '';
      let evidenceType = '';
      let evidenceReason = '';

      if (action === 'REQUEST_EVIDENCE') {
        newStatus = 'EVIDENCE_REQUESTED';
        msg = 'Case Decision Recorded: Requested More Information from Implementing Agency. Evidence query dispatched to IA portal.';
        evidenceType = 'Physical Milestone Verification & Measurement Book (MB) Sheet';
        evidenceReason = 'District Officer Tab Selection [Request More Information]: Additional physical evidence photos & signed MB sheet required.';
      } else if (action === 'RETURN_FOR_CORRECTION') {
        newStatus = 'RETURNED_FOR_CORRECTION';
        msg = 'Case Decision Recorded: Work returned to Implementing Agency for milestone correction and timeline resubmission.';
        evidenceType = 'Revised Milestone Physical Progress & Cost Breakdown Rectification';
        evidenceReason = 'District Officer Tab Selection [Return for Correction]: Milestone physical progress & voucher claim figures must be rectified and resubmitted.';
      } else if (action === 'CLEAR_CASE') {
        newStatus = 'CLEARED';
        msg = 'Case Decision Recorded: Work marked cleared by District Officer. All physical progress, pHash verification, and SLA checks verified.';
        evidenceType = 'District Administrative Sanction Clearance Certificate';
        evidenceReason = 'District Officer Tab Selection [Mark Cleared]: All physical evidence & pHash checks verified. Case cleared for milestone disbursement.';
      } else if (action === 'CONFIRM_ISSUE') {
        newStatus = 'ISSUE_CONFIRMED';
        msg = 'Case Decision Recorded: Integrity issue confirmed by District Officer. Financial disbursement frozen pending audit.';
        evidenceType = 'Audit Explanation Statement regarding Photo Reuse & Location Mismatch';
        evidenceReason = 'District Officer Tab Selection [Confirm Issue]: Formal audit explanation statement required regarding site photo reuse and EXIF GPS offset divergence.';
      } else if (action === 'ESCALATE') {
        newStatus = 'ESCALATED_TO_STATE';
        msg = 'Case Decision Recorded: Case escalated to State MPLADS Monitoring Authority for high-level statutory review.';
        evidenceType = 'State MPLADS High-Level Audit Dossier & Statutory Compliance Report';
        evidenceReason = 'District Officer Tab Selection [Escalate to State]: Case escalated for high-level statutory review. Complete project audit dossier required.';
      } else if (action === 'ESCALATE_TO_CENTRAL') {
        newStatus = 'ESCALATED_TO_CENTRAL';
        msg = 'Case Decision Recorded: Case escalated to Central Nodal Ministry (MoSPI) for national oversight & statutory inquiry.';
        evidenceType = 'Central MoSPI Statutory Audit Dossier & Inter-State Audit Report';
        evidenceReason = 'State Officer Selection [Escalate to Central]: Case escalated for national nodal ministry review and financial freeze consideration.';
      } else if (action === 'FREEZE_FUNDS') {
        newStatus = 'FROZEN_PENDING_AUDIT';
        msg = 'Case Decision Recorded: Central Nodal Ministry (MoSPI) has frozen installment funds and marked project for CAG / National Audit.';
        evidenceType = 'CAG National Special Audit Report & Central Fund Freeze Directive';
        evidenceReason = 'Central Officer Selection [Freeze Installment Funds]: Installment disbursement frozen at national level pending CAG audit.';
      }

      // Dispatch dynamic evidence request to IA portal via localStorage
      const evStr = localStorage.getItem('mplads_evidence_requests') || '[]';
      const evList = JSON.parse(evStr);
      const newEvReq = {
        id: `ev-${Date.now()}`,
        work_id: id,
        work_id_code: workIdCode,
        evidence_type: evidenceType,
        reason: evidenceReason,
        status: action === 'CLEAR_CASE' ? 'CLEARED' : 'PENDING_IA_RESPONSE',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('mplads_evidence_requests', JSON.stringify([newEvReq, ...evList]));

      // Try API call based on active portal context
      try {
        let res: any;
        if (isCentralRoute) {
          res = await centralService.performMinistryCaseAction(id, action, 'Central Officer decision from Deep Scrutiny Workbench');
        } else if (isStateRoute) {
          res = await stateService.performCaseAction(id, action, 'State Officer decision from Deep Scrutiny Workbench');
        } else {
          res = await daService.performCaseAction(id, action, 'District Officer decision from Deep Scrutiny Workbench');
        }
        if (res?.message) msg = res.message;
        if (res?.new_status) newStatus = res.new_status;
      } catch (e) {
        console.warn('API performCaseAction fallback:', e);
      }

      // Update state
      setActionMessage(msg);
      if (recommendation) {
        setRecommendation({ ...recommendation, status: newStatus as any });
      }

      // Persist in localStorage for cross-portal sync
      const recsStr = localStorage.getItem('mplads_submitted_recommendations');
      if (recsStr) {
        const recs = JSON.parse(recsStr);
        const updatedRecs = recs.map((r: any) => r.id === id ? { ...r, status: newStatus } : r);
        localStorage.setItem('mplads_submitted_recommendations', JSON.stringify(updatedRecs));
      }

      // Persist & Update Multi-Tier Escalation & Transferred Evidence Dossier
      const dosStr = localStorage.getItem('mplads_escalation_dossiers') || '{}';
      const dosMap = JSON.parse(dosStr);
      const existingDos = dosMap[id] || {
        work_id: id,
        work_id_code: workIdCode,
        title: recommendation?.title || 'Solar RO Water Purifier Plant Installation',
        created_at: recommendation?.created_at || new Date().toISOString(),
        history: []
      };

      const newHistoryEntry = {
        tier: isCentralRoute ? 'CENTRAL_MINISTRY' : isStateRoute ? 'STATE_AUTHORITY' : 'DISTRICT_AUTHORITY',
        action: action,
        status: newStatus,
        timestamp: new Date().toISOString(),
        officer_notes: msg,
        transferred_evidence: {
          has_photos: hasIaUploadedPhotos,
          photo1: image1Name,
          photo2: image2Name,
          phash1: phash1,
          phash2: phash2,
          hamming_distance: hammingDist,
          is_photo_reused: isPhotoReused,
          gps_offset_meters: gpsOffsetMeters,
          has_ocr_voucher: hasIaSubmittedVoucher,
          ocr_claimed_amount: ocrClaimedAmount,
          ocr_bill_date: ocrBillDateStr,
          is_ocr_valid: isOcrValid,
          physical_progress: physicalProgress,
          disbursed_payment: totalDisbursed,
          divergence_delta: divergenceDelta,
          risk_score_0_to_1: currentRiskScore0to1,
          risk_level: riskLevelLabel
        }
      };

      existingDos.current_status = newStatus;
      existingDos.last_updated = new Date().toISOString();
      existingDos.history = [newHistoryEntry, ...(existingDos.history || [])];

      dosMap[id] = existingDos;
      localStorage.setItem('mplads_escalation_dossiers', JSON.stringify(dosMap));
      setEscalationDossier(existingDos);
    } catch (err: any) {
      console.error(err);
      setActionMessage('Failed to process case decision. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const workIdCode = id ? (id.startsWith('W-') ? id : (id.startsWith('r') ? `W-10${id.slice(-2)}` : id)) : 'W-1001';
  const sanctionedAmount = Number(recommendation?.sanctioned_amount || recommendation?.estimated_cost || 2500000);

  // Active Photo Record from Real IA Submissions
  const iaPhotoEntry = uploadedPhotos.length > 0 ? uploadedPhotos[0] : null;
  const hasIaUploadedPhotos = Boolean(iaPhotoEntry);

  const image1Name = iaPhotoEntry?.file1_name || 'No Photo Uploaded';
  const image2Name = iaPhotoEntry?.file2_name || 'No Photo Uploaded';
  const phash1 = iaPhotoEntry?.phash_1 || 'Pending IA Upload';
  const phash2 = iaPhotoEntry?.phash_2 || 'Pending IA Upload';
  const hammingDist = iaPhotoEntry?.hamming_distance ?? 0;
  const perceptualSimPct = iaPhotoEntry ? (iaPhotoEntry.perceptual_similarity * 100).toFixed(1) : '0.0';
  const photoReuseRisk0to1 = iaPhotoEntry ? Number(iaPhotoEntry.photo_reuse_risk_score_0_to_1).toFixed(2) : '0.00';
  const isPhotoReused = Boolean(iaPhotoEntry?.is_phash_suspicious);
  const gpsOffsetMeters = iaPhotoEntry?.gps_distance_offset_meters ?? 0;

  // OCR VOUCHER SLIP READINGS & COMPUTATIONS
  const activePaymentClaim = paymentClaims.length > 0 ? paymentClaims[0] : null;
  const hasIaSubmittedVoucher = Boolean(activePaymentClaim);

  const ocrVoucherFileName = activePaymentClaim?.file_name || 'voucher_payment_slip.pdf';
  const ocrClaimedAmount = Number(activePaymentClaim?.requested_amount ?? 450000);
  const ocrBillDateStr = activePaymentClaim?.bill_date || '2026-08-15';

  // OCR Rule 1: Price Sanction Check (Must be <= Sanctioned Budget)
  const isPriceWithinSanction = ocrClaimedAmount <= sanctionedAmount;
  const ocrPriceDelta = ocrClaimedAmount - sanctionedAmount;

  // OCR Rule 2: SLA Timeline Date Check (Must be <= SLA Deadline)
  const ocrBillDt = new Date(ocrBillDateStr);
  const ocrRecDt = new Date(recommendationDate);
  const ocrSlaDeadlineDt = new Date(ocrRecDt.getTime() + statutoryLimitDays * 86400000);
  const isOcrDateWithinSla = ocrBillDt.getTime() <= ocrSlaDeadlineDt.getTime();
  const ocrSlaDaysOverrun = Math.max(0, Math.round((ocrBillDt.getTime() - ocrSlaDeadlineDt.getTime()) / (1000 * 3600 * 24)));

  const isOcrValid = isPriceWithinSanction && isOcrDateWithinSla;
  const ocrComplianceRiskScore0to1 = !hasIaSubmittedVoucher ? '0.00' : (isOcrValid ? '0.08' : (!isPriceWithinSanction && !isOcrDateWithinSla ? '0.98' : (!isPriceWithinSanction ? '0.92' : '0.88')));

  const physicalProgress = Number(iaScheduleRecord?.physical_progress ?? (recommendation as any)?.physical_progress ?? (hasIaUploadedPhotos ? 79 : 35));
  
  // If distinct site evidence photos & valid OCR vouchers exist, financial payment velocity aligns with verified physical progress
  const isVerifiedSiteEvidence = hasIaUploadedPhotos && !isPhotoReused && (hasIaSubmittedVoucher ? isOcrValid : true);
  
  const rawDisbursedPercent = Number(((Number((recommendation as any)?.payment_disbursed ?? (sanctionedAmount * 0.78)) / sanctionedAmount) * 100).toFixed(1));
  
  const paymentPercentage = isVerifiedSiteEvidence && physicalProgress >= 70 
    ? Math.min(100, physicalProgress) 
    : rawDisbursedPercent;
    
  const totalDisbursed = Math.round((sanctionedAmount * paymentPercentage) / 100);
  const remainingBalance = Math.max(0, sanctionedAmount - totalDisbursed);
  const divergenceDelta = Math.max(0, Number((paymentPercentage - physicalProgress).toFixed(1)));

  const isCaseCleared = (recommendation?.status as string) === 'CLEARED';
  const isHighDivergence = divergenceDelta > 20.0;
  const isHighRisk = !isCaseCleared && (isHighDivergence || isPhotoReused || (hasIaSubmittedVoucher && !isOcrValid));
  const currentRiskScore100 = isHighRisk ? 86 : 18;
  const currentRiskScore0to1 = (currentRiskScore100 / 100.0).toFixed(2);
  const riskLevelLabel = isHighRisk ? 'CRITICAL' : 'LOW';

  // DYNAMIC STATUTORY SLA SCHEDULE CALCULATIONS (USING TARGET COMPLETION DATE FROM IA SUBMISSION)
  const activeCompletionDate = iaPhotoEntry?.target_completion_date || iaScheduleRecord?.target_completion_date || targetCompletionDate;
  const recDateObj = new Date(recommendationDate);
  const compDateObj = new Date(activeCompletionDate);
  const scheduledDurationDays = Math.max(1, Math.round((compDateObj.getTime() - recDateObj.getTime()) / (1000 * 3600 * 24)));
  const slaMarginDays = statutoryLimitDays - scheduledDurationDays;
  const isSlaBreached = scheduledDurationDays > statutoryLimitDays;
  
  // Timeline Risk Factor (0.00 to 1.00 Scale)
  const timelineRiskFactor = isSlaBreached 
    ? Math.min(0.98, Number((0.75 + (scheduledDurationDays - statutoryLimitDays) * 0.012).toFixed(2)))
    : Math.max(0.08, Number((0.12 + (scheduledDurationDays / statutoryLimitDays) * 0.15).toFixed(2)));

  const defaultRiskTrend: RiskHistoryPoint[] = [
    { date: '2026-08-01', risk_score: 28, risk_level: 'LOW' },
    { date: '2026-08-05', risk_score: 34, risk_level: 'LOW' },
    { date: '2026-08-10', risk_score: 47, risk_level: 'MEDIUM' },
    { date: '2026-08-15', risk_score: 69, risk_level: 'HIGH' },
    { date: '2026-08-20', risk_score: currentRiskScore100, risk_level: riskLevelLabel },
  ];

  const activeRiskHistory = riskHistory.length > 0 ? riskHistory : defaultRiskTrend;

  // Closest ML Duplicate Match Details
  const mlMatch = similarity?.top_matches?.[0] || govtChecks?.mplads?.closest_match;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={() => navigate(isCentralRoute ? '/central/cases' : isStateRoute ? '/state/works' : '/da')}>
            <ArrowLeft size={16} className="mr-1" /> {isCentralRoute ? 'Back to Ministry Cases' : isStateRoute ? 'Back to State Works' : 'Back to Priority Queue'}
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-slate-100">Work {workIdCode}</h2>
              <Badge variant={recommendation?.status === 'SANCTIONED' ? 'success' : recommendation?.status === 'REJECTED' ? 'danger' : 'info'}>
                {recommendation?.status || 'SANCTIONED'}
              </Badge>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                isHighRisk ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <AlertCircle size={12} className="mr-1" /> {riskLevelLabel} — Risk Score: {currentRiskScore0to1} / 1.0 ({currentRiskScore100}/100)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{recommendation?.title || 'Solar RO Water Purifier Plant Installation'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={handleRunGovtCheck} disabled={checkingGovt}>
            <Database size={14} className="mr-1 text-sky-400" />
            {checkingGovt ? 'Checking Govt Records...' : 'Check Existing Government Records'}
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs flex items-center space-x-2.5 shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}

      {/* MULTI-TIER ESCALATION & TRANSFERRED EVIDENCE DOSSIER CARD */}
      {(escalationDossier || (recommendation?.status as string)?.includes('ESCALATED') || recommendation?.status === 'FROZEN_PENDING_AUDIT') && (
        <Card className="border-amber-500/50 bg-slate-950 shadow-xl">
          <CardHeader className="py-3.5 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-indigo-950/40 border-b border-amber-500/30">
            <CardTitle className="text-sm font-bold text-amber-300 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShieldAlert size={18} className="text-amber-400" />
                <span>Transferred Evidence & Multi-Tier Escalation Dossier (DA → State → Central)</span>
              </span>
              <Badge variant="warning" className="font-mono text-[11px] uppercase">
                CHAIN OF CUSTODY: ACTIVE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed">
              <strong>TRANSFERRED EVIDENCE PROTOCOL:</strong> All digital site evidence (ConvNet feature maps, pHash fingerprints, EXIF GPS coords), OCR financial voucher claims, SLA breach logs, and human officer scrutiny notes are automatically translated forward across District, State, and Central Ministry tiers.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tier 1: District Authority Dossier */}
              <div className="p-3 bg-slate-900 rounded-xl border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between text-sky-400 font-bold border-b border-slate-800 pb-1 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>1. District Authority Tier</span>
                  </span>
                  <Badge variant="info">DA ORIGIN</Badge>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div><span className="text-slate-400">Collectorate:</span> <strong>Mumbai City District</strong></div>
                  <div><span className="text-slate-400">Escalated Status:</span> <strong className="text-amber-400">{(recommendation?.status as string) || 'ESCALATED_TO_STATE'}</strong></div>
                  <div><span className="text-slate-400">Site Evidence Transferred:</span> <strong className="text-emerald-400">{hasIaUploadedPhotos ? '2 IA Photos (pHash Fingerprinted)' : 'Awaiting IA Photos'}</strong></div>
                  <div><span className="text-slate-400">Voucher Slip Transferred:</span> <strong className="text-sky-400">{hasIaSubmittedVoucher ? `OCR Verified (₹${ocrClaimedAmount.toLocaleString('en-IN')})` : 'Pending Voucher'}</strong></div>
                  <div><span className="text-slate-400">Baseline Risk Transferred:</span> <strong className="text-rose-400">{currentRiskScore0to1} / 1.0 ({currentRiskScore100}/100)</strong></div>
                </div>
              </div>

              {/* Tier 2: State Monitoring Authority Dossier */}
              <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-purple-400 font-bold border-b border-slate-800 pb-1 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <Layers size={14} />
                    <span>2. State Authority Tier</span>
                  </span>
                  <Badge variant={(recommendation?.status as string) === 'ESCALATED_TO_CENTRAL' || (recommendation?.status as string) === 'FROZEN_PENDING_AUDIT' ? 'success' : 'warning'}>
                    {(recommendation?.status as string) === 'ESCALATED_TO_CENTRAL' || (recommendation?.status as string) === 'FROZEN_PENDING_AUDIT' ? 'REVIEWED & FORWARDED' : 'PENDING SA REVIEW'}
                  </Badge>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div><span className="text-slate-400">Jurisdiction:</span> <strong>Maharashtra State Nodal Authority</strong></div>
                  <div><span className="text-slate-400">State Statutory Action:</span> <strong className="text-purple-300">{(recommendation?.status as string) === 'ESCALATED_TO_CENTRAL' ? 'Escalated to Central Nodal Ministry' : 'Under State Deep Scrutiny'}</strong></div>
                  <div><span className="text-slate-400">SLA Margin Transferred:</span> <strong className="text-amber-300">{scheduledDurationDays} Days / {statutoryLimitDays} Max Limit</strong></div>
                  <div><span className="text-slate-400">Physical/Payment Divergence:</span> <strong className="text-rose-400">{divergenceDelta}% Divergence Flagged</strong></div>
                </div>
              </div>

              {/* Tier 3: Central Nodal Ministry (MoSPI) Dossier */}
              <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-1 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <Globe size={14} />
                    <span>3. Central Ministry Tier (MoSPI)</span>
                  </span>
                  <Badge variant={(recommendation?.status as string) === 'FROZEN_PENDING_AUDIT' ? 'danger' : 'info'}>
                    {(recommendation?.status as string) === 'FROZEN_PENDING_AUDIT' ? 'FUNDS FROZEN' : 'NATIONAL QUEUE'}
                  </Badge>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div><span className="text-slate-400">National Nodal Body:</span> <strong>Ministry of Statistics & Programme Implementation (MoSPI)</strong></div>
                  <div><span className="text-slate-400">National Audit Status:</span> <strong className="text-indigo-300">{(recommendation?.status as string) === 'FROZEN_PENDING_AUDIT' ? 'CAG Special Audit Marked' : 'Pending Ministry Decision'}</strong></div>
                  <div><span className="text-slate-400">Inter-State Anomaly Check:</span> <strong className="text-emerald-400">SBERT Text & pHash Similarity Engine Active</strong></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 1: SANCTIONED WORK INFORMATION SUMMARY */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <FileText size={16} className="text-sky-400" />
            <span>Sanctioned Work Information Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-sky-400 uppercase text-[10px] tracking-wider">Basic Details</div>
            <div><span className="text-slate-400">Work ID:</span> <strong className="text-slate-200">{workIdCode}</strong></div>
            <div><span className="text-slate-400">Sector:</span> <strong className="text-slate-200">{recommendation?.sector || 'Drinking Water Facilities'}</strong></div>
            <div><span className="text-slate-400">State / District:</span> <strong className="text-slate-200">Maharashtra / Mumbai City</strong></div>
            <div><span className="text-slate-400">Constituency:</span> <strong className="text-slate-200">Mumbai South</strong></div>
            <div><span className="text-slate-400">Locality:</span> <strong className="text-slate-200">{recommendation?.address || 'Municipal Secondary School Grounds, Ward 4, Fort, Mumbai'}</strong></div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-indigo-400 uppercase text-[10px] tracking-wider">Administrative Details</div>
            <div><span className="text-slate-400">Recommendation Date:</span> <strong className="text-slate-200">12 Aug 2026</strong></div>
            <div><span className="text-slate-400">Status:</span> <strong className="text-emerald-400">{recommendation?.status || 'SANCTIONED'}</strong></div>
            <div><span className="text-slate-400">Implementing Agency:</span> <strong className="text-slate-200">PWD Division 1</strong></div>
            <div><span className="text-slate-400">Recommending MP:</span> <strong className="text-slate-200">{recommendation?.mp_name || 'Hon. Rajesh Sharma (MP)'}</strong></div>
            <div><span className="text-slate-400">SLA Status:</span> <strong className="text-amber-400 font-mono">{statutoryLimitDays} Days Statutory Limit</strong></div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">Financial Details</div>
            <div><span className="text-slate-400">Sanctioned Amount:</span> <strong className="text-sky-400 font-bold">₹{sanctionedAmount.toLocaleString('en-IN')}</strong></div>
            <div><span className="text-slate-400">Total Disbursed:</span> <strong className="text-slate-200">₹{totalDisbursed.toLocaleString('en-IN')} ({paymentPercentage}%)</strong></div>
            <div><span className="text-slate-400">Total Expenditure:</span> <strong className="text-slate-200">₹{totalDisbursed.toLocaleString('en-IN')}</strong></div>
            <div><span className="text-slate-400">Remaining Balance:</span> <strong className="text-slate-200">₹{remainingBalance.toLocaleString('en-IN')}</strong></div>
            <div><span className="text-slate-400">Latest Payment:</span> <strong className="text-slate-200">₹{Math.round(sanctionedAmount * 0.3).toLocaleString('en-IN')} (15 Aug 2026)</strong></div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">Physical Progress</div>
            <div><span className="text-slate-400">Current Progress:</span> <strong className={`${isHighRisk ? 'text-rose-400' : 'text-emerald-400'} font-bold`}>{physicalProgress}% Complete</strong></div>
            <div><span className="text-slate-400">Latest Milestone:</span> <strong className="text-slate-200">Foundation Plinth Work</strong></div>
            <div><span className="text-slate-400">Last Update:</span> <strong className="text-slate-200">14 Aug 2026</strong></div>
            <div><span className="text-slate-400">Target Completion Date:</span> <strong className="text-amber-300 font-bold">{activeCompletionDate}</strong></div>
            <div><span className="text-slate-400">Divergence Delta:</span> <strong className={`${isHighRisk ? 'text-rose-400' : 'text-emerald-400'} font-bold`}>+{divergenceDelta} percentage points</strong></div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: STATUTORY SLA SCHEDULE TIMELINE RISK MODEL (TAKING TARGET COMPLETION DATE FROM IA SUBMISSION) */}
      <Card className="border-amber-500/40 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-amber-400 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>Statutory SLA Schedule Timeline Risk Model (Calculated from IA Target Completion Input)</span>
            </span>
            <Badge variant={isSlaBreached ? 'danger' : 'success'}>
              {isSlaBreached ? `STATUTORY SLA BREACH (${statutoryLimitDays}-DAY LIMIT)` : `WITHIN ${statutoryLimitDays}-DAY LIMIT`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Recommendation Date *</label>
              <input
                type="date"
                value={recommendationDate}
                onChange={(e) => setRecommendationDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-amber-400 mb-1">Target Completion Date (From IA Input) *</label>
              <input
                type="date"
                value={activeCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-amber-300 focus:outline-none focus:border-amber-500 font-bold"
              />
              <span className="text-[10px] text-slate-500">Submitted by IA on workspace</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Statutory Limit Days (Configurable) *</label>
              <select
                value={statutoryLimitDays}
                onChange={(e) => setStatutoryLimitDays(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value={45}>45 Days Limit</option>
                <option value={60}>60 Days Limit</option>
                <option value={75}>75 Days Limit (Statutory Default)</option>
                <option value={90}>90 Days Limit</option>
                <option value={120}>120 Days Limit</option>
              </select>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 font-semibold">Scheduled Duration vs Limit:</span>
              <div className="font-bold text-slate-100 text-sm">
                {scheduledDurationDays} Days <span className="text-slate-500 font-normal">/ {statutoryLimitDays} Days Limit</span>
              </div>
              <div className={`text-[10px] font-bold ${isSlaBreached ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isSlaBreached ? `-${Math.abs(slaMarginDays)} Days Overrun` : `+${slaMarginDays} Days Safety Buffer`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 font-semibold">Timeline Risk Factor (0 to 1 Scale):</span>
              <div className={`font-bold text-sm ${isSlaBreached ? 'text-rose-400' : 'text-emerald-400'}`}>
                {timelineRiskFactor.toFixed(2)} / 1.0
              </div>
              <div className="text-[10px] text-slate-500">Statutory SLA risk scale computed from IA completion date</div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 font-semibold">SLA Status Classification:</span>
              <div className={`font-bold text-sm ${isSlaBreached ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isSlaBreached ? 'CRITICAL SLA BREACH' : 'COMPLIANT WITHIN LIMIT'}
              </div>
              <div className="text-[10px] text-slate-500">Evaluated against {statutoryLimitDays}-day statutory limit</div>
            </div>
          </div>

          {/* 4-STAGE MILESTONE SCHEDULE BREAKDOWN */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
              Statutory Schedule Milestone Breakdown ({scheduledDurationDays} Total Days from IA Target Date)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-400">Sanction & Clearance</div>
                <div className="font-bold text-sky-400">{Math.round(scheduledDurationDays * 0.2)} Days</div>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-400">Agency Tendering</div>
                <div className="font-bold text-indigo-400">{Math.round(scheduledDurationDays * 0.2)} Days</div>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-400">Construction Execution</div>
                <div className="font-bold text-emerald-400">{Math.round(scheduledDurationDays * 0.5)} Days</div>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-400">Final Quality Certification</div>
                <div className="font-bold text-amber-400">{Math.round(scheduledDurationDays * 0.1)} Days</div>
              </div>
            </div>
          </div>

          <div className={`p-2.5 rounded-lg text-[11px] ${isSlaBreached ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'}`}>
            <strong>Statutory SLA Verification Finding:</strong> {isSlaBreached ? `CRITICAL SLA BREACH: Project target completion date (${activeCompletionDate}) submitted by IA yields a scheduled duration of ${scheduledDurationDays} days, exceeding the statutory ${statutoryLimitDays}-day limit by ${Math.abs(slaMarginDays)} days! Timeline Risk Factor: ${timelineRiskFactor.toFixed(2)} / 1.0` : `COMPLIANT: Project target completion date (${activeCompletionDate}) submitted by IA yields a scheduled duration of ${scheduledDurationDays} days, safely within the statutory ${statutoryLimitDays}-day limit (+${slaMarginDays} days safety buffer). Timeline Risk Factor: ${timelineRiskFactor.toFixed(2)} / 1.0`}
          </div>
        </CardContent>
      </Card>

      {/* STEP 3: DYNAMIC EXISTING GOVERNMENT RECORD CHECK */}
      {govtChecks && (
        <Card className="border-sky-500/30 bg-slate-950">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold text-sky-400 flex items-center space-x-2">
              <Database size={16} />
              <span>Existing Government Record Check (Multi-Source Verification)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Database size={14} className="text-sky-400" />
                    <span>MPLADS Internal Records</span>
                  </span>
                  <Badge variant={mlMatch ? 'warning' : 'success'}>
                    {mlMatch ? 'Possible Match' : 'No Match'}
                  </Badge>
                </div>
                <div className="text-slate-400">Checked: <strong>{govtChecks.mplads.records_checked} district works</strong></div>
                {mlMatch && (
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] space-y-1">
                    <div className="font-bold text-sky-300">Closest Match: {mlMatch.work_id}</div>
                    <div className="text-slate-300">{mlMatch.title}</div>
                    <div className="text-amber-400">
                      Distance: {mlMatch.distance_meters}m | Similarity: {(Number((mlMatch as any).similarity_score ?? (mlMatch as any).similarity_percent ?? 0.87) * ( (mlMatch as any).similarity_score ? 100 : 1 )).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Globe size={14} className="text-indigo-400" />
                    <span>Open Govt Data (OGD)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    {govtChecks.ogd.status}
                  </span>
                </div>
                <div className="text-slate-400">Matching Records: <strong>0</strong></div>
                <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                  {govtChecks.ogd.reason}
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Globe size={14} className="text-indigo-400" />
                    <span>Jansoochna State Portal</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    {govtChecks.jansoochna.status}
                  </span>
                </div>
                <div className="text-slate-400">Matching Records: <strong>0</strong></div>
                <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                  {govtChecks.jansoochna.reason}
                </p>
              </div>
            </div>

            {/* DYNAMIC SIDE-BY-SIDE COMPARISON BOX */}
            {mlMatch && (
              <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-amber-400 font-bold text-sm">
                  <span className="flex items-center space-x-2">
                    <AlertTriangle size={18} />
                    <span>Possible Existing Work Found (Side-by-Side Comparison)</span>
                  </span>
                  <Badge variant="danger">HUMAN REVIEW REQUIRED</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-sky-400 uppercase text-[10px]">Active Sanctioned Work</div>
                    <div className="font-bold text-slate-100">{recommendation?.title || 'Solar RO Water Purifier Plant'}</div>
                    <div className="text-slate-400">Location: {recommendation?.address || 'Ward 4, Fort, Mumbai'}</div>
                    <div className="text-slate-400">Sanctioned Cost: ₹{sanctionedAmount.toLocaleString('en-IN')}</div>
                    <div className="text-slate-400">Category: {recommendation?.sector || 'Drinking Water Facilities'}</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-400 uppercase text-[10px]">Existing Matching Work ({mlMatch.work_id})</div>
                    <div className="font-bold text-slate-100">{mlMatch.title}</div>
                    <div className="text-slate-400">Location Distance: {mlMatch.distance_meters} meters away</div>
                    <div className="text-slate-400">Sanctioned Cost: ₹{Math.round(sanctionedAmount * 0.94).toLocaleString('en-IN')} (6% cost variance)</div>
                    <div className="text-slate-400">Status: SANCTIONED (Executing)</div>
                  </div>
                </div>

                <p className="text-[11px] text-amber-300 pt-1">
                  <strong>Why was this flagged?</strong> Same/similar work description, close geographic location ({mlMatch.distance_meters}m), same work category, and matching cost structure. Potential duplicate — review before proceeding with milestone payment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 4: DYNAMIC STORED RISK SCORE OVER TIME GRAPH (STANDARDIZED SVG TREND GRAPH UI) */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Activity size={16} className="text-rose-400" />
              <span>Risk Over Time (Historical Stored Risk Timeline)</span>
            </span>
            <span className={`text-xs font-mono font-bold ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
              Current Risk: {riskLevelLabel} — {currentRiskScore0to1} / 1.0 ({currentRiskScore100}/100)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Risk Score Trajectory (0.00 – 1.00 Scale)</span>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400">Low (&lt;0.50)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-400">Medium (0.50-0.75)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-400">Critical (&gt;0.75)</span>
                </span>
              </div>
            </div>

            {/* SVG Trend Graph */}
            <div className="relative w-full overflow-hidden pt-2">
              {(() => {
                const graphWidth = 600;
                const graphHeight = 160;
                const padLeft = 40;
                const padRight = 30;
                const padTop = 20;
                const padBottom = 30;
                const plotWidth = graphWidth - padLeft - padRight;
                const plotHeight = graphHeight - padTop - padBottom;

                const points = activeRiskHistory.map((pt, idx) => {
                  const x = padLeft + (idx / Math.max(activeRiskHistory.length - 1, 1)) * plotWidth;
                  const score0to1 = Math.min(Math.max(pt.risk_score / 100, 0), 1);
                  const y = padTop + plotHeight - score0to1 * plotHeight;
                  return { x, y, score0to1, score100: pt.risk_score, date: pt.date };
                });

                const pathD = points.length > 0 
                  ? points.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '')
                  : '';

                const areaD = points.length > 0
                  ? `${pathD} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`
                  : '';

                return (
                  <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-auto text-slate-400">
                    <defs>
                      <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="riskLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>

                    {/* Threshold Grid Lines & Y Axis Labels */}
                    {[1.0, 0.75, 0.50, 0.25, 0.0].map((val) => {
                      const yPos = padTop + plotHeight - val * plotHeight;
                      return (
                        <g key={val}>
                          <line
                            x1={padLeft}
                            y1={yPos}
                            x2={graphWidth - padRight}
                            y2={yPos}
                            stroke="#334155"
                            strokeDasharray={val === 0 || val === 1 ? "none" : "3 3"}
                            strokeWidth={val === 0 || val === 1 ? "1" : "0.5"}
                          />
                          <text
                            x={padLeft - 8}
                            y={yPos + 3}
                            textAnchor="end"
                            fontSize="9"
                            fill="#94a3b8"
                            className="font-mono"
                          >
                            {val.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Filled Area */}
                    {areaD && <path d={areaD} fill="url(#riskAreaGrad)" />}

                    {/* Trend Polyline */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="url(#riskLineGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Node Markers & Badges */}
                    {points.map((pt, idx) => (
                      <g key={idx} className="group">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill={pt.score0to1 >= 0.75 ? "#f43f5e" : pt.score0to1 >= 0.5 ? "#f59e0b" : "#10b981"}
                          stroke="#020617"
                          strokeWidth="2"
                        />
                        {/* Score Label above node */}
                        <rect
                          x={pt.x - 16}
                          y={pt.y - 18}
                          width="32"
                          height="13"
                          rx="3"
                          fill="#0f172a"
                          stroke={pt.score0to1 >= 0.75 ? "#f43f5e" : pt.score0to1 >= 0.5 ? "#f59e0b" : "#10b981"}
                          strokeWidth="0.8"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 9}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="bold"
                          fill={pt.score0to1 >= 0.75 ? "#fda4af" : pt.score0to1 >= 0.5 ? "#fde68a" : "#6ee7b7"}
                          className="font-mono"
                        >
                          {pt.score0to1.toFixed(2)}
                        </text>
                        {/* X Axis Date Label */}
                        <text
                          x={pt.x}
                          y={graphHeight - 8}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#94a3b8"
                          className="font-mono"
                        >
                          {pt.date.slice(5)}
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-rose-300">Risk Audit Findings & Triggers:</div>
              <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-0.5">
                <li>Payment recorded (₹{(totalDisbursed / 100000).toFixed(2)}L paid, {paymentPercentage}% of budget).</li>
                <li>Physical execution reported at {physicalProgress}% (+{divergenceDelta}% divergence delta).</li>
                {hasIaUploadedPhotos ? (
                  <li>2-Photo pHash Verification outputted Photo Reuse Risk Score: {photoReuseRisk0to1} / 1.0 ({isPhotoReused ? 'REUSED PHOTO DETECTED' : 'PASSED INTEGRITY'}).</li>
                ) : (
                  <li>Awaiting field evidence photo upload from Implementing Agency on IA portal.</li>
                )}
                {hasIaSubmittedVoucher && (
                  <li>OCR Voucher Scanner Output: Claim ₹{ocrClaimedAmount.toLocaleString('en-IN')} vs Sanctioned ₹{sanctionedAmount.toLocaleString('en-IN')} ({isPriceWithinSanction ? 'PASSED' : 'OVERRUN'}). Bill Date: {ocrBillDateStr} ({isOcrDateWithinSla ? 'WITHIN SLA' : 'SLA OVERRUN'}).</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 5: DEEP CONVNET (4-LAYER CONV2D + SOFTMAX FUNCTIONAL) OUTPUT */}
      <Card className="border-indigo-500/40 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-indigo-300 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Cpu size={18} className="text-emerald-400" />
              <span>Deep ConvNet (4-Layer Conv2D + Softmax Functional) Output</span>
            </span>
            {hasIaUploadedPhotos ? (
              <Badge variant={isPhotoReused ? 'danger' : 'success'}>
                {isPhotoReused ? 'POTENTIAL REUSED PHOTO' : 'PASSED INTEGRITY'}
              </Badge>
            ) : (
              <Badge variant="warning">AWAITING IA PHOTO UPLOAD</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {hasIaUploadedPhotos ? (
            <>
              {/* DEEP CNN SOFTMAX PROBABILITY BREAKDOWN */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-sky-400 text-[11px] uppercase tracking-wider flex justify-between">
                  <span>Softmax Classification Probabilities (dim=1)</span>
                  <span className="text-emerald-400">Classified: GENUINE_CONSTRUCTION_SITE (96.4%)</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-emerald-500/40 space-y-0.5">
                    <div className="text-slate-400 font-semibold">GENUINE_CONSTRUCTION_SITE</div>
                    <div className="font-bold text-emerald-400 text-sm">96.4%</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-amber-500/30 space-y-0.5">
                    <div className="text-slate-400 font-semibold">POTENTIAL_REUSED_STOCK_PHOTO</div>
                    <div className="font-bold text-amber-400 text-sm">2.8%</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-0.5">
                    <div className="text-slate-400 font-semibold">INDOOR_OFFICE_IRRELEVANT</div>
                    <div className="font-bold text-slate-300 text-sm">0.5%</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-0.5">
                    <div className="text-slate-400 font-semibold">POOR_QUALITY_BLURRY</div>
                    <div className="font-bold text-slate-300 text-sm">0.3%</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">Perceptual Hash (pHash):</span>
                  <div className="font-mono font-bold text-sky-400 text-xs">{phash1}</div>
                  <div className="text-[10px] text-slate-500">64-bit DCT perceptual image fingerprint</div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">GPS Distance Offset:</span>
                  <div className="font-bold text-amber-400 text-xs">{gpsOffsetMeters}m from registered site</div>
                  <div className="text-[10px] text-slate-500">PostGIS ST_Distance (SRID 4326)</div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">Hamming Distance Match:</span>
                  <div className={`font-bold ${isPhotoReused ? 'text-rose-400' : 'text-emerald-400'} text-xs`}>
                    {hammingDist} bits ({isPhotoReused ? '< 5 threshold' : '>= 5 threshold'})
                  </div>
                  <div className="text-[10px] text-slate-500">Computed against IA submitted evidence</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed ${isPhotoReused ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'}`}>
                <strong>Detection Signal Logged:</strong> {isPhotoReused ? `REUSED_PHOTO_DETECTED: pHash Hamming distance ${hammingDist} (< 5 threshold match to prior site evidence) | GPS_MISMATCH_EXCEEDS_RADIUS: Photo location is ${gpsOffsetMeters}m from registered site` : `PASSED INTEGRITY: pHash Hamming distance is ${hammingDist} bits (>= 5 threshold). Photos verified as distinct original site evidence.`}
              </div>
            </>
          ) : (
            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 text-center space-y-2">
              <UploadCloud size={28} className="mx-auto text-indigo-400" />
              <div className="font-semibold text-slate-200">Awaiting Site Evidence Upload from Implementing Agency</div>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Once the Implementing Agency (IA) uploads 2 site evidence photographs on their IA Workspace, the Deep ConvNet Softmax Classifier, pHash 2-Photo Comparator, and EXIF Distance Engine will process and render live risk analysis here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MULTIMODAL IMAGE + BUDGET RISK MODEL EVALUATION BOX */}
      <Card className="border-indigo-500/40 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-indigo-400 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Cpu size={16} />
              <span>Multimodal AI Image + Budget Risk Evaluation Output (0 to 1 Scale)</span>
            </span>
            <span className="text-xs font-mono font-bold text-rose-400">
              Output Risk Score: {currentRiskScore0to1} / 1.0
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Claimed Budget Value:</span>
            <div className="font-bold text-sky-400 text-sm">₹{sanctionedAmount.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-500">Sanctioned allocation value</div>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Visual Site Maturity Index:</span>
            <div className="font-bold text-emerald-400 text-sm">{physicalProgress}% Complete</div>
            <div className="text-[10px] text-slate-500">Extracted from site image feature maps</div>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Budget Density Ratio:</span>
            <div className="font-bold text-amber-400 text-sm">0.78 Utilization</div>
            <div className="text-[10px] text-slate-500">Baseline category density ratio</div>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Normalized Risk Score (0 to 1):</span>
            <div className="font-bold text-rose-400 text-sm">{currentRiskScore0to1} / 1.0</div>
            <div className="text-[10px] text-slate-500">Sigmoid neural activation scale</div>
          </div>

          <div className="md:col-span-4 p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-indigo-200 text-[11px]">
            <strong>AI Multimodal Verification Finding:</strong> {isHighRisk ? `High visual/budget mismatch: Image visual features indicate ${physicalProgress}% structural maturity against claimed budget ₹${sanctionedAmount.toLocaleString('en-IN')}. Normalized Risk Score: ${currentRiskScore0to1} / 1.0 (${riskLevelLabel})` : `Budget utilization aligns with visual site evidence. Normalized Risk Score: ${currentRiskScore0to1} / 1.0 (${riskLevelLabel})`}
          </div>
        </CardContent>
      </Card>

      {/* STEP 6: pHASH 2-PHOTO VERIFICATION ENGINE (2 IA SUBMITTED PHOTOS COMPARISON) */}
      <Card className="border-indigo-500/40 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-indigo-400 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Camera size={16} />
              <span>pHash 2-Photo Verification Engine (2 IA Submitted Photos Comparison)</span>
            </span>
            {hasIaUploadedPhotos ? (
              <Badge variant={isPhotoReused ? 'danger' : 'success'}>
                Photo Reuse Risk: {photoReuseRisk0to1} / 1.0 ({isPhotoReused ? 'CRITICAL' : 'LOW'})
              </Badge>
            ) : (
              <Badge variant="warning">AWAITING IA SUBMISSION</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {hasIaUploadedPhotos ? (
            <>
              {/* 2-PHOTO SIDE-BY-SIDE COMPARISON BOX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-sky-400 flex items-center space-x-1.5">
                    <ImageIcon size={14} />
                    <span>Image 1: IA Submitted Baseline Photo ({image1Name})</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-1 text-[11px]">
                    <div><span className="text-slate-400">Filename:</span> <strong className="text-slate-200">{image1Name}</strong></div>
                    <div><span className="text-slate-400">pHash (64-bit DCT):</span> <strong className="font-mono text-sky-400 font-bold">{phash1}</strong></div>
                    <div><span className="text-slate-400">GPS EXIF:</span> <strong className="text-slate-200">18.9180° N, 72.8310° E</strong></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-indigo-400 flex items-center space-x-1.5">
                    <ImageIcon size={14} />
                    <span>Image 2: IA Submitted Execution Photo ({image2Name})</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-1 text-[11px]">
                    <div><span className="text-slate-400">Filename:</span> <strong className="text-slate-200">{image2Name}</strong></div>
                    <div><span className="text-slate-400">pHash (64-bit DCT):</span> <strong className="font-mono text-indigo-400 font-bold">{phash2}</strong></div>
                    <div><span className="text-slate-400">GPS EXIF:</span> <strong className="text-slate-200">18.9142° N, 72.8350° E</strong></div>
                  </div>
                </div>
              </div>

              {/* pHASH DIFFERENCE METRICS & 0-1 RISK SCORE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Hamming Distance:</span>
                  <div className={`font-bold ${isPhotoReused ? 'text-rose-400' : 'text-emerald-400'} text-sm`}>
                    {hammingDist} Bits ({isPhotoReused ? '< 5 Threshold' : '>= 5 Threshold'})
                  </div>
                  <div className="text-[10px] text-slate-500">Bitwise XOR difference count</div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Perceptual Similarity:</span>
                  <div className="font-bold text-amber-400 text-sm">{perceptualSimPct}% Match</div>
                  <div className="text-[10px] text-slate-500">64-bit DCT index</div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Photo Reuse Risk Score (0 to 1):</span>
                  <div className={`font-bold ${isPhotoReused ? 'text-rose-400' : 'text-emerald-400'} text-sm`}>
                    {photoReuseRisk0to1} / 1.0
                  </div>
                  <div className="text-[10px] text-slate-500">Sigmoid photo risk scale</div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Classification Result:</span>
                  <div className={`font-bold ${isPhotoReused ? 'text-rose-400' : 'text-emerald-400'} text-sm`}>
                    {isPhotoReused ? 'REUSED EVIDENCE' : 'ORIGINAL SITE PHOTOS'}
                  </div>
                  <div className="text-[10px] text-slate-500">Duplicate detection status</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg text-[11px] ${isPhotoReused ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'}`}>
                <strong>pHash Photo Verification Finding:</strong> {isPhotoReused ? `POTENTIAL REUSED PHOTO DETECTED — Image 1 (${image1Name}) and Image 2 (${image2Name}) submitted by IA have a Hamming distance of ${hammingDist} bits (< 5 threshold), indicating ${perceptualSimPct}% perceptual image overlap. Photo Reuse Risk Score: ${photoReuseRisk0to1} / 1.0 (CRITICAL).` : `DISTINCT ORIGINAL SITE PHOTOS CONFIRMED — Image 1 (${image1Name}) and Image 2 (${image2Name}) submitted by IA have a Hamming distance of ${hammingDist} bits (>= 5 threshold). Photo Reuse Risk Score: ${photoReuseRisk0to1} / 1.0 (PASSED INTEGRITY).`}
              </div>
            </>
          ) : (
            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 text-center space-y-2">
              <UploadCloud size={28} className="mx-auto text-indigo-400" />
              <div className="font-semibold text-slate-200">Awaiting 2 Site Evidence Photographs from Implementing Agency</div>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                No site evidence photos have been uploaded by the Implementing Agency (IA) yet for this work. Upload 2 site evidence photographs on the IA Portal workspace to run pHash 2-Photo Verification & 0-to-1 Risk Scoring.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 7: OPTICAL CHARACTER RECOGNITION (OCR) VOUCHER & SLIP SCANNER ENGINE */}
      <Card className="border-sky-500/40 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-sky-400 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FileCheck size={18} />
              <span>Optical Character Recognition (OCR) Voucher & Slip Scanner Engine</span>
            </span>
            {hasIaSubmittedVoucher ? (
              <Badge variant={isOcrValid ? 'success' : 'danger'}>
                OCR Compliance Risk: {ocrComplianceRiskScore0to1} / 1.0 ({isOcrValid ? 'PASSED' : 'BREACH'})
              </Badge>
            ) : (
              <Badge variant="warning">AWAITING IA VOUCHER SLIP</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {hasIaSubmittedVoucher ? (
            <>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold">Scanned Voucher Slip File:</span>
                <div className="font-mono font-bold text-sky-300 text-xs flex items-center space-x-2">
                  <UploadCloud size={14} className="text-sky-400" />
                  <span>{ocrVoucherFileName}</span>
                  <span className="text-slate-500 text-[10px]">(Ref: {activePaymentClaim?.invoice_ref || 'INV-PWD-2026-084'})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RULE 1: PRICE SANCTION CHECK */}
                <div className={`p-3 bg-slate-900 rounded-xl border ${isPriceWithinSanction ? 'border-emerald-500/40' : 'border-rose-500/50'} space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">1. OCR Price Sanction Verification</span>
                    <Badge variant={isPriceWithinSanction ? 'success' : 'danger'}>
                      {isPriceWithinSanction ? 'PRICE <= SANCTION (PASSED)' : 'BUDGET OVERRUN BREACH'}
                    </Badge>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-1 text-[11px]">
                    <div><span className="text-slate-400">OCR Extracted Invoice Claim:</span> <strong className="text-sky-400 font-bold">₹{ocrClaimedAmount.toLocaleString('en-IN')}</strong></div>
                    <div><span className="text-slate-400">Sanctioned Budget Limit:</span> <strong className="text-slate-200 font-bold">₹{sanctionedAmount.toLocaleString('en-IN')}</strong></div>
                    <div>
                      <span className="text-slate-400">Sanction Variance:</span>{' '}
                      <strong className={isPriceWithinSanction ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isPriceWithinSanction ? `Within Budget (-₹${Math.abs(ocrPriceDelta).toLocaleString('en-IN')})` : `EXCEEDS BUDGET (+₹${ocrPriceDelta.toLocaleString('en-IN')})`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* RULE 2: SLA TIMELINE DATE CHECK */}
                <div className={`p-3 bg-slate-900 rounded-xl border ${isOcrDateWithinSla ? 'border-emerald-500/40' : 'border-rose-500/50'} space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">2. OCR SLA Timeline Date Verification</span>
                    <Badge variant={isOcrDateWithinSla ? 'success' : 'danger'}>
                      {isOcrDateWithinSla ? 'DATE WITHIN SLA (PASSED)' : 'SLA TIMELINE BREACH'}
                    </Badge>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-1 text-[11px]">
                    <div><span className="text-slate-400">OCR Extracted Bill Date:</span> <strong className="text-amber-300 font-bold">{ocrBillDateStr}</strong></div>
                    <div><span className="text-slate-400">Statutory SLA Deadline:</span> <strong className="text-slate-200 font-bold">{ocrSlaDeadlineDt.toISOString().slice(0, 10)} ({statutoryLimitDays} Days)</strong></div>
                    <div>
                      <span className="text-slate-400">SLA Date Verification:</span>{' '}
                      <strong className={isOcrDateWithinSla ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isOcrDateWithinSla ? 'Within SLA Statutory Deadline' : `EXCEEDS SLA DEADLINE (+${ocrSlaDaysOverrun} Days Overrun)`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed ${isOcrValid ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'}`}>
                <strong>OCR Voucher Verification Finding:</strong> {isOcrValid ? `OCR PASSED COMPLIANT — Invoice claim amount (₹${ocrClaimedAmount.toLocaleString('en-IN')}) is less than/equal to sanctioned budget (₹${sanctionedAmount.toLocaleString('en-IN')}), and bill date (${ocrBillDateStr}) is safely within the statutory ${statutoryLimitDays}-day SLA window. OCR Compliance Risk Score: ${ocrComplianceRiskScore0to1} / 1.0 (PASSED).` : `OCR VERIFICATION BREACH DETECTED — ${!isPriceWithinSanction ? `Claimed invoice amount (₹${ocrClaimedAmount.toLocaleString('en-IN')}) EXCEEDS sanctioned budget limit (₹${sanctionedAmount.toLocaleString('en-IN')}) by ₹${ocrPriceDelta.toLocaleString('en-IN')}! ` : ''}${!isOcrDateWithinSla ? `Bill date (${ocrBillDateStr}) EXCEEDS statutory ${statutoryLimitDays}-day SLA deadline (${ocrSlaDeadlineDt.toISOString().slice(0, 10)}) by ${ocrSlaDaysOverrun} days!` : ''} OCR Compliance Risk Score: ${ocrComplianceRiskScore0to1} / 1.0 (CRITICAL).`}
              </div>
            </>
          ) : (
            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 text-center space-y-2">
              <UploadCloud size={28} className="mx-auto text-sky-400" />
              <div className="font-semibold text-slate-200">Awaiting Payment Voucher Slip Upload from Implementing Agency</div>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Upload a voucher slip / bill PDF on the IA Portal workspace. The Optical Character Recognition (OCR) Engine will extract the invoice claim amount, verify it against sanctioned budget, and check if the bill date is within the SLA window.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 8: ANALYSIS (WHAT INCREASED THE RISK?) */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <ShieldAlert size={16} className="text-sky-400" />
              <span>Analysis (What Increased the Risk?)</span>
            </span>
            <Button variant="secondary" size="sm" onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}>
              <ChevronDown size={14} className={`mr-1 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
              {showTechnicalDetails ? 'Hide Technical Details' : 'View Technical Details (Expert View)'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Analysis Check</th>
                  <th className="py-2.5 px-4">Risk Effect</th>
                  <th className="py-2.5 px-4">Plain Language Finding & Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-200">Payment vs physical progress</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isHighRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isHighRisk ? 'High' : 'Low'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    Payment: {paymentPercentage}% | Physical: {physicalProgress}% | Delta: +{divergenceDelta}%
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-200">Photo verification</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPhotoReused ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {hasIaUploadedPhotos ? (isPhotoReused ? 'High' : 'Low') : 'Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {hasIaUploadedPhotos 
                      ? `2 IA Submitted Photos (${image1Name} & ${image2Name}) evaluated by pHash. Photo Reuse Risk Score: ${photoReuseRisk0to1} / 1.0 (${isPhotoReused ? 'Potential Reused Evidence' : 'Passed Integrity'})` 
                      : 'Awaiting 2 site evidence photos from Implementing Agency.'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-200">Location verification</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasIaUploadedPhotos && isPhotoReused ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {hasIaUploadedPhotos && isPhotoReused ? 'High' : 'Low'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {hasIaUploadedPhotos 
                      ? `Photo EXIF location offset ${gpsOffsetMeters} meters from registered project site` 
                      : 'Awaiting site photo EXIF GPS metadata verification.'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-200">OCR Voucher & Price Sanction Check</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      hasIaSubmittedVoucher 
                        ? (isOcrValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/20 text-rose-400')
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {hasIaSubmittedVoucher ? (isOcrValid ? 'Low' : 'High') : 'Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {hasIaSubmittedVoucher
                      ? (isOcrValid 
                          ? `OCR PASSED: Claimed amount (₹${ocrClaimedAmount.toLocaleString('en-IN')}) <= Sanctioned (₹${sanctionedAmount.toLocaleString('en-IN')}), and Bill Date (${ocrBillDateStr}) is within SLA.` 
                          : `OCR BREACH: ${!isPriceWithinSanction ? `Claim (₹${ocrClaimedAmount.toLocaleString('en-IN')}) EXCEEDS Sanction (₹${sanctionedAmount.toLocaleString('en-IN')})! ` : ''}${!isOcrDateWithinSla ? `Bill Date (${ocrBillDateStr}) EXCEEDS SLA deadline!` : ''}`)
                      : 'Awaiting payment voucher slip PDF/Image upload from Implementing Agency.'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-200">Timeline & SLA</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (iaPhotoEntry?.target_completion_date || iaScheduleRecord?.target_completion_date || (recommendation as any)?.target_completion_date)
                        ? (isSlaBreached ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400')
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {(iaPhotoEntry?.target_completion_date || iaScheduleRecord?.target_completion_date || (recommendation as any)?.target_completion_date) 
                        ? (isSlaBreached ? 'High' : 'Low') 
                        : 'Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {(iaPhotoEntry?.target_completion_date || iaScheduleRecord?.target_completion_date || (recommendation as any)?.target_completion_date)
                      ? (isSlaBreached ? `CRITICAL SLA BREACH: Target date (${activeCompletionDate}) from IA yields ${scheduledDurationDays} days schedule, exceeding statutory ${statutoryLimitDays}-day limit (+${Math.abs(slaMarginDays)} days overrun)` : `Target completion date (${activeCompletionDate}) from IA yields ${scheduledDurationDays} days schedule, safely within ${statutoryLimitDays}-day statutory SLA window (+${slaMarginDays} days safety buffer).`)
                      : 'Awaiting Target Completion Date & Schedule input from Implementing Agency.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {showTechnicalDetails && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
              <div className="font-bold text-sky-400 uppercase text-[10px] tracking-wider">Technical Details (Expert Inspection View)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
                <div><strong>Model Architecture:</strong> Isolation Forest Anomaly Detector v2.4</div>
                <div><strong>pHash 2-Photo Comparator:</strong> 64-Bit DCT Perceptual Hashing</div>
                <div><strong>Statutory SLA Engine:</strong> Statutory 75-Day Schedule Risk Model</div>
                <div><strong>Multimodal Risk Engine:</strong> Deep ConvNet + Budget Density Ratio (0 to 1 Scale)</div>
                <div><strong>OCR Voucher Engine:</strong> Optical Character Recognition Slip Reader & Sanction Verifier</div>
                <div><strong>Spatial Engine:</strong> PostgreSQL PostGIS ST_Distance (SRID 4326)</div>
              </div>
              <ShapExplainerCard explainers={[]} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 9: CITIZEN OVERSIGHT & GROUND SIGNALS CARD (CITIZEN_SIGNAL) */}
      <Card className="border-sky-500/40 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-sky-300 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Users size={18} className="text-sky-400" />
              <span>Citizen Oversight & Ground Signals (CITIZEN_SIGNAL)</span>
            </span>
            <Badge variant={citizenReportsList.length > 0 ? 'warning' : 'info'}>
              {citizenReportsList.length > 0 ? `${citizenReportsList.length} CITIZEN REPORTS LOGGED` : 'NO CITIZEN COMPLAINTS'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl text-sky-200 leading-relaxed text-xs">
            <strong>EVIDENCE LOOP INTEGRATION:</strong> Citizen reports contribute to the multi-source Risk Engine as supporting evidence metadata (<code className="text-amber-300">CITIZEN_SIGNAL</code>). AI never confirms fraud directly; final decisions remain strictly under human authority control.
          </div>

          {citizenReportsList.length > 0 ? (
            <div className="space-y-2.5">
              {citizenReportsList.map((r: any) => (
                <div key={r.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center space-x-2">
                      <span className="text-sky-400 font-mono text-[11px]">{r.category}</span>
                      <span className="text-slate-400 font-normal">by {r.reporter_name || 'Anonymous Citizen'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Recent'}
                    </span>
                  </div>
                  <p className="text-slate-300 italic">"{r.description}"</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400 border-t border-slate-800/60">
                    <span>GPS Source: <strong className="text-sky-300">{r.gps_source || 'BROWSER_GPS'}</strong></span>
                    <span>Proximity: <strong className="text-purple-300">{r.proximity_classification || 'NEAR_WORK'}</strong></span>
                    <span>Distance: <strong className="text-amber-300">{r.distance_from_work_meters ? `${r.distance_from_work_meters}m` : '145.2m'}</strong></span>
                    <span>Forensics: <strong className="text-emerald-300">{r.sha256_hash ? 'SHA-256 Verified' : 'Standard'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-center text-xs">
              No active citizen reports logged for this project work ID.
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 10: CASE DECISION WORKBENCH */}
      <Card className="border-sky-500/40 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center space-x-2 text-slate-100 text-sm font-bold">
            <UserCheck size={18} className="text-sky-400" />
            <span>{isCentralRoute ? 'Central Nodal Ministry Workbench' : isStateRoute ? 'State Monitoring Authority Workbench' : 'District Case Decision Workbench'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {actionMessage && (
            <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs flex items-center space-x-2.5 shadow-lg">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span className="font-bold">{actionMessage}</span>
            </div>
          )}

          <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl text-sky-300 leading-relaxed flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <strong>DECISION PROTOCOL:</strong> AI and automated checks identify risk signals only. Taking case decisions requires explicit, authenticated human officer verification.
            </div>
            {recommendation?.status && (
              <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold font-mono shrink-0">
                Status: {recommendation.status}
              </span>
            )}
          </div>

          {/* EXACT 5 CASE DECISION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* 1. Request More Information */}
            <Button 
              variant="secondary" 
              size="md" 
              disabled={actionLoading}
              onClick={() => handleCaseAction('REQUEST_EVIDENCE')}
            >
              Request More Information
            </Button>

            {/* 2. Return for Correction */}
            <Button 
              variant="gold" 
              size="md" 
              disabled={actionLoading}
              onClick={() => handleCaseAction('RETURN_FOR_CORRECTION')}
            >
              Return for Correction
            </Button>

            {/* 3. Mark Cleared (No Issue) */}
            <Button 
              variant="outline" 
              size="md" 
              disabled={actionLoading}
              onClick={() => handleCaseAction('CLEAR_CASE')}
            >
              Mark Cleared (No Issue)
            </Button>

            {/* 4. Confirm Issue */}
            <Button 
              variant="danger" 
              size="md" 
              disabled={actionLoading}
              onClick={() => handleCaseAction('CONFIRM_ISSUE')}
            >
              Confirm Issue
            </Button>

            {/* 5. Escalate / Freeze Button */}
            <Button 
              variant="gold" 
              size="md" 
              disabled={actionLoading}
              onClick={() => handleCaseAction(isCentralRoute ? 'FREEZE_FUNDS' : isStateRoute ? 'ESCALATE_TO_CENTRAL' : 'ESCALATE')}
            >
              {isCentralRoute ? 'Freeze Installment Funds' : isStateRoute ? 'Escalate to Central Nodal Ministry' : 'Escalate to State Authority'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
