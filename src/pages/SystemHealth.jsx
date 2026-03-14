import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function SystemHealth() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/Home';
        return;
      }
      setUser(currentUser);
      runHealthCheck();
    } catch (error) {
      window.location.href = '/Landing';
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('systemHealthCheck', {});
      setHealthData(result.data);
    } catch (error) {
      console.error('[Health] Check failed:', error);
      toast.error('Health check failed');
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    if (status === 'ok') return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusColor = (status) => {
    if (status === 'ok') return 'border-green-500/30 bg-green-900/10';
    if (status === 'warning') return 'border-yellow-500/30 bg-yellow-900/10';
    return 'border-red-500/30 bg-red-900/10';
  };

  const getOverallColor = (status) => {
    if (status === 'healthy') return 'text-green-400';
    if (status === 'degraded') return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading || !healthData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-green-400">Running system health check...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10 text-purple-400" />
              System Health Monitor
            </h1>
            <p className="text-green-500/60">Production readiness dashboard</p>
          </div>
          <Button
            onClick={runHealthCheck}
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <Card className={`bg-black/60 border-2 ${
          healthData.overall_status === 'healthy' ? 'border-green-500/50' :
          healthData.overall_status === 'degraded' ? 'border-yellow-500/50' :
          'border-red-500/50'
        } p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm text-green-500/60 mb-1">Overall System Status</h2>
              <div className={`text-4xl font-black ${getOverallColor(healthData.overall_status)}`}>
                {healthData.overall_status.toUpperCase()}
              </div>
            </div>
            <div className="text-right text-sm text-green-500/60">
              <div>Last Check: {new Date(healthData.timestamp).toLocaleTimeString()}</div>
              <div>Duration: {healthData.total_duration_ms}ms</div>
            </div>
          </div>
        </Card>

        {/* System Checks */}
        <div className="grid gap-4 mb-8">
          {healthData.checks.map((check, idx) => (
            <Card key={idx} className={`bg-black/60 ${getStatusColor(check.status)} p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-bold text-white mb-1">{check.name}</h3>
                    <p className="text-sm text-green-500/80">{check.message}</p>
                  </div>
                </div>
                <Badge className="bg-purple-900/30 text-purple-300">
                  {check.duration}ms
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-black/60 border-purple-500/30 p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {healthData.checks.filter(c => c.status === 'ok').length}
            </div>
            <div className="text-sm text-green-500/60">Systems Healthy</div>
          </Card>
          
          <Card className="bg-black/60 border-purple-500/30 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {healthData.checks.filter(c => c.status === 'warning').length}
            </div>
            <div className="text-sm text-green-500/60">Warnings</div>
          </Card>
          
          <Card className="bg-black/60 border-purple-500/30 p-6 text-center">
            <div className="text-3xl font-bold text-red-400 mb-2">
              {healthData.checks.filter(c => c.status === 'error').length}
            </div>
            <div className="text-sm text-green-500/60">Errors</div>
          </Card>
        </div>
      </div>
    </div>
  );
}