import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { iaService } from '../../services/iaService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Camera, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ProgressUploader: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('recommendation_id', 'r1000000-0000-0000-0000-000000000001');

    try {
      const res = await iaService.uploadProgressPhoto('r1000000-0000-0000-0000-000000000001', formData);
      setAnalysis(res);
      setTimeout(() => navigate('/ia'), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Upload Geotagged Field Evidence</h2>
        <p className="text-xs text-slate-400">EXIF GPS Location & Perceptual Hashing (pHash) Fraud Check</p>
      </div>

      {analysis && (
        <Card className="border-sky-500/50 bg-sky-950/40">
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={18} />
              <span>Photo Uploaded & Extracted!</span>
            </div>
            <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-sky-400 font-semibold">
                <ShieldCheck size={14} />
                <span>EXIF & pHash Analysis Results:</span>
              </div>
              <p>GPS Latitude: {analysis.exif_data.latitude || 18.9067}</p>
              <p>GPS Longitude: {analysis.exif_data.longitude || 72.8258}</p>
              <p>Perceptual Hash: {analysis.fraud_analysis.phash}</p>
              <p className={analysis.fraud_analysis.is_suspicious ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                Fraud Risk Status: {analysis.fraud_analysis.is_suspicious ? 'SUSPICIOUS REUSED PHOTO' : 'PASSED INTEGRITY CHECK'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Site Photograph Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Work Project</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                <option value="r1000000-0000-0000-0000-000000000001">Solar RO Water Purifier Plant (REC-2026-MH01-001)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Milestone Stage</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                <option>Stage 1: Foundation & Civil Work (25%)</option>
                <option>Stage 2: RO Unit Installation (50%)</option>
                <option>Stage 3: Solar Panel Mounting & Testing (100%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Site Photo (JPEG/PNG with EXIF Location)</label>
              <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-6 text-center transition-colors">
                <Camera size={32} className="mx-auto text-slate-500 mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/ia')}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={!file || loading}>
                {loading ? 'Analyzing EXIF & pHash...' : 'Upload & Verify Photo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
