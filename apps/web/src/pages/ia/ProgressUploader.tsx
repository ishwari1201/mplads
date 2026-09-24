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

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    }
  };

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
        <h2 className="text-2xl font-bold text-slate-900">Upload Geotagged Field Evidence</h2>
        <p className="text-xs text-slate-600">EXIF GPS Location & Perceptual Hashing (pHash) Fraud Check</p>
      </div>

      {analysis && (
        <Card className="border-sky-300 bg-sky-50/50">
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <span>Photo Uploaded & Extracted!</span>
            </div>
            <div className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-xs">
              <div className="flex items-center space-x-2 text-sky-700 font-semibold">
                <ShieldCheck size={14} />
                <span>EXIF & pHash Analysis Results:</span>
              </div>
              <p>GPS Latitude: <span className="font-mono">{analysis.exif_data.latitude || 18.9067}</span></p>
              <p>GPS Longitude: <span className="font-mono">{analysis.exif_data.longitude || 72.8258}</span></p>
              <p>Perceptual Hash: <span className="font-mono">{analysis.fraud_analysis.phash}</span></p>
              <p className={analysis.fraud_analysis.is_suspicious ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                Fraud Risk Status: {analysis.fraud_analysis.is_suspicious ? 'SUSPICIOUS REUSED PHOTO' : 'PASSED INTEGRITY CHECK'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Site Photograph Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Work Project</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs font-medium">
                <option value="r1000000-0000-0000-0000-000000000001">Solar RO Water Purifier Plant (REC-2026-MH01-001)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone Stage</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs font-medium">
                <option>Stage 1: Foundation & Civil Work (25%)</option>
                <option>Stage 2: RO Unit Installation (50%)</option>
                <option>Stage 3: Solar Panel Mounting & Testing (100%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Site Photo (JPEG/PNG with EXIF Location)</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50 scale-[1.01]'
                    : previewUrl
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50'
                }`}
              >
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Site Preview"
                      className="mx-auto h-36 w-auto object-cover rounded-lg border border-slate-300 shadow-sm"
                    />
                    <div className="text-xs text-slate-700 font-medium truncate max-w-xs mx-auto">
                      {file?.name} ({(file?.size ? (file.size / 1024).toFixed(1) : 0)} KB)
                    </div>
                    <div className="flex justify-center gap-2">
                      <label
                        htmlFor="progress-file-input"
                        className="cursor-pointer inline-flex items-center px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-300 rounded-lg hover:bg-sky-50"
                      >
                        Change Photo
                      </label>
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreviewUrl(null); }}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Camera size={36} className={`mx-auto mb-2 ${isDragging ? 'text-sky-600 animate-bounce' : 'text-slate-400'}`} />
                    <p className="text-xs font-bold text-slate-800">
                      {isDragging ? 'Drop photo here to upload' : 'Drag & Drop site photo here, or click to browse'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Supports JPG, PNG, WEBP (Max 15MB)</p>
                    <label
                      htmlFor="progress-file-input"
                      className="mt-3 cursor-pointer inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 shadow-xs"
                    >
                      Browse Device Files
                    </label>
                  </div>
                )}
                <input
                  id="progress-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
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
