import React from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Cpu, Flame, HardDrive, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { GPUNode } from '../types';

interface ResourceClusterProps {
  nodes: GPUNode[];
}

export const ResourceCluster: React.FC<ResourceClusterProps> = ({ nodes }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-[#76B900]" />
            <span>{t('resources.title')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('resources.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#76B900] bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
          <ShieldCheck className="w-4 h-4" /> {t('resources.redis_lock')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node) => {
          const isBusy = node.status === 'BUSY';
          const isMaint = node.status === 'MAINTENANCE';

          return (
            <div
              key={node.id}
              className={`glass-panel rounded-2xl p-6 border transition flex flex-col justify-between ${
                isBusy ? 'border-cyan-800/80 bg-cyan-950/20' :
                isMaint ? 'border-amber-800/80 bg-amber-950/20' :
                'border-slate-800 hover:border-emerald-800/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#76B900] bg-[#76B900]/10 px-2 py-0.5 rounded border border-[#76B900]/20">
                    {node.id}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                    node.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                    node.status === 'BUSY' ? 'bg-cyan-950 text-cyan-400 border-cyan-800 animate-pulse' :
                    'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {node.status}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white font-mono">{node.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{node.gpuModel}</p>

                <div className="mt-6 space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" /> {t('resources.gpu_load')}
                      </span>
                      <span className="text-cyan-400 font-bold">{node.gpuUtilPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: `${node.gpuUtilPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-purple-400" /> {t('resources.vram')}
                      </span>
                      <span className="text-purple-400 font-bold">{node.usedMemoryGB} / {node.totalMemoryGB} GB</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-400 h-full" style={{ width: `${(node.usedMemoryGB / node.totalMemoryGB) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> {t('resources.temperature')}
                      </span>
                      <span className="text-amber-400 font-bold">{node.temperatureC} °C</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${node.temperatureC > 75 ? 'bg-red-500' : node.temperatureC > 60 ? 'bg-amber-400' : 'bg-[#76B900]'}`} 
                        style={{ width: `${(node.temperatureC / 100) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 font-mono text-xs text-slate-400">
                {isBusy ? (
                  <div className="text-cyan-400 truncate">
                    {t('resources.running')} <span className="font-bold">{node.currentJobName}</span>
                  </div>
                ) : isMaint ? (
                  <div className="text-amber-400 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" /> {t('resources.maintenance')}
                  </div>
                ) : (
                  <div className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('resources.ready')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
