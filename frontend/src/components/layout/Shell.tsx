import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  FolderKanban, 
  PlusCircle, 
  Cpu, 
  Server, 
  Wallet, 
  ShieldCheck, 
  Activity, 
  LogOut, 
  Bell, 
  Search,
  ExternalLink,
  ChevronRight,
  Globe
} from 'lucide-react';
import { User } from '../../types';

interface ShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: User;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ currentPath, onNavigate, user, children }) => {
  const { t, i18n } = useTranslation();

  const navItems = [
    { path: '/dashboard', label: t('nav.cluster_overview'), icon: LayoutDashboard },
    { path: '/projects', label: t('nav.projects'), icon: FolderKanban },
    { path: '/jobs/new', label: t('nav.submit_job'), icon: PlusCircle, highlight: true },
    { path: '/jobs', label: t('nav.jobs_queue'), icon: Cpu, badge: `2 ${t('common.active')}` },
    { path: '/resources', label: t('nav.gpu_cluster_nodes'), icon: Server },
    { path: '/billing', label: t('nav.wallet_billing'), icon: Wallet },
  ];

  if (user.role === 'ADMIN' || user.role === 'ENGINEER') {
    navItems.push({ path: '/admin', label: t('nav.admin_console'), icon: ShieldCheck });
  }

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className="flex h-screen bg-[#0B0F17] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col z-20">
        {/* Brand Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-[#76B900]/20">
            DGX
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>Compute Cloud</span>
              <span className="text-[10px] bg-[#76B900]/20 text-[#76B900] px-1.5 py-0.5 rounded font-mono border border-[#76B900]/40">v2.4</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Mini DGX Orchestrator</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
            {t('nav.compute_platform')}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#76B900]/20 to-transparent text-[#76B900] border-l-2 border-[#76B900] font-semibold'
                    : item.highlight
                    ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-800/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#76B900]' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Health Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-2 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#76B900] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#76B900]"></span>
              </span>
              {t('nav.kafka_cluster')}
            </span>
            <span className="text-[#76B900] font-mono">{t('nav.operational')}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-[#76B900] to-emerald-400 h-full w-[94%]" />
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between z-10">
          {/* Search bar */}
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={t('common.search_placeholder')}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#76B900]/60 focus:ring-1 focus:ring-[#76B900]/40 transition"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Wallet Balance Pill */}
            <button
              onClick={() => onNavigate('/billing')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 transition cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-[#76B900]" />
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider leading-none">{t('common.wallet_balance')}</div>
                <div className="text-xs font-bold text-[#76B900]">{user.balance.toLocaleString('vi-VN')}₫</div>
              </div>
              <span className="ml-1 text-[10px] bg-[#76B900] text-black px-1.5 py-0.5 rounded font-semibold hover:bg-emerald-400">
                {t('common.top_up')}
              </span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
              <button
                onClick={() => switchLang('vi')}
                className={`px-2.5 py-1.5 text-xs font-bold transition ${
                  i18n.language === 'vi' || i18n.language.startsWith('vi')
                    ? 'bg-[#76B900] text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                VI
              </button>
              <button
                onClick={() => switchLang('en')}
                className={`px-2.5 py-1.5 text-xs font-bold transition ${
                  i18n.language === 'en' || i18n.language.startsWith('en')
                    ? 'bg-[#76B900] text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#76B900] rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</div>
                <div className="text-[10px] text-[#76B900] font-mono">{user.role} {t('common.access')}</div>
              </div>
              <button 
                onClick={() => onNavigate('/login')}
                title={t('common.sign_out')}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
