import React from 'react';
import { 
  Cpu, 
  Server, 
  Activity, 
  Zap, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  PlayCircle,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { ClusterMetrics, TrainingJob, GPUNode } from '../types';

interface DashboardProps {
  metrics: ClusterMetrics;
  jobs: TrainingJob[];
  nodes: GPUNode[];
  onNavigate: (path: string) => void;
}

const telemetryData = [
  { time: '00:00', gpuUtil: 45, memoryGB: 120, jobs: 1 },
  { time: '04:00', gpuUtil: 55, memoryGB: 180, jobs: 2 },
  { time: '08:00', gpuUtil: 88, memoryGB: 340, jobs: 3 },
  { time: '12:00', gpuUtil: 76, memoryGB: 290, jobs: 2 },
  { time: '16:00', gpuUtil: 94, memoryGB: 410, jobs: 4 },
  { time: '20:00', gpuUtil: 68, memoryGB: 240, jobs: 2 },
];

export const Dashboard: React.FC<DashboardProps> = ({ metrics, jobs, nodes, onNavigate }) => {
  const activeJobs = jobs.filter(j => j.status === 'RUNNING');

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Cluster Overview</span>
            <span className="text-xs bg-[#76B900]/20 text-[#76B900] px-2 py-0.5 rounded-full font-mono font-semibold border border-[#76B900]/30">
              Live Stream
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time GPU cluster telemetry, active workloads & job scheduler queue</p>
        </div>
        <button
          onClick={() => onNavigate('/jobs/new')}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-[#76B900]/20 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>Launch AI Workload</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Active Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-[#76B900]">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{metrics.activeJobs}</div>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +1 queued
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Processing on 6 GPU nodes</div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">GPU Cluster Load</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{metrics.avgGpuUtilization}%</div>
            <span className="text-xs text-cyan-400 font-mono">10 / 16 GPUs</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-[#76B900] h-full" style={{ width: `${metrics.avgGpuUtilization}%` }} />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Available Nodes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{nodes.filter(n => n.status === 'AVAILABLE').length}</div>
            <span className="text-xs text-slate-400 font-mono">of {nodes.length} Total Nodes</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready for allocation
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Total Compute Hours</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{metrics.totalComputeHours} hrs</div>
            <span className="text-xs text-purple-400 font-mono">This Month</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Billed via Usage Metering</div>
        </div>
      </div>

      {/* Telemetry Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Cluster Utilization Telemetry</h2>
              <p className="text-xs text-slate-400 font-mono">Aggregate GPU % load and VRAM consumption</p>
            </div>
            <span className="text-xs font-mono text-[#76B900] bg-[#76B900]/10 px-2 py-1 rounded border border-[#76B900]/20">
              Prometheus Metrics
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
                <Area type="monotone" dataKey="gpuUtil" stroke="#76B900" strokeWidth={2} fillOpacity={1} fill="url(#gpuGrad)" name="GPU Utilization %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Health Quick Map */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">GPU Node Status</h2>
              <button 
                onClick={() => onNavigate('/resources')}
                className="text-xs text-[#76B900] hover:underline flex items-center gap-1 font-mono"
              >
                View Nodes <ArrowUpRight className="w-3 h-3" />
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
            <h2 className="text-base font-bold text-white">Active Training Jobs</h2>
            <p className="text-xs text-slate-400 font-mono">Currently executing on simulated GPU nodes</p>
          </div>
          <button
            onClick={() => onNavigate('/jobs')}
            className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1"
          >
            All Jobs ({jobs.length}) <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Job Name / ID</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">GPU Type</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Node</th>
                <th className="py-3 px-4 text-right">Actions</th>
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
                    {job.assignedNodeId || 'Queued...'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigate(`/jobs/${job.id}`)}
                      className="px-3 py-1 text-xs font-mono font-semibold bg-slate-800 hover:bg-[#76B900] hover:text-black text-slate-200 rounded transition"
                    >
                      Monitor Live Logs
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
