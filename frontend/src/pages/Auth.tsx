import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Lock, Mail, User as UserIcon, Shield, ArrowRight, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { User, Role } from '../types';
import { authApi } from '../api/authApi';

interface AuthProps {
  onLogin: (user: User) => void;
  onRegister: (newUser: Omit<User, 'id' | 'createdAt' | 'totalJobsRun'>) => User;
  usersList: User[];
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, usersList }) => {
  const { t, i18n } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const handleQuickAdmin = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.login('admin@dgx-compute.io', 'Admin@2026!');
      if (res && res.user) {
        onLogin(res.user);
        return;
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
    const admin = usersList.find(u => u.role === 'ADMIN') || usersList[0];
    onLogin(admin);
  };

  const handleQuickUser = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.login('developer@ai-cloud.io', 'User@2026!');
      if (res && res.user) {
        onLogin(res.user);
        return;
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
    const dev = usersList.find(u => u.role === 'USER') || usersList[1];
    onLogin(dev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setErrorMsg(t('auth.password_mismatch'));
          setIsLoading(false);
          return;
        }

        try {
          const res = await authApi.register(email, password, name || email.split('@')[0]);
          if (res && res.user) {
            setSuccessMsg(t('auth.register_success'));
            setTimeout(() => {
              onLogin(res.user);
            }, 800);
            return;
          }
        } catch (apiErr: any) {
          // If backend API fails, fallback to local register
          if (usersList.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setErrorMsg(t('auth.email_exists'));
            setIsLoading(false);
            return;
          }

          const createdUser = onRegister({
            name: name || email.split('@')[0],
            email: email.toLowerCase(),
            role: 'USER',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
            balance: 100000,
            currency: 'VND',
            status: 'ACTIVE',
          });

          setSuccessMsg(t('auth.register_success'));
          setTimeout(() => {
            onLogin(createdUser);
          }, 800);
          return;
        }
      } else {
        try {
          const res = await authApi.login(email, password);
          if (res && res.user) {
            onLogin(res.user);
            return;
          }
        } catch (apiErr: any) {
          // Fallback to local user check
          const found = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (!found) {
            if (email.includes('admin')) {
              handleQuickAdmin();
            } else {
              onLogin({
                id: `usr_${Date.now()}`,
                name: email.split('@')[0] || 'AI Developer',
                email: email || 'user@ai-cloud.io',
                role: 'USER',
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                balance: 5000000,
                currency: 'VND',
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                totalJobsRun: 0,
              });
            }
          } else {
            if (found.status === 'BANNED') {
              setErrorMsg('Tài khoản này đã bị khóa bởi Quản trị viên!');
              setIsLoading(false);
              return;
            }
            onLogin(found);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#76B900]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center bg-slate-900/80 rounded-lg border border-slate-800 overflow-hidden backdrop-blur-sm">
        <button
          onClick={() => switchLang('vi')}
          className={`px-3 py-2 text-xs font-bold transition ${
            i18n.language === 'vi' || i18n.language.startsWith('vi')
              ? 'bg-[#76B900] text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🇻🇳 VI
        </button>
        <button
          onClick={() => switchLang('en')}
          className={`px-3 py-2 text-xs font-bold transition ${
            i18n.language === 'en' || i18n.language.startsWith('en')
              ? 'bg-[#76B900] text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🇬🇧 EN
        </button>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#76B900] to-emerald-400 text-black font-extrabold text-2xl shadow-xl shadow-[#76B900]/25 mb-3">
            DGX
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('auth.title')}</h1>
          <p className="text-xs text-slate-400 mt-1">{t('auth.subtitle')}</p>
        </div>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            onClick={handleQuickAdmin}
            disabled={isLoading}
            className="py-2.5 px-3 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-300 hover:bg-purple-900/60 transition text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('auth.quick_admin')}</span>
          </button>
          <button
            type="button"
            onClick={handleQuickUser}
            disabled={isLoading}
            className="py-2.5 px-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[#76B900] hover:bg-emerald-900/60 transition text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <UserIcon className="w-3.5 h-3.5 text-[#76B900]" />
            <span>{t('auth.quick_user')}</span>
          </button>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel rounded-2xl p-7 border border-slate-800 shadow-2xl">
          <div className="flex border-b border-slate-800 mb-5">
            <button
              onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
                !isRegister
                  ? 'border-[#76B900] text-[#76B900]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.sign_in')}
            </button>
            <button
              onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
                isRegister
                  ? 'border-[#76B900] text-[#76B900]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.create_account')}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs text-red-300 font-mono mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-[#76B900] font-mono mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#76B900] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('auth.full_name')}</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="developer@ai-cloud.io"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('auth.confirm_password')}</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#76B900]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-[#76B900]/20 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Đang xử lý...' : (isRegister ? t('auth.register') : t('auth.authenticate'))}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 font-mono">
              {t('auth.protected_by')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

