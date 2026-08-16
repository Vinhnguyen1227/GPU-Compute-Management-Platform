import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Database, Cpu, Plus, Calendar, HardDrive, FileCode, CheckCircle2, PlayCircle, XCircle } from 'lucide-react';
import { Project, TrainingJob } from '../types';

interface ProjectDetailProps {
  project: Project;
  jobs: TrainingJob[];
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, jobs, onBack, onNavigate }) => {
  const { t } = useTranslation();
  const projectJobs = jobs.filter(j => j.projectId === project.id);

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-[#76B900] font-mono flex items-center gap-1 mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('project_detail.back')}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-emerald-950 text-[#76B900] rounded-full border border-emerald-800">
                {project.id}
              </span>
              <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">{project.description}</p>
          </div>

          <button
            onClick={() => onNavigate(`/jobs/new?projectId=${project.id}`)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-[#76B900]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('project_detail.launch_job')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">{t('project_detail.primary_dataset')}</div>
            <div className="text-sm font-bold text-slate-200 font-mono">{project.datasetName}</div>
            <div className="text-xs text-cyan-400 font-mono">{project.datasetSize}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 text-[#76B900] border border-emerald-800 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">{t('project_detail.total_executions')}</div>
            <div className="text-sm font-bold text-slate-200 font-mono">{projectJobs.length} {t('project_detail.jobs_executed')}</div>
            <div className="text-xs text-slate-400 font-mono">{t('project_detail.managed_by')}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">{t('project_detail.creation_date')}</div>
            <div className="text-sm font-bold text-slate-200 font-mono">{project.createdAt}</div>
            <div className="text-xs text-purple-400 font-mono">{t('project_detail.owner')}: {project.ownerId}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCode className="w-5 h-5 text-[#76B900]" />
          <span>{t('project_detail.training_jobs')}</span>
        </h2>

        {projectJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-sm">
            {t('project_detail.no_jobs')}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {projectJobs.map((job) => (
              <div key={job.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 p-3 rounded-xl transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 font-mono">{job.name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold ${
                      job.status === 'RUNNING' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse' :
                      job.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      job.status === 'FAILED' ? 'bg-red-950 text-red-400 border border-red-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    ID: {job.id} | GPU: <span className="text-cyan-400">{job.gpuType} x{job.gpuCount}</span> | Duration: {job.durationHours}h
                  </div>
                  <div className="text-xs text-slate-500 font-mono bg-slate-950 px-3 py-1 rounded border border-slate-800 w-fit">
                    $ {job.command}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono">
                    <div className="text-xs text-slate-400">{t('project_detail.total_billed')}</div>
                    <div className="text-sm font-bold text-[#76B900]">{job.totalCost.toLocaleString('vi-VN')}₫</div>
                  </div>
                  <button
                    onClick={() => onNavigate(`/jobs/${job.id}`)}
                    className="px-3 py-1.5 text-xs font-mono font-semibold bg-slate-800 hover:bg-[#76B900] hover:text-black text-slate-200 rounded transition"
                  >
                    {t('project_detail.logs_metrics')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
