import React, { useState } from 'react';
import { Cpu, PlayCircle, CheckCircle2, XCircle, Clock, Search, Filter, Plus } from 'lucide-react';
import { TrainingJob, JobStatus } from '../types';

interface JobsListProps {
  jobs: TrainingJob[];
  onNavigate: (path: string) => void;
}

export const JobsList: React.FC<JobsListProps> = ({ jobs, onNavigate }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredJobs = jobs.filter(j => {
    const matchesStatus = filterStatus === 'ALL' || j.status === filterStatus;
    const matchesSearch = j.name.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#76B900]" />
            <span>Job Center & Queue Scheduler</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track state of AI training workloads, node assignment & execution logs</p>
        </div>
        <button
          onClick={() => onNavigate('/jobs/new')}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-[#76B900]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch AI Workload</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job by name or ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
          {['ALL', 'RUNNING', 'QUEUED', 'COMPLETED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition shrink-0 ${
                filterStatus === status
                  ? 'bg-[#76B900] text-black font-extrabold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/60">
                <th className="py-3.5 px-4">Job Name & ID</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Hardware Allocated</th>
                <th className="py-3.5 px-4">Status & Progress</th>
                <th className="py-3.5 px-4">Node ID</th>
                <th className="py-3.5 px-4">Total Cost</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-mono">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    No jobs match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-4 font-bold text-slate-200">
                      <div>{job.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{job.id}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300 text-xs font-sans">{job.projectName}</td>
                    <td className="py-4 px-4 text-xs text-cyan-400">{job.gpuType} x{job.gpuCount}</td>
                    <td className="py-4 px-4 w-52 font-sans">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                          job.status === 'RUNNING' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse' :
                          job.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          job.status === 'FAILED' ? 'bg-red-950 text-red-400 border border-red-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {job.status}
                        </span>
                        <span className="font-mono">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${
                            job.status === 'COMPLETED' ? 'bg-[#76B900]' : 
                            job.status === 'FAILED' ? 'bg-red-500' : 
                            'bg-gradient-to-r from-[#76B900] to-emerald-400 animate-pulse'
                          }`} 
                          style={{ width: `${job.progress}%` }} 
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">{job.assignedNodeId || 'Queued...'}</td>
                    <td className="py-4 px-4 text-xs font-bold text-[#76B900]">${job.totalCost.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onNavigate(`/jobs/${job.id}`)}
                        className="px-3 py-1.5 text-xs font-mono font-semibold bg-slate-800 hover:bg-[#76B900] hover:text-black text-slate-200 rounded transition"
                      >
                        Inspect Logs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
