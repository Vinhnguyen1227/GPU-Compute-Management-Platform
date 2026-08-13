import React, { useState } from 'react';
import { Cpu, Lock, Mail, User as UserIcon, Shield, ArrowRight } from 'lucide-react';
import { User, Role } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('alex.rivera@ai-cloud.io');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Alex Rivera');
  const [role, setRole] = useState<Role>('ENGINEER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: 'usr_001',
      name: name || 'Demo User',
      email: email,
      role: role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      balance: 450.00,
      currency: 'USD',
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#76B900]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#76B900] to-emerald-400 text-black font-extrabold text-2xl shadow-xl shadow-[#76B900]/25 mb-4">
            DGX
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Compute Cloud Platform</h1>
          <p className="text-sm text-slate-400 mt-1">Distributed GPU Orchestration & Job Scheduler</p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl">
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
                !isRegister
                  ? 'border-[#76B900] text-[#76B900]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
                isRegister
                  ? 'border-[#76B900] text-[#76B900]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="engineer@company.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['USER', 'ENGINEER', 'ADMIN'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 text-xs font-mono rounded-lg border transition ${
                        role === r
                          ? 'bg-[#76B900]/20 border-[#76B900] text-[#76B900] font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-6 py-3 px-4 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-[#76B900]/20"
            >
              <span>{isRegister ? 'Register Account' : 'Authenticate & Launch'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 font-mono">
              Protected by JWT & OAuth 2.0 Auth Service (.NET 9)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
