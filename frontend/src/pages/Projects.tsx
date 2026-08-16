import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderKanban, Plus, Database, Cpu, Calendar, ArrowRight, Layers } from 'lucide-react';
import { Project } from '../types';

interface ProjectsProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: (proj: Omit<Project, 'id' | 'createdAt' | 'jobCount' | 'ownerId'>) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ projects, onSelectProject, onCreateProject }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [datasetSize, setDatasetSize] = useState('10 GB');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onCreateProject({
      name,
      description,
      datasetName: datasetName || 'dataset_v1.zip',
      datasetSize: datasetSize || '5.0 GB',
    });
    setShowModal(false);
    setName('');
    setDescription('');
    setDatasetName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#76B900]" />
            <span>{t('projects.title')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('projects.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-[#76B900]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('projects.create')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className="glass-panel glass-panel-hover rounded-xl p-6 border border-slate-800 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-950 text-[#76B900] rounded-full border border-emerald-800/60">
                  {p.id}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {p.createdAt.split(' ')[0]}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#76B900] transition flex items-center gap-2">
                {p.name}
              </h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> {t('projects.dataset')}
                </span>
                <span className="text-slate-200 truncate max-w-[140px]">{p.datasetName} ({p.datasetSize})</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#76B900]" /> {t('projects.job_executions')}
                </span>
                <span className="text-[#76B900] font-bold">{p.jobCount} {t('projects.runs')}</span>
              </div>
              <div className="pt-2 flex items-center justify-end text-xs text-[#76B900] font-semibold group-hover:translate-x-1 transition-transform">
                {t('projects.open_workspace')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-4">{t('projects.create_title')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('projects.project_name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('projects.project_name_placeholder')}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-[#76B900] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('projects.description_label')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('projects.description_placeholder')}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-[#76B900] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t('projects.dataset_name')}</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="dataset.zip"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-[#76B900] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t('projects.est_size')}</label>
                  <input
                    type="text"
                    value={datasetSize}
                    onChange={(e) => setDatasetSize(e.target.value)}
                    placeholder="25 GB"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-[#76B900] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#76B900] text-black font-extrabold text-xs hover:bg-emerald-400 transition"
                >
                  {t('projects.create_project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
