import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Microscope, Upload, Link, AlertTriangle, CheckCircle, XCircle,
  Loader2, Eye, Cpu, Fingerprint, BarChart2, Zap, Info, Camera
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const SEVERITY_COLORS = {
  clean: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/40',
  minor: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  moderate: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  severe: 'text-red-400 bg-red-900/30 border-red-700/40',
};

const VERDICT_META = {
  'AI Generated':  { color: 'text-red-400',     bg: 'bg-red-900/30 border-red-600',       icon: XCircle,      glow: 'shadow-red-900/60' },
  'Likely AI':     { color: 'text-orange-400',   bg: 'bg-orange-900/30 border-orange-600', icon: AlertTriangle, glow: 'shadow-orange-900/60' },
  'Possibly AI':   { color: 'text-yellow-400',   bg: 'bg-yellow-900/30 border-yellow-600', icon: AlertTriangle, glow: 'shadow-yellow-900/60' },
  'Likely Real':   { color: 'text-emerald-400',  bg: 'bg-emerald-900/30 border-emerald-600', icon: CheckCircle, glow: 'shadow-emerald-900/60' },
  'Authentic':     { color: 'text-green-400',    bg: 'bg-green-900/30 border-green-600',   icon: CheckCircle,  glow: 'shadow-green-900/60' },
};

function RadarSignalChart({ signals }) {
  if (!signals?.length) return null;
  const data = signals.slice(0, 6).map(s => ({
    subject: s.signal?.split(' ').slice(0, 2).join(' ') || 'Signal',
    score: s.score || 0,
  }));
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1">
        <BarChart2 className="w-3.5 h-3.5 text-violet-400" /> Signal Radar
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 9 }} />
          <Radar dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} strokeWidth={2} />
          <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreMeter({ value, label, color }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const c = pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-500">{label}</span>
        <span className={`font-black ${pct > 70 ? 'text-red-400' : pct > 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className={`h-full ${c} rounded-full`}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

export default function AIForensicsLab() {
  const [mode, setMode] = useState('url'); // 'url' | 'upload'
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    // Upload to storage
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
  };

  const handleAnalyze = async () => {
    const url = imageUrl.trim();
    if (!url) { setError('Please provide an image URL or upload an image.'); return; }
    setError('');
    setResult(null);
    setAnalyzing(true);
    if (mode === 'url') setPreviewUrl(url);
    const res = await base44.functions.invoke('analyzeImageForensics', { image_url: url });
    if (res.data?.success) {
      setResult(res.data.analysis);
    } else {
      setError(res.data?.error || 'Analysis failed. Try a different image.');
    }
    setAnalyzing(false);
  };

  const verdictMeta = result ? (VERDICT_META[result.verdict] || VERDICT_META['Possibly AI']) : null;
  const VerdictIcon = verdictMeta?.icon || AlertTriangle;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-emerald-950/10 pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Microscope className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black">AI Image Forensics Lab</h1>
          <p className="text-xs text-zinc-500">Deep AI analysis to detect synthetic, manipulated, or deepfake imagery</p>
        </div>

        {/* Input Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setMode('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${mode === 'url' ? 'bg-violet-700 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
              <Link className="w-3.5 h-3.5" /> Paste URL
            </button>
            <button onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${mode === 'upload' ? 'bg-violet-700 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
              <Upload className="w-3.5 h-3.5" /> Upload Image
            </button>
          </div>

          {mode === 'url' ? (
            <input
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setPreviewUrl(e.target.value); }}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
            />
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-700 hover:border-violet-600 rounded-xl py-8 cursor-pointer transition-colors">
              <Camera className="w-8 h-8 text-zinc-600" />
              <p className="text-xs text-zinc-500">Click to upload an image</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden bg-zinc-800 aspect-video flex items-center justify-center">
              <img src={previewUrl} alt="Analysis target" className="max-h-48 w-auto object-contain mx-auto" onError={() => setPreviewUrl('')} />
              {analyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
                  </div>
                  <p className="text-xs text-violet-300 animate-pulse">Running forensic analysis...</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-3 py-2">{error}</p>}

          <button onClick={handleAnalyze} disabled={analyzing || !imageUrl}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-lg shadow-violet-900/40">
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Zap className="w-4 h-4" /> Run Forensic Analysis</>}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && verdictMeta && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Verdict Card */}
              <div className={`border rounded-2xl p-5 shadow-xl ${verdictMeta.bg} ${verdictMeta.glow}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <VerdictIcon className={`w-6 h-6 ${verdictMeta.color}`} />
                    <span className={`text-xl font-black ${verdictMeta.color}`}>{result.verdict}</span>
                  </div>
                  <span className={`text-3xl font-black ${verdictMeta.color}`}>{result.confidence || result.ai_probability}%</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{result.summary}</p>
                {result.generation_model_guess && result.generation_model_guess !== 'Unknown' && (
                  <p className="mt-2 text-[10px] text-zinc-500">
                    Suspected model: <span className="text-violet-400 font-bold">{result.generation_model_guess}</span>
                  </p>
                )}
              </div>

              {/* Score Meters */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5 text-violet-400" /> Forensic Scores
                </p>
                <ScoreMeter label="AI Generation Probability" value={result.ai_probability} />
                <ScoreMeter label="Overall Suspicion Score" value={result.overall_score} />
                <ScoreMeter label="Analysis Confidence" value={result.confidence} />
              </div>

              {/* Radar Chart */}
              {result.signals?.length > 0 && <RadarSignalChart signals={result.signals} />}

              {/* Signals Breakdown */}
              {result.signals?.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-zinc-400 flex items-center gap-1 mb-3">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Signal Breakdown
                  </p>
                  {result.signals.map((s, i) => (
                    <div key={i} className={`flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl border ${SEVERITY_COLORS[s.severity] || SEVERITY_COLORS.minor}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{s.signal}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{s.finding}</p>
                      </div>
                      <span className="text-xs font-black flex-shrink-0">{s.score}/100</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Artifacts + Regions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.artifacts?.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> Detected Artifacts
                    </p>
                    <div className="space-y-1">
                      {result.artifacts.map((a, i) => (
                        <p key={i} className="text-[10px] text-orange-300 bg-orange-900/20 px-2 py-1 rounded-lg">⚠ {a}</p>
                      ))}
                    </div>
                  </div>
                )}
                {result.manipulation_regions?.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-red-400" /> Suspicious Regions
                    </p>
                    <div className="space-y-1">
                      {result.manipulation_regions.map((r, i) => (
                        <p key={i} className="text-[10px] text-red-300 bg-red-900/20 px-2 py-1 rounded-lg">📍 {r}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata flags */}
              {result.metadata_flags?.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-cyan-400" /> Metadata Flags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.metadata_flags.map((f, i) => (
                      <span key={i} className="text-[10px] bg-cyan-900/20 border border-cyan-800 text-cyan-300 px-2 py-1 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner */}
        {!result && !analyzing && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
            <Microscope className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">Paste any image URL above or upload a photo. The AI will scan for generation artifacts, manipulation patterns, and deepfake signatures.</p>
          </div>
        )}
      </div>
    </div>
  );
}