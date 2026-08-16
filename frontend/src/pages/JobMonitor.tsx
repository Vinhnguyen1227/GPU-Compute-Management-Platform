import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Square, Cpu, HardDrive, Flame, Terminal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrainingJob } from '../types';

interface JobMonitorProps {
  job: TrainingJob;
  onBack: () => void;
  onCancelJob: (jobId: string) => void;
}

export const JobMonitor: React.FC<JobMonitorProps> = ({ job, onBack, onCancelJob }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<string[]>([
    `[INIT] Loading model weights for ${job.name}...`,
    `[CUDA] GPU ${job.gpuType} x${job.gpuCount} initialized`,
    `[TRAIN] Starting training loop — batch_size=16, lr=2e-5`,
  ]);
  const [telemetry, setTelemetry] = useState<{ step: number; loss: number; gpuUtil: number; temp: number }[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initData = [
      { step: 100, loss: 2.84, gpuUtil: 88, temp: 62 },
      { step: 200, loss: 2.41, gpuUtil: 92, temp: 65 },
      { step: 300, loss: 1.94, gpuUtil: 95, temp: 67 },
      { step: 400, loss: 1.52, gpuUtil: 91, temp: 68 },
      { step: 500, loss: 1.21, gpuUtil: 94, temp: 68 },
    ];
    setTelemetry(initData);

    if (job.status !== 'RUNNING') return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const stepNum = (prev.length + 1) * 100;
        const newLoss = Math.max(0.1, 1.2 - prev.length * 0.05).toFixed(4);
        return [
          ...prev,
          `[TRAIN] Step ${stepNum} - Loss: ${newLoss} - Gradient Norm: 0.42 - Temp: 68°C`,
        ];
      });

      setTelemetry((prev) => {
        const lastStep = prev[prev.length - 1]?.step || 500;
        const nextStep = lastStep + 100;
        const newLoss = Math.max(0.1, prev[prev.length - 1].loss - 0.08);
        return [
          ...prev,
          { step: nextStep, loss: Number(newLoss.toFixed(2)), gpuUtil: Math.floor(85 + Math.random() * 10), temp: 68 },
        ];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [job]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-[#76B900] font-mono flex items-center gap-1 mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('monitor.back_jobs')}
        </button>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white font-mono">{job.name}</h1>
              <span className={`px-2.5 py-0.5 text-xs font-mono rounded font-semibold ${
                job.status === 'RUNNING' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse' :
                job.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                job.status === 'FAILED' ? 'bg-red-950 text-red-400 border border-red-800' :
                'bg-slate-800 text-slate-300'
              }`}>
                {job.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              ID: {job.id} | Node: <span className="text-[#76B900]">{job.assignedNodeId || 'node-h100-01'}</span> | Hardware: {job.gpuType} x{job.gpuCount}
            </p>
          </div>

          {job.status === 'RUNNING' && (
            <button
              onClick={() => onCancelJob(job.id)}
              className="px-4 py-2 rounded-lg bg-red-950/80 border border-red-800 text-red-400 hover:bg-red-900 font-mono font-bold text-xs flex items-center gap-2 transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> {t('monitor.terminate')}
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Metrics Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">{t('monitor.training_loss')}</h2>
              <p className="text-xs text-slate-400 font-mono">{t('monitor.realtime_convergence')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#76B900]">— {t('monitor.training_loss_label')}</span>
              <span className="text-cyan-400">— {t('monitor.gpu_util_label')}</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="step" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="loss" stroke="#76B900" strokeWidth={2} dot={false} name="Loss" />
                <Line type="monotone" dataKey="gpuUtil" stroke="#06B6D4" strokeWidth={2} dot={false} name="GPU Util %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Metrics Box */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <h2 className="text-base font-bold text-white mb-4">{t('monitor.node_telemetry')}</h2>
          <div className="space-y-4 font-mono">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> {t('monitor.gpu_load')}
              </span>
              <span className="text-sm font-bold text-cyan-400">94 %</span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" /> {t('monitor.vram_used')}
              </span>
              <span className="text-sm font-bold text-purple-400">61.4 GB / 80 GB</span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" /> {t('monitor.temperature')}
              </span>
              <span className="text-sm font-bold text-amber-400">68 °C</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Kafka Topic: job.started</span>
            <span className="text-[#76B900]">{t('monitor.worker_active')}</span>
          </div>
        </div>
      </div>

      {/* Live Terminal Log Viewer */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-[#76B900]" />
            <span>{t('monitor.terminal_output')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
        </div>

        <div className="p-5 bg-[#080C14] h-80 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 selection:bg-slate-700 selection:text-white">
          {logs.map((line, idx) => (
            <div key={idx} className="leading-relaxed">
              <span className="text-slate-600 mr-3">[{idx + 1}]</span>
              <span className={line.includes('TRAIN') ? 'text-emerald-400' : line.includes('CUDA') ? 'text-cyan-400' : 'text-slate-300'}>
                {line}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
