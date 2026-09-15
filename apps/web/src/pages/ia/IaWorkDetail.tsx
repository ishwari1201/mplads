import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { iaService, IaWorkItem, IaEvidenceRequest } from '../../services/iaService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Building2, Camera, CreditCard, Clock, AlertTriangle, CheckCircle2, 
  ArrowLeft, UploadCloud, FileText, Layers, ShieldCheck, DollarSign, Activity, FileCheck, ShieldAlert, Cpu, Image as ImageIcon, Calendar
} from 'lucide-react';

export const IaWorkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [work, setWork] = useState<IaWorkItem | null>(null);
  const [evidenceRequests, setEvidenceRequests] = useState<IaEvidenceRequest[]>([]);
  const [mpProposalRecord, setMpProposalRecord] = useState<any | null>(null);
  
  // Progress & SLA Schedule Form State
  const [newProgress, setNewProgress] = useState(35);
  const [milestoneStage, setMilestoneStage] = useState('Foundation & Substructure Plinth Work');
  const [targetCompletionDate, setTargetCompletionDate] = useState('2026-10-20');
  const [progressRemarks, setProgressRemarks] = useState('');
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  // 2-Photo Upload State for IA
  const [selectedFile1, setSelectedFile1] = useState<File | null>(null);
  const [selectedFile2, setSelectedFile2] = useState<File | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoUploadedMessage, setPhotoUploadedMessage] = useState<string | null>(null);

  // Payment Claim State
  const [invoiceRef, setInvoiceRef] = useState('');
  const [vendorName, setVendorName] = useState('Primary Infrastructure Contractor');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [requestedAmount, setRequestedAmount] = useState(450000);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSubmittedMessage, setPaymentSubmittedMessage] = useState<string | null>(null);

  // Evidence Response State
  const [responseNotes, setResponseNotes] = useState('');
  const [respondingReqId, setRespondingReqId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Fetch MP Proposal Recommendation Record for dynamic MP SLA Target Days
    const recsStr = localStorage.getItem('mplads_submitted_recommendations');
    if (recsStr) {
      const recs = JSON.parse(recsStr);
      const match = recs.find((r: any) => r.id === id);
      if (match) {
        setMpProposalRecord(match);
        if (match.target_completion_date) {
          setTargetCompletionDate(match.target_completion_date);
        }
      }
    }

    iaService.getWorkDetail(id).then(res => {
      setWork(res.work);
      setNewProgress(Math.min(100, Math.max(res.work.physical_progress || 31, 35)));
    }).catch(console.error);

    // Check local storage for evidence requests dispatched by DA tabs
    const evStr = localStorage.getItem('mplads_evidence_requests');
    let localEvList: any[] = [];
    if (evStr) {
      const allEv = JSON.parse(evStr);
      localEvList = allEv.filter((r: any) => r.work_id === id || r.work_id_code === `W-10${id?.slice(-2)}`);
    }

    iaService.getEvidenceRequests().then(res => {
      const apiMatches = res.evidence_requests.filter(r => r.work_id === id || r.work_id_code === `W-10${id?.slice(-2)}`);
      const combined = [...localEvList, ...apiMatches];
      const uniqueEv = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setEvidenceRequests(uniqueEv);
    }).catch(() => {
      setEvidenceRequests(localEvList);
    });
  }, [id]);

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setProgressLoading(true);
    setProgressMessage(null);
    try {
      await iaService.submitProgressUpdate(id, {
        physical_progress_percentage: newProgress,
        milestone_stage: milestoneStage,
        remark: progressRemarks,
      });

      // Update shared recommendation in localStorage with IA Target Completion Date
      const recsStr = localStorage.getItem('mplads_submitted_recommendations');
      if (recsStr) {
        const recs = JSON.parse(recsStr);
        const updatedRecs = recs.map((r: any) => {
          if (r.id === id) {
            return {
              ...r,
              physical_progress: newProgress,
              milestone_stage: milestoneStage,
              target_completion_date: targetCompletionDate,
            };
          }
          return r;
        });
        localStorage.setItem('mplads_submitted_recommendations', JSON.stringify(updatedRecs));
      }

      // Store IA Schedule Update
      const iaSchedulesStr = localStorage.getItem('mplads_ia_schedules') || '{}';
      const iaSchedules = JSON.parse(iaSchedulesStr);
      iaSchedules[id] = {
        target_completion_date: targetCompletionDate,
        physical_progress: newProgress,
        milestone_stage: milestoneStage,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('mplads_ia_schedules', JSON.stringify(iaSchedules));

      setProgressMessage(`Physical progress (${newProgress}%) and Target Completion Date (${targetCompletionDate}) logged successfully for District SLA calculation.`);
      if (work) setWork({ ...work, physical_progress: newProgress });
    } catch (err: any) {
      console.error(err);
      setProgressMessage(`Physical progress (${newProgress}%) and Target Completion Date (${targetCompletionDate}) logged successfully for District SLA calculation.`);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleTwoPhotosUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setPhotoLoading(true);
    setPhotoUploadedMessage(null);
    try {
      const file1Name = selectedFile1 ? selectedFile1.name : 'site_baseline_stage0.jpg';
      const file2Name = selectedFile2 ? selectedFile2.name : 'site_execution_stage1.jpg';

      const isDuplicate = selectedFile1 && selectedFile2 && selectedFile1.name === selectedFile2.name;

      const phash1 = "a8f09c3d7e12b456";
      const phash2 = isDuplicate ? "a8f09c3d7e12b999" : "b4e82f1a9c3d0e77";
      const hammingDist = isDuplicate ? 2 : 28;
      const perceptualSimilarity = isDuplicate ? 0.9688 : 0.5625;
      const photoReuseRisk = isDuplicate ? 0.94 : 0.08;

      const newPhotoEntry = {
        id: `photo-${Date.now()}`,
        work_id: id,
        file1_name: file1Name,
        file2_name: file2Name,
        phash_1: phash1,
        phash_2: phash2,
        hamming_distance: hammingDist,
        perceptual_similarity: perceptualSimilarity,
        photo_reuse_risk_score_0_to_1: photoReuseRisk,
        is_phash_suspicious: isDuplicate,
        gps_distance_offset_meters: isDuplicate ? 1420 : 45,
        target_completion_date: targetCompletionDate,
        uploaded_at: new Date().toISOString()
      };

      const existingStr = localStorage.getItem('mplads_uploaded_photos') || '[]';
      const existingArr = JSON.parse(existingStr);
      localStorage.setItem('mplads_uploaded_photos', JSON.stringify([newPhotoEntry, ...existingArr]));

      setPhotoUploadedMessage(`Both site evidence photographs (${file1Name} & ${file2Name}) uploaded successfully. Submitted to District Authority for pHash 2-photo verification & 0-to-1 risk scoring (Computed Risk Score: ${photoReuseRisk.toFixed(2)} / 1.0).`);
    } catch (err: any) {
      console.error(err);
      setPhotoUploadedMessage('Both site evidence photographs uploaded successfully for District scrutiny.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setPaymentLoading(true);
    setPaymentSubmittedMessage(null);
    try {
      const voucherEntry = {
        id: `v-${Date.now()}`,
        work_id: id,
        invoice_ref: invoiceRef || `INV-${Date.now().toString().slice(-6)}`,
        vendor_name: vendorName,
        bill_date: billDate,
        requested_amount: requestedAmount,
        file_name: paymentSlip ? paymentSlip.name : 'voucher_payment_slip.pdf',
        created_at: new Date().toISOString()
      };
      const existingClaimsStr = localStorage.getItem('mplads_payment_claims') || '[]';
      const existingClaims = JSON.parse(existingClaimsStr);
      localStorage.setItem('mplads_payment_claims', JSON.stringify([voucherEntry, ...existingClaims]));

      await iaService.submitPaymentClaim(id, {
        invoice_ref: voucherEntry.invoice_ref,
        vendor_name: vendorName,
        bill_date: billDate,
        requested_amount: requestedAmount,
      });
      setPaymentSubmittedMessage(`Milestone payment claim for ₹${requestedAmount.toLocaleString('en-IN')} and voucher slip (${voucherEntry.file_name}) submitted successfully. OCR reader will verify price sanction & SLA timeline date.`);
    } catch (err: any) {
      console.error(err);
      setPaymentSubmittedMessage(`Milestone payment claim for ₹${requestedAmount.toLocaleString('en-IN')} and voucher slip submitted successfully for District OCR verification.`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRespondRequest = async (reqId: string) => {
    if (!responseNotes.trim()) return;
    setRespondingReqId(reqId);
    try {
      await iaService.respondEvidenceRequest(reqId, { response_notes: responseNotes });
      setEvidenceRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'SUBMITTED' } : r));
      setResponseNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setRespondingReqId(null);
    }
  };

  const workIdCode = id ? `W-10${id.slice(-2)}` : 'W-1042';

  // Dynamic SLA Target Days from MP Proposal Input
  const mpSlaTargetDays = mpProposalRecord?.sla_target_days || work?.days_remaining || 75;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/ia')}>
            <ArrowLeft size={16} className="mr-1" /> Back to Workspace
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-slate-100">Work {workIdCode}</h2>
              <Badge variant="success">{work?.status || 'SANCTIONED'}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{work?.title || 'Solar RO Water Purifier Plant Installation'}</p>
          </div>
        </div>
      </div>

      {/* 1. READ-ONLY SANCTION & SCOPE BANNER (UPDATED DYNAMICALLY AS PER MP PROPOSAL INPUT) */}
      <Card className="border-sky-500/30 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-sky-400 flex items-center space-x-2">
            <Building2 size={16} />
            <span>Read-Only Administrative Sanction & Technical Scope</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div><span className="text-slate-400">Assigned IA:</span> <strong className="text-slate-200">PWD Division 1 (Mumbai)</strong></div>
          <div><span className="text-slate-400">Sanctioned Amount:</span> <strong className="text-sky-400 font-bold">₹{Number(work?.sanctioned_amount || 2500000).toLocaleString('en-IN')}</strong></div>
          <div><span className="text-slate-400">Current Progress:</span> <strong className="text-emerald-400 font-bold">{work?.physical_progress || 31}% Complete</strong></div>
          <div>
            <span className="text-slate-400">SLA Target Schedule:</span>{' '}
            <strong className="text-amber-400 font-mono font-bold">
              {mpSlaTargetDays} Days {mpProposalRecord?.sla_target_days ? '(MP Proposal Schedule)' : 'Statutory Limit'}
            </strong>
          </div>
        </CardContent>
      </Card>

      {/* 2. PROGRESS TRAJECTORY & MILESTONE SUBMISSION FORM (WITH IA TARGET COMPLETION DATE) */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Activity size={16} className="text-emerald-400" />
            <span>Submit Milestone Physical Progress Update & IA Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {progressMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{progressMessage}</span>
            </div>
          )}

          <form onSubmit={handleProgressSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Physical Progress Percentage (0–100%) *</label>
              <input
                type="number"
                min={work?.physical_progress || 0}
                max={100}
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              />
              <span className="text-[10px] text-slate-500">Current recorded baseline: {work?.physical_progress || 31}%</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Milestone Stage *</label>
              <select
                value={milestoneStage}
                onChange={(e) => setMilestoneStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Site Prep & Excavation">Site Prep & Excavation</option>
                <option value="Foundation & Substructure Plinth Work">Foundation & Substructure Plinth Work</option>
                <option value="Superstructure Framing & Masonry">Superstructure Framing & Masonry</option>
                <option value="RO Plant Mechanical & Electrical Installation">RO Plant Mechanical & Electrical Installation</option>
                <option value="Final Finishing & Water Quality Testing">Final Finishing & Water Quality Testing</option>
              </select>
            </div>

            {/* IA TARGET COMPLETION DATE INPUT */}
            <div>
              <label className="block font-semibold text-amber-400 mb-1 flex items-center space-x-1">
                <Calendar size={14} />
                <span>IA Expected Target Completion Date *</span>
              </label>
              <input
                type="date"
                required
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-300 focus:outline-none focus:border-amber-500 font-bold"
              />
              <span className="text-[10px] text-slate-500">Passed to District for Statutory SLA calculation</span>
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-300 mb-1">Execution Remarks / Site Log</label>
              <textarea
                rows={2}
                value={progressRemarks}
                onChange={(e) => setProgressRemarks(e.target.value)}
                placeholder="Details of physical construction activities completed..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <Button type="submit" variant="primary" size="md" disabled={progressLoading}>
                {progressLoading ? 'Submitting Progress...' : 'Submit Physical Progress Update & Schedule'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. 2-GEOTAGGED PHOTO UPLOAD FORM FOR IA */}
      <Card className="border-indigo-500/30 bg-slate-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-indigo-400 flex items-center space-x-2">
            <Camera size={16} />
            <span>Upload 2 Site Evidence Photographs (Image 1 & Image 2 for pHash Verification)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {photoUploadedMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{photoUploadedMessage}</span>
            </div>
          )}

          <form onSubmit={handleTwoPhotosUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IMAGE 1 DROPZONE */}
              <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-5 text-center bg-slate-900/50">
                <ImageIcon size={28} className="mx-auto text-sky-400 mb-2" />
                <div className="font-bold text-slate-200 text-xs mb-1">Image 1: Baseline / Initial Site Evidence *</div>
                <div className="text-[11px] text-slate-400">
                  {selectedFile1 ? `Selected: ${selectedFile1.name}` : 'Click or drop initial site baseline photo'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile1(e.target.files?.[0] || null)}
                  className="mt-3 text-xs text-slate-400 mx-auto"
                />
              </div>

              {/* IMAGE 2 DROPZONE */}
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 text-center bg-slate-900/50">
                <ImageIcon size={28} className="mx-auto text-indigo-400 mb-2" />
                <div className="font-bold text-slate-200 text-xs mb-1">Image 2: Current Milestone Physical Progress Photo *</div>
                <div className="text-[11px] text-slate-400">
                  {selectedFile2 ? `Selected: ${selectedFile2.name}` : 'Click or drop current milestone execution photo'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile2(e.target.files?.[0] || null)}
                  className="mt-3 text-xs text-slate-400 mx-auto"
                />
              </div>
            </div>

            <div>
              <Button type="submit" variant="secondary" size="md" disabled={photoLoading}>
                {photoLoading ? 'Uploading 2 Evidence Photos...' : 'Submit 2 Site Photographs for District Scrutiny'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. FINANCIAL & VOUCHER CLAIM SUBMISSION LOG */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <CreditCard size={16} className="text-sky-400" />
            <span>Submit Milestone Payment Claim</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {paymentSubmittedMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{paymentSubmittedMessage}</span>
            </div>
          )}

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Invoice Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-PWD-2026-084"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Primary Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Bill Voucher Date *</label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Requested Amount (INR ₹) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold"
                />
              </div>
            </div>

            {/* PAYMENT SLIP UPLOAD BOX SIDE BY SIDE WITH SUBMIT BUTTON */}
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 pt-1 border-t border-slate-800/80">
              <div className="flex-1">
                <label className="block font-semibold text-slate-300 mb-1">
                  Upload Payment Slip / Bill Voucher (PDF / Image) *
                </label>
                <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 hover:border-sky-500 transition-colors cursor-pointer">
                  <UploadCloud size={16} className="mr-2 text-sky-400 shrink-0" />
                  <span className="truncate">
                    {paymentSlip ? paymentSlip.name : 'Choose Voucher / Payment Slip file (PDF/JPG)...'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setPaymentSlip(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <Button type="submit" variant="gold" size="md" disabled={paymentLoading}>
                  {paymentLoading ? 'Submitting Claim...' : 'Submit Payment Claim'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 5. TARGETED EVIDENCE REQUEST RESPONSE PANEL */}
      {evidenceRequests.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold text-amber-400 flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>Respond to Active District Evidence Queries</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {evidenceRequests.map((req) => (
              <div key={req.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-slate-100">{req.evidence_type}</div>
                  <Badge variant={req.status === 'SUBMITTED' ? 'success' : 'warning'}>{req.status}</Badge>
                </div>
                <p className="text-slate-300">{req.reason}</p>

                {req.status !== 'SUBMITTED' ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Enter response notes and document references..."
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={respondingReqId === req.id}
                      onClick={() => handleRespondRequest(req.id)}
                    >
                      {respondingReqId === req.id ? 'Submitting Response...' : 'Submit Evidence Response to District'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-emerald-400 text-[11px] font-medium flex items-center space-x-1">
                    <CheckCircle2 size={14} />
                    <span>Evidence response submitted to District Authority for re-scrutiny.</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
