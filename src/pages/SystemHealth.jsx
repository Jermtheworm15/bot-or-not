import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2,
  Zap, Shield, Link, Brain, Database, BarChart2, Clock, Wrench,
  TrendingUp, Eye, ChevronDown, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CATEGORY_ICONS = {
  database: Database, api: Link, ai_response: Brain, links: Link,
  tickers: TrendingUp, frontend: Eye, performance: Activity, arcade: Zap, feed: BarChart2
};

const STATUS_META = {
  ok:      { color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-700/30', icon: CheckCircle2 },
  warning: { color: 'text-yellow-400',  bg: 'bg-yellow-900/20 border-yellow-700/30',   icon: AlertTriangle },
  error:   { color: 'text-red-400',     bg: 'bg-red-900/20 border-red-700/30',         icon: XCircle },
};

const OVERALL_META = {
  healthy:   { color: 'text-emerald-400', border: 'border-emerald-500/40', label: '✅ HEALTHY' },
  degraded:  { color: 'text-yellow-400',  border: 'border-yellow-500/40',  label: '⚠ DEGRADED' },
  unhealthy: { color: 'text-red-400',     border: 'border-red-500/40',     label: '🔴 UNHEALTHY' },
};

function CheckCard({ check }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[check.status] || STATUS_META.ok;
  const StatusIcon = meta.icon;
  const CatIcon = CATEGORY_ICONS[check.category] || Activity;
  const hasDetails = check.details && Object.keys(check.details).length > 0;

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className={`border rounded-xl overflow-hidden ${meta.bg}`}>
      <button onClick={() => hasDetails && setExpanded(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <StatusIcon className={`w-4 h-4 flex-shrink-0 ${meta.color}`} />
        <CatIcon className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{check.name}</p>
          <p className="text-xs text-zinc-400 truncate">{check.message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{check.duration}ms</span>
          {hasDetails && (expanded ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronRight className="w-3 h-3 text-zinc-600" />)}
        </div>
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-3 border-t border-zinc-800/50">
          <pre className="text-[10px] text-zinc-500 mt-2 whitespace-pre-wrap overflow-auto max-h-32">
            {JSON.stringify(check.details, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  );
}

function LogEntry({ log }) {
  const color = log.log_type === 'fix_applied' ? 'text-cyan-400' : log.log_type === 'error' ? 'text-red-400' : log.log_type === 'warning' ? 'text-yellow-400' : 'text-emerald-400';
  const icon = log.log_type === 'fix_applied' ? '🔧' : log.log_type === 'error' ? '🔴' : log.log_type === 'warning' ? '⚠️' : '✅';
  return (
    <div className="flex items-start gap-2 py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-sm flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${color}`}>{log.message}</p>
        {log.fix_description && <p className="text-[10px] text-cyan-300 mt-0.5">Fix: {log.fix_description}</p>}
        <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(log.created_date).toLocaleString()}</p>
      </div>
      <span className={`text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 ${
        log.severity === 'critical' ? 'bg-red-900/30 border-red-700 text-red-400' :
        log.severity === 'high'     ? 'bg-orange-900/30 border-orange-700 text-orange-400' :
        log.severity === 'medium'   ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400' :
                                      'bg-zinc-800 border-zinc-700 text-zinc-500'
      }`}>{log.severity}</span>
    </div>
  );
}

const STAT_CARDS = [
  { key: 'ok',    label: 'Healthy',   color: 'text-emerald-400', icon: CheckCircle2 },
  { key: 'warn',  label: 'Warnings',  color: 'text-yellow-400',  icon: AlertTriangle },
  { key: 'err',   label: 'Errors',    color: 'text-red-400',     icon: XCircle },
  { key: 'fixes', label: 'Auto-Fixed',color: 'text-cyan-400',    icon: Wrench },
];

export default function SystemHealth() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [autoRunning, setAutoRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [tab, setTab] = useState('checks');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') { window.location.href = '/Home'; return; }
    await Promise.all([runHealthCheck(), loadLogs()]);
  };

  const loadLogs = async () => {
    const recent = await base44.entities.SystemLog.list('-created_date', 50);
    setLogs(recent);
  };

  const runHealthCheck = async () => {
    setLoading(true);
    const result = await base44.functions.invoke('systemHealthCheck', {});
    setHealthData(result.data);
    setLastRun(new Date());
    setLoading(false);
    loadLogs();
  };

  const runAutoHeal = async () => {
    setAutoRunning(true);
    await runHealthCheck();
    setAutoRunning(false);
  };

  const overallMeta = healthData ? (OVERALL_META[healthData.overall_status] || OVERALL_META.healthy) : null;

  const okCount   = healthData?.checks?.filter(c => c.status === 'ok').length || 0;
  const warnCount = healthData?.checks?.filter(c => c.status === 'warning').length || 0;
  const errCount  = healthData?.checks?.filter(c => c.status === 'error').length || 0;
  const fixCount  = logs.filter(l => l.log_type === 'fix_applied').length;
  const statValues = { ok: okCount, warn: warnCount, err: errCount, fixes: fixCount };

  const perfData = healthData?.checks?.map(c => ({
    name: c.name.split(' ')[0],
    duration: c.duration,
    status: c.status
  })) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-emerald-950/10 pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Shield className="w-6 h-6 text-violet-400" />System Intelligence
            </h1>
            <p className="text-[11px] text-zinc-500">Self-healing · Auto-monitoring · Continuous improvement</p>
          </div>
          <div className="flex gap-2">
            <button onClick={runAutoHeal} disabled={autoRunning || loading}
              className="flex items-center gap-1 text-xs bg-cyan-800 hover:bg-cyan-700 border border-cyan-600 px-3 py-2 rounded-xl text-cyan-200 font-bold disabled:opacity-50 transition-colors">
              <Wrench className={`w-3.5 h-3.5 ${autoRunning ? 'animate-spin' : ''}`} />
              {autoRunning ? 'Healing...' : 'Auto-Heal'}
            </button>
            <button onClick={runHealthCheck} disabled={loading}
              className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 rounded-xl disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${loading ? 'animate-spin' : ''}`} />
              Scan
            </button>
          </div>
        </div>

        {/* Overall Banner */}
        {healthData && overallMeta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`border-2 rounded-2xl p-4 flex items-center justify-between ${overallMeta.border} bg-zinc-900/60`}>
            <div>
              <p className={`text-2xl font-black ${overallMeta.color}`}>{overallMeta.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Last scan: {lastRun?.toLocaleTimeString()} · {healthData.total_duration_ms}ms
                {healthData.auto_fixes?.length > 0 && (
                  <span className="text-cyan-400 ml-2">· 🔧 {healthData.auto_fixes.length} auto-fix applied</span>
                )}
              </p>
            </div>
            <div className="flex gap-4 text-center">
              {[{ n: okCount, l: 'Healthy', c: 'text-emerald-400' }, { n: warnCount, l: 'Warnings', c: 'text-yellow-400' }, { n: errCount, l: 'Errors', c: 'text-red-400' }].map(({ n, l, c }) => (
                <div key={l}><p className={`text-xl font-black ${c}`}>{n}</p><p className="text-[10px] text-zinc-600">{l}</p></div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-2">
          {STAT_CARDS.map((sc) => {
            const SIcon = sc.icon;
            return (
              <div key={sc.key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <SIcon className={`w-4 h-4 ${sc.color} mx-auto mb-1`} />
                <p className={`text-lg font-black ${sc.color}`}>{statValues[sc.key]}</p>
                <p className="text-[9px] text-zinc-600">{sc.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['checks', 'performance', 'logs'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                tab === t ? 'bg-violet-700 border-violet-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}>{t}
            </button>
          ))}
        </div>

        {/* Checks Tab */}
        {tab === 'checks' && (
          <div className="space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-xs text-zinc-500 animate-pulse">Running 10 system checks...</p>
              </div>
            ) : healthData?.checks?.map((check, i) => <CheckCard key={i} check={check} />)}
          </div>
        )}

        {/* Performance Tab */}
        {tab === 'performance' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-violet-400" /> Check Duration by System (ms)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={perfData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#52525b', fontSize: 9 }} width={70} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 10 }} />
                  <Bar dataKey="duration" radius={4}>
                    {perfData.map((entry, i) => (
                      <Cell key={i} fill={entry.status === 'ok' ? '#10b981' : entry.status === 'warning' ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-zinc-400">Ticker Link Validator</p>
              {['NVDA', 'MSFT', 'GOOGL', 'AAPL', 'AMD', 'META'].map(ticker => (
                <div key={ticker} className="flex items-center justify-between">
                  <span className="text-xs font-black text-violet-300">{ticker}</span>
                  <div className="flex gap-2">
                    {[
                      { label: 'Yahoo', url: `https://finance.yahoo.com/quote/${ticker}` },
                      { label: 'Google', url: `https://www.google.com/finance/quote/${ticker}` },
                      { label: 'TradingView', url: `https://www.tradingview.com/symbols/${ticker}` },
                    ].map(({ label, url }) => (
                      <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] bg-zinc-800 hover:bg-violet-900/40 border border-zinc-700 hover:border-violet-600 px-2 py-0.5 rounded text-zinc-400 hover:text-violet-300 transition-colors">
                        {label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {tab === 'logs' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-400">System Event Log ({logs.length})</p>
              <div className="flex gap-3 text-[10px]">
                <span className="text-red-400">{logs.filter(l => l.log_type === 'error').length} errors</span>
                <span className="text-yellow-400">{logs.filter(l => l.log_type === 'warning').length} warnings</span>
                <span className="text-cyan-400">{logs.filter(l => l.log_type === 'fix_applied').length} fixes</span>
              </div>
            </div>
            <div className="px-4 max-h-96 overflow-y-auto">
              {logs.length === 0
                ? <div className="py-8 text-center text-zinc-600 text-xs">No log entries yet. Run a health scan first.</div>
                : logs.map(log => <LogEntry key={log.id} log={log} />)
              }
            </div>
          </div>
        )}

        {/* Auto-fixes banner */}
        {healthData?.auto_fixes?.length > 0 && (
          <div className="bg-cyan-900/20 border border-cyan-700/40 rounded-2xl p-4">
            <p className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" /> Auto-Fixes Applied This Run
            </p>
            {healthData.auto_fixes.map((fix, i) => (
              <p key={i} className="text-xs text-cyan-300">🔧 {fix}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}