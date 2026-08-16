import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Play, Terminal, Calculator, AlertTriangle, ShieldCheck, Zap, Info } from 'lucide-react';
import { Project, GPUType, TrainingJob } from '../types';

interface SubmitJobProps {
  projects: Project[];
  onSubmitJob: (jobData: Omit<TrainingJob, 'id' | 'createdAt' | 'status' | 'progress'>) => void;
  onNavigate: (path: string) => void;
  userBalance: number;
}

const gpuPricing: Record<GPUType, number> = {
  'NVIDIA H100 (80GB)': 112500,
  'NVIDIA A100 (80GB)': 50000,
  'NVIDIA RTX 4090 (24GB)': 20000,
  'NVIDIA L40S (48GB)': 37500,
};

export const SubmitJob: React.FC<SubmitJobProps> = ({ projects, onSubmitJob, onNavigate, userBalance }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [gpuType, setGpuType] = useState<GPUType>('NVIDIA A100 (80GB)');
  const [gpuCount, setGpuCount] = useState(1);
  const [durationHours, setDurationHours] = useState(4);
  const [command, setCommand] = useState('torchrun --nproc_per_node=1 train.py --model_name llama-3');
  const [framework] = useState('PyTorch 2.4 + CUDA 12.4');

  const costPerHour = gpuPricing[gpuType] * gpuCount;
  const minRequiredBalance = costPerHour * durationHours;
  const isInsufficient = userBalance < minRequiredBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isInsufficient) return;
    const selectedProject = projects.find(p => p.id === projectId);
    onSubmitJob({
      name,
      projectId,
      projectName: selectedProject?.name || '',
      gpuType,
      gpuCount,
      durationHours,
      costPerHour: gpuPricing[gpuType],
      totalCost: 0, // Starts at 0 in Pay-As-You-Go; accumulates live
      command,
      framework,
    });
    onNavigate('/jobs');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-[#76B900]" />
          <span>{t('submit_job.title')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t('submit_job.subtitle')}</p>
      </div>

      {/* Pay-as-you-go Banner */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20 flex items-start gap-3">
        <Zap className="w-5 h-5 text-[#76B900] shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-bold text-[#76B900] uppercase tracking-wider">{t('submit_job.pay_as_you_go_badge')}</div>
          <div className="text-slate-300 mt-0.5">{t('submit_job.pay_as_you_go_desc')}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Configuration */}
        <div className="lg:col-span-2 space-y-5 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">{t('submit_job.job_config')}</div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">{t('submit_job.job_name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('submit_job.job_name_placeholder')}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-[#76B900] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">{t('submit_job.target_project')}</label>
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
              {t('submit_job.gpu_hardware')}
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
                    <span className="text-slate-400 font-mono">{t('submit_job.rate_per_gpu')}</span>
                    <span className="font-bold text-[#76B900] font-mono">{gpuPricing[type].toLocaleString('vi-VN')}₫/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GPU Count & Estimated Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">{t('submit_job.gpu_cards')}</label>
              <select
                value={gpuCount}
                onChange={(e) => setGpuCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-[#76B900] font-bold"
              >
                {[1, 2, 4, 8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? t('submit_job.gpu_node') : t('submit_job.gpus_parallel')}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">{t('submit_job.runtime')}</label>
              </div>
              <input
                type="number"
                min={1}
                max={48}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-[#76B900] focus:outline-none font-bold"
              />
              <p className="text-[11px] text-slate-500 font-mono mt-1">{t('submit_job.runtime_help')}</p>
            </div>
          </div>

          {/* Command String */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('submit_job.command')}
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
                <span>{t('submit_job.billing_title')}</span>
              </h2>

              <div className="space-y-3 font-mono text-xs border-b border-slate-800 pb-4 mb-4">
                <div className="flex justify-between text-slate-400">
                  <span>{t('submit_job.selected_gpu')}</span>
                  <span className="text-slate-200">{gpuType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('submit_job.gpu_count')}</span>
                  <span className="text-slate-200">x{gpuCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('submit_job.hourly_rate')}</span>
                  <span className="text-cyan-400">{costPerHour.toLocaleString('vi-VN')}₫/hr</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('submit_job.duration')}</span>
                  <span className="text-slate-200">{durationHours} {t('submit_job.hours')}</span>
                </div>
              </div>

              <div className="mb-6 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#76B900]" />
                  <span>{t('submit_job.min_balance_required')}</span>
                </div>
                <div className="text-2xl font-extrabold text-[#76B900]">{minRequiredBalance.toLocaleString('vi-VN')}₫</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  (Ví hiện có: <span className="text-slate-300 font-bold">{userBalance.toLocaleString('vi-VN')}₫</span> — Chỉ thanh toán thời gian chạy thực tế)
                </div>
              </div>

              {isInsufficient && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-start gap-2.5 text-xs text-red-300 font-mono mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">{t('submit_job.insufficient')}</div>
                    <div>{t('submit_job.insufficient_desc', { balance: userBalance.toLocaleString('vi-VN') + '₫', cost: minRequiredBalance.toLocaleString('vi-VN') + '₫' })}</div>
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
                  {t('submit_job.top_up_wallet')}
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
                <span>{t('submit_job.submit_scheduler')}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
