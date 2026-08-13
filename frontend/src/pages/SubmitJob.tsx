import React, { useState } from 'react';
import { Cpu, Zap, Calculator, Terminal, Play, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Project, GPUType, TrainingJob } from '../types';

interface SubmitJobProps {
  projects: Project[];
  onSubmitJob: (job: Omit<TrainingJob, 'id' | 'createdAt' | 'status' | 'progress'>) => void;
  onNavigate: (path: string) => void;
  userBalance: number;
}

export const SubmitJob: React.FC<SubmitJobProps> = ({ projects, onSubmitJob, onNavigate, userBalance }) => {
  const [name, setName] = useState('Llama-3-FineTune-Run-04');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj-01');
  const [gpuType, setGpuType] = useState<GPUType>('NVIDIA H100 (80GB)');
  const [gpuCount, setGpuCount] = useState<number>(4);
  const [durationHours, setDurationHours] = useState<number>(5);
  const [command, setCommand] = useState('torchrun --nproc_per_node=4 train.py --model_name llama-3-70b --batch_size 16 --lr 2e-5');
  const [framework, setFramework] = useState('PyTorch 2.4 + CUDA 12.4');

  const gpuPricing: Record<GPUType, number> = {
    'NVIDIA H100 (80GB)': 4.50,
    'NVIDIA A100 (80GB)': 2.00,
    'NVIDIA L40S (48GB)': 1.40,
    'NVIDIA RTX 4090 (24GB)': 0.80,
  };

  const costPerHour = (gpuPricing[gpuType] || 2.00) * gpuCount;
  const totalCost = costPerHour * durationHours;
  const selectedProject = projects.find(p => p.id === projectId);
  const isInsufficient = totalCost > userBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient) return;

    onSubmitJob({
      name,
      projectId,
      projectName: selectedProject?.name || 'AI Project',
      gpuType,
      gpuCount,
      durationHours,
      costPerHour,
      totalCost,
      command,
      framework,
    });

    onNavigate('/jobs');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('/jobs')}
          className="text-xs text-slate-400 hover:text-[#76B900] font-mono flex items-center gap-1 mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Center
        </button>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#76B900]" />
          <span>Submit AI Training Workload</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Configure compute specifications, hardware allocation & job execution parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Controls Left */}
        <div className="lg:col-span-2 space-y-6 glass-panel p-6 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">Job Identifier</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-[#76B900] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">Target Project Workspace</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 focus:border-[#76B900] focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>

          {/* GPU Hardware Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-3">
              GPU Acceleration Hardware
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(gpuPricing) as GPUType[]).map((type) => (
                <div
                  key={type}
                  onClick={() => setGpuType(type)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    gpuType === type
                      ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-[#76B900] shadow-md shadow-[#76B900]/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white">{type}</span>
                    <Cpu className={`w-4 h-4 ${gpuType === type ? 'text-[#76B900]' : 'text-slate-500'}`} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 font-mono">Rate per GPU</span>
                    <span className="font-bold text-[#76B900] font-mono">${gpuPricing[type].toFixed(2)}/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GPU Count & Max Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">GPU Cards requested</label>
              <select
                value={gpuCount}
                onChange={(e) => setGpuCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-[#76B900] font-bold"
              >
                {[1, 2, 4, 8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'GPU Node' : 'GPUs (Parallel Distributed)'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">Estimated Runtime (Hours)</label>
              <input
                type="number"
                min={1}
                max={48}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-[#76B900] focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Command String */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Execution Command String
            </label>
            <div className="relative">
              <Terminal className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                rows={3}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:border-[#76B900] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cost Summary & Submission Card Right */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between h-full">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-cyan-400" />
                <span>Job Billing Estimation</span>
              </h2>

              <div className="space-y-3 font-mono text-xs border-b border-slate-800 pb-4 mb-4">
                <div className="flex justify-between text-slate-400">
                  <span>Selected GPU</span>
                  <span className="text-slate-200">{gpuType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GPU Count</span>
                  <span className="text-slate-200">x{gpuCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hourly Hardware Rate</span>
                  <span className="text-cyan-400">${costPerHour.toFixed(2)}/hr</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Duration</span>
                  <span className="text-slate-200">{durationHours} Hours</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-6 font-mono">
                <span className="text-xs uppercase font-bold text-slate-300">Total Billed Cost</span>
                <span className="text-2xl font-extrabold text-[#76B900]">${totalCost.toFixed(2)} USD</span>
              </div>

              {isInsufficient && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-start gap-2.5 text-xs text-red-300 font-mono mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Insufficient Wallet Balance</div>
                    <div>Your balance (${userBalance.toFixed(2)}) is less than total estimated cost (${totalCost.toFixed(2)}).</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {isInsufficient && (
                <button
                  type="button"
                  onClick={() => onNavigate('/billing')}
                  className="w-full py-2.5 rounded-lg bg-emerald-950 text-[#76B900] font-mono font-bold text-xs border border-emerald-800 hover:bg-emerald-900 transition"
                >
                  Top Up Wallet Balance
                </button>
              )}

              <button
                type="submit"
                disabled={isInsufficient}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                  isInsufficient
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-[#76B900] to-emerald-400 text-black hover:opacity-95 shadow-[#76B900]/20 cursor-pointer'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Submit Job To Scheduler</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
