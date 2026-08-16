import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Cpu, Server, Clock, ArrowUpRight, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClusterMetrics, TrainingJob, GPUNode } from '../types';

interface DashboardProps {
  metrics: ClusterMetrics;
  jobs: TrainingJob[];
  nodes: GPUNode[];
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ metrics, jobs, nodes, onNavigate }) => {
  const { t } = useTranslation();

  const [telemetryData, setTelemetryData] = useState([
    { time: '00:00', gpuUtil: 45 },
    { time: '04:00', gpuUtil: 62 },
    { time: '08:00', gpuUtil: 78 },
    { time: '12:00', gpuUtil: 92 },
    { time: '16:00', gpuUtil: 85 },
    { time: '20:00', gpuUtil: 71 },
    { time: 'Now', gpuUtil: metrics.avgGpuUtilization },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#76B900]" />
          <span>{t('dashboard.title')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.active_jobs')}</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{metrics.activeJobs}</div>
            <span className="text-xs text-cyan-400 font-mono">{metrics.queuedJobs} {t('dashboard.queued')}</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.gpu_available')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-[#76B900]">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{metrics.availableGpus}</div>
            <span className="text-xs text-[#76B900] font-mono">{t('dashboard.of_total', { total: metrics.totalGpus })}</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.avg_utilization')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{metrics.avgGpuUtilization}%</div>
            <span className="text-xs text-amber-400 font-mono">{t('dashboard.across_nodes')}</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.compute_hours')}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{metrics.totalComputeHours} hrs</div>
            <span className="text-xs text-purple-400 font-mono">{t('dashboard.this_month')}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">{t('dashboard.billed_usage')}</div>
        </div>
      </div>

      {/* Telemetry Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">{t('dashboard.cluster_telemetry')}</h2>
              <p className="text-xs text-slate-400 font-mono">{t('dashboard.telemetry_desc')}</p>
            </div>
            <span className="text-xs font-mono text-[#76B900] bg-[#76B900]/10 px-2 py-1 rounded border border-[#76B900]/20">
              {t('dashboard.prometheus')}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#76B900" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#76B900" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="gpuUtil" stroke="#76B900" strokeWidth={2} fillOpacity={1} fill="url(#gpuGrad)" name={t('dashboard.gpu_utilization')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Health Quick Map */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">{t('dashboard.gpu_node_status')}</h2>
              <button 
                onClick={() => onNavigate('/resources')}
                className="text-xs text-[#76B900] hover:underline flex items-center gap-1 font-mono"
              >
                {t('dashboard.view_nodes')} <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {nodes.map(node => (
                <div key={node.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200 font-mono">{node.name}</div>
                    <div className="text-[11px] text-slate-400">{node.gpuModel}</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                      node.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      node.status === 'BUSY' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {node.status}
                    </span>
                    {node.status === 'BUSY' && (
                      <div className="text-[10px] text-slate-400 mt-1">{node.gpuUtilPercent}% GPU</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Workloads Table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">{t('dashboard.active_training')}</h2>
            <p className="text-xs text-slate-400 font-mono">{t('dashboard.active_training_desc')}</p>
          </div>
          <button
            onClick={() => onNavigate('/jobs')}
            className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1"
          >
            {t('dashboard.all_jobs')} ({jobs.length}) <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">{t('dashboard.job_name_id')}</th>
                <th className="py-3 px-4">{t('dashboard.project')}</th>
                <th className="py-3 px-4">{t('dashboard.gpu_type')}</th>
                <th className="py-3 px-4">{t('dashboard.progress')}</th>
                <th className="py-3 px-4">{t('dashboard.node')}</th>
                <th className="py-3 px-4 text-right">{t('dashboard.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {jobs.slice(0, 3).map((job) => (
                <tr key={job.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                    <div>{job.name}</div>
                    <div className="text-[10px] text-slate-500">{job.id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs">{job.projectName}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-cyan-400">{job.gpuType} x{job.gpuCount}</td>
                  <td className="py-3.5 px-4 w-48">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>{job.progress}%</span>
                      <span>{job.status}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${job.status === 'COMPLETED' ? 'bg-[#76B900]' : job.status === 'FAILED' ? 'bg-red-500' : 'bg-gradient-to-r from-[#76B900] to-emerald-400 animate-pulse'}`} 
                        style={{ width: `${job.progress}%` }} 
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                    {job.assignedNodeId || t('jobs.queued')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigate(`/jobs/${job.id}`)}
                      className="px-3 py-1 text-xs font-mono font-semibold bg-slate-800 hover:bg-[#76B900] hover:text-black text-slate-200 rounded transition"
                    >
                      {t('dashboard.monitor_logs')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
