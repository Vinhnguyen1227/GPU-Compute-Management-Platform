import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Server, Users, Activity, Sliders, AlertTriangle, Play, PauseCircle } from 'lucide-react';
import { GPUNode } from '../types';

interface AdminConsoleProps {
  nodes: GPUNode[];
  onToggleNodeStatus: (nodeId: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ nodes, onToggleNodeStatus }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#76B900]" />
          <span>{t('admin.title')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t('admin.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase">{t('admin.kafka_lag')}</div>
          <div className="text-2xl font-bold text-[#76B900] mt-1">0.04 ms</div>
          <div className="text-[11px] text-slate-500 mt-1">Topics: job.created, job.assigned</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase">{t('admin.rate_limit')}</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">10,000 req/min</div>
          <div className="text-[11px] text-slate-500 mt-1">{t('admin.managed_gateway')}</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase">{t('admin.scheduler_lock')}</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">Active (Redis)</div>
          <div className="text-[11px] text-slate-500 mt-1">{t('admin.prevents_over')}</div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-[#76B900]" />
          <span>{t('admin.node_drain')}</span>
        </h2>

        <div className="divide-y divide-slate-800/80 font-mono">
          {nodes.map(node => (
            <div key={node.id} className="py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{node.name}</span>
                  <span className="text-xs text-slate-500">({node.id})</span>
                </div>
                <div className="text-xs text-slate-400">{node.gpuModel} | Status: <span className="text-[#76B900]">{node.status}</span></div>
              </div>

              <button
                onClick={() => onToggleNodeStatus(node.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  node.status === 'MAINTENANCE'
                    ? 'bg-emerald-950 border border-emerald-800 text-[#76B900]'
                    : 'bg-amber-950 border border-amber-800 text-amber-400 hover:bg-amber-900'
                }`}
              >
                {node.status === 'MAINTENANCE' ? (
                  <>
                    <Play className="w-3.5 h-3.5" /> {t('admin.re_enable')}
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5" /> {t('admin.set_maintenance')}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
