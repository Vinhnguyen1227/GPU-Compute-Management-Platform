import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, Server, Users, Activity, DollarSign, AlertTriangle, 
  Play, PauseCircle, TrendingUp, UserPlus, Ban, CheckCircle, RefreshCw, 
  Square, Edit3, Save, Zap, Clock, CreditCard
} from 'lucide-react';
import { GPUNode, User, TrainingJob, Transaction, GPUType, Role } from '../types';

interface AdminConsoleProps {
  nodes: GPUNode[];
  users: User[];
  jobs: TrainingJob[];
  transactions: Transaction[];
  gpuPricing: Record<GPUType, number>;
  onToggleNodeStatus: (nodeId: string) => void;
  onUpdateUserRole: (userId: string, newRole: Role) => void;
  onAdjustUserBalance: (userId: string, amount: number) => void;
  onToggleUserStatus: (userId: string) => void;
  onUpdateGpuPricing: (gpuType: GPUType, newRate: number) => void;
  onForceKillJob: (jobId: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  nodes,
  users,
  jobs,
  transactions,
  gpuPricing,
  onToggleNodeStatus,
  onUpdateUserRole,
  onAdjustUserBalance,
  onToggleUserStatus,
  onUpdateGpuPricing,
  onForceKillJob,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'nodes' | 'users' | 'jobs' | 'revenue'>('nodes');
  const [searchUser, setSearchUser] = useState('');
  const [pricingDraft, setPricingDraft] = useState<Record<GPUType, number>>(gpuPricing);
  const [pricingSuccess, setPricingSuccess] = useState(false);
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState(500000);

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    (Object.keys(pricingDraft) as GPUType[]).forEach((type) => {
      onUpdateGpuPricing(type, pricingDraft[type]);
    });
    setPricingSuccess(true);
    setTimeout(() => setPricingSuccess(false), 2500);
  };

  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserForCredit) {
      onAdjustUserBalance(selectedUserForCredit.id, creditAmount);
      setSelectedUserForCredit(null);
    }
  };

  // Financial Stats Calculation
  const totalRevenueDeposited = transactions
    .filter(tx => tx.type === 'DEPOSIT' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalComputeBilled = transactions
    .filter(tx => tx.type === 'GPU_USAGE')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.id.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#76B900]" />
            <span>{t('admin.title')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('admin.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-950/80 px-3 py-1.5 rounded-lg border border-purple-800 text-purple-300 font-mono text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>SUPER ADMIN ACTIVE</span>
        </div>
      </div>

      {/* 4-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { key: 'nodes', label: t('admin.tabs.nodes'), icon: Server },
          { key: 'users', label: t('admin.tabs.users'), icon: Users },
          { key: 'jobs', label: t('admin.tabs.jobs'), icon: Activity },
          { key: 'revenue', label: t('admin.tabs.revenue'), icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition shrink-0 ${
                isActive
                  ? 'bg-[#76B900] text-black shadow-lg shadow-[#76B900]/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: NODES & PRICING */}
      {activeTab === 'nodes' && (
        <div className="space-y-6">
          {/* Live GPU Pricing Config Box */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Edit3 className="w-4 h-4 text-[#76B900]" />
                <span>{t('admin.pricing_title')}</span>
              </h2>
              {pricingSuccess && (
                <span className="text-xs text-[#76B900] font-mono font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {t('admin.pricing_updated')}
                </span>
              )}
            </div>

            <form onSubmit={handleSavePricing} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(pricingDraft) as GPUType[]).map((type) => (
                <div key={type} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-white font-mono mb-2">{type}</div>
                  <div className="relative">
                    <input
                      type="number"
                      value={pricingDraft[type]}
                      onChange={(e) => setPricingDraft({ ...pricingDraft, [type]: Number(e.target.value) })}
                      step={5000}
                      min={10000}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-[#76B900] font-bold focus:border-[#76B900] focus:outline-none"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {pricingDraft[type].toLocaleString('vi-VN')}₫ / giờ
                    </div>
                  </div>
                </div>
              ))}

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#76B900] text-black font-extrabold text-xs font-mono hover:bg-emerald-400 transition flex items-center gap-2 shadow-lg shadow-[#76B900]/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('admin.save_pricing')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Node Drainage Grid */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-[#76B900]" />
              <span>{t('admin.node_drain')}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
              {nodes.map(node => (
                <div key={node.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{node.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                        node.status === 'AVAILABLE' ? 'bg-emerald-950 text-[#76B900] border border-emerald-800' :
                        node.status === 'BUSY' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {node.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{node.gpuModel}</div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      Load: {node.gpuUtilPercent}% | VRAM: {node.usedMemoryGB}/{node.totalMemoryGB}GB | Temp: {node.temperatureC}°C
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => onToggleNodeStatus(node.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        node.status === 'MAINTENANCE'
                          ? 'bg-emerald-950 border border-emerald-800 text-[#76B900] hover:bg-emerald-900'
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Tìm kiếm người dùng theo tên, email, ID..."
              className="w-80 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
            />
            <div className="text-xs font-mono text-slate-400">
              Tổng số người dùng: <span className="text-[#76B900] font-bold">{users.length}</span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/60">
                    <th className="py-3 px-4">{t('admin.user_table.user')}</th>
                    <th className="py-3 px-4">{t('admin.user_table.role')}</th>
                    <th className="py-3 px-4">{t('admin.user_table.balance')}</th>
                    <th className="py-3 px-4">{t('admin.user_table.status')}</th>
                    <th className="py-3 px-4">{t('admin.user_table.joined')}</th>
                    <th className="py-3 px-4 text-right">{t('admin.user_table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img src={u.avatarUrl} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                          <div>
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-500">{u.email} ({u.id})</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => onUpdateUserRole(u.id, e.target.value as Role)}
                          className={`px-2 py-1 rounded text-xs font-bold border focus:outline-none bg-slate-900 ${
                            u.role === 'ADMIN' ? 'text-purple-400 border-purple-800' :
                            u.role === 'ENGINEER' ? 'text-cyan-400 border-cyan-800' :
                            'text-[#76B900] border-emerald-800'
                          }`}
                        >
                          <option value="USER">USER</option>
                          <option value="ENGINEER">ENGINEER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#76B900]">
                        {u.balance.toLocaleString('vi-VN')}₫
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-950 text-[#76B900] border border-emerald-800' :
                          'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.createdAt?.split(' ')[0] || '2026-08-01'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUserForCredit(u)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-[#76B900] hover:text-black text-slate-200 text-xs font-bold transition"
                          >
                            + / - Tiền
                          </button>
                          <button
                            onClick={() => onToggleUserStatus(u.id)}
                            className={`p-1 rounded text-xs transition ${
                              u.status === 'ACTIVE'
                                ? 'bg-red-950/60 border border-red-800 text-red-400 hover:bg-red-900'
                                : 'bg-emerald-950/60 border border-emerald-800 text-[#76B900] hover:bg-emerald-900'
                            }`}
                            title={u.status === 'ACTIVE' ? t('admin.ban_user') : t('admin.unban_user')}
                          >
                            {u.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL JOBS INSPECTOR */}
      {activeTab === 'jobs' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#76B900]" />
              <span>{t('admin.tabs.jobs')}</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Tổng tác vụ: <span className="text-[#76B900] font-bold">{jobs.length}</span>
            </span>
          </div>

          <div className="overflow-x-auto font-mono text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/60">
                  <th className="py-3 px-4">Job Name & ID</th>
                  <th className="py-3 px-4">Hardware</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Node</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{j.name}</div>
                      <div className="text-[10px] text-slate-500">{j.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-400">{j.gpuType} x{j.gpuCount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.status === 'RUNNING' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse' :
                        j.status === 'COMPLETED' ? 'bg-emerald-950 text-[#76B900] border border-emerald-800' :
                        'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{j.assignedNodeId || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-300">{j.userId || 'usr_001'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {j.status === 'RUNNING' ? (
                        <button
                          onClick={() => {
                            if (window.confirm(t('admin.force_kill_confirm'))) {
                              onForceKillJob(j.id);
                            }
                          }}
                          className="px-3 py-1 bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 rounded font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>{t('admin.force_kill')}</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REVENUE ANALYTICS */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider">{t('admin.total_revenue')}</div>
              <div className="text-3xl font-extrabold text-[#76B900] mt-2">
                +{totalRevenueDeposited.toLocaleString('vi-VN')}₫
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Qua VietQR, VNPay & MoMo</div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider">{t('admin.total_compute_billed')}</div>
              <div className="text-3xl font-extrabold text-cyan-400 mt-2">
                {totalComputeBilled.toLocaleString('vi-VN')}₫
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Khấu trừ tự động GPU runtime</div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Lợi Nhuận Nền Tảng (Gross Margin)</div>
              <div className="text-3xl font-extrabold text-purple-400 mt-2">
                {(totalRevenueDeposited - totalComputeBilled).toLocaleString('vi-VN')}₫
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Số dư lưu ký người dùng</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Manual Wallet Credit Adjustment */}
      {selectedUserForCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative font-mono">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#76B900]" />
              <span>Điều Chỉnh Số Dư Ví Người Dùng</span>
            </h2>
            <div className="text-xs text-slate-400 mb-4">
              Người nhận: <span className="text-white font-bold">{selectedUserForCredit.name}</span> ({selectedUserForCredit.email})
            </div>

            <form onSubmit={handleCreditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Số Tiền Điều Chỉnh (+ cộng tiền / - trừ tiền)</label>
                <input
                  type="number"
                  step={50000}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-[#76B900] font-bold focus:border-[#76B900] focus:outline-none"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Giá trị: {creditAmount >= 0 ? '+' : ''}{creditAmount.toLocaleString('vi-VN')}₫
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCredit(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#76B900] text-black text-xs font-extrabold hover:bg-emerald-400"
                >
                  Xác Nhận Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
