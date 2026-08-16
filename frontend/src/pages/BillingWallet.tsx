import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, ArrowDownToLine, ArrowUpRight, TrendingDown, History, QrCode, Copy, Check, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';

interface BillingWalletProps {
  balance: number;
  transactions: Transaction[];
  onTopUp: (amount: number, method: 'VietQR' | 'VNPay' | 'MoMo') => void;
}

const MB_BANK_BIN = '970422';
const MB_ACCOUNT_NO = '0932296788';
const MB_ACCOUNT_NAME = 'HOANG ANH TUAN';

const MIN_DEPOSIT = 50000;
const MAX_DEPOSIT = 10000000;

export const BillingWallet: React.FC<BillingWalletProps> = ({ balance, transactions, onTopUp }) => {
  const { t } = useTranslation();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(100000);
  const [paymentGateway, setPaymentGateway] = useState<'VietQR' | 'VNPay' | 'MoMo'>('VietQR');
  const [showQR, setShowQR] = useState(false);
  const [transferCode, setTransferCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [amountError, setAmountError] = useState('');

  const generateTransferCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const vietQrUrl = `https://img.vietqr.io/image/${MB_BANK_BIN}-${MB_ACCOUNT_NO}-compact2.png?amount=${depositAmount}&addInfo=${transferCode}&accountName=${encodeURIComponent(MB_ACCOUNT_NAME)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(transferCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const validateAmount = (amount: number) => {
    if (amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
      setAmountError(t('billing.amount_error'));
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAmount(depositAmount)) return;
    setTransferCode(generateTransferCode());
    setShowQR(true);
  };

  const handleConfirmPaid = () => {
    onTopUp(depositAmount, paymentGateway);
    setShowQR(false);
    setShowDepositModal(false);
    setDepositAmount(100000);
  };

  const totalDeposited = transactions
    .filter(tx => tx.type === 'DEPOSIT' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpent = transactions
    .filter(tx => tx.type === 'GPU_USAGE' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const presets = [
    { vnd: 50000, label: '50K' },
    { vnd: 100000, label: '100K' },
    { vnd: 500000, label: '500K' },
    { vnd: 1000000, label: '1M' },
    { vnd: 5000000, label: '5M' },
    { vnd: 10000000, label: '10M' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#76B900]" />
            <span>{t('billing.title')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('billing.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowDepositModal(true)}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-sm flex items-center gap-2 hover:opacity-95 transition shadow-lg shadow-[#76B900]/20"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>{t('common.top_up')}</span>
        </button>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">{t('billing.current_balance')}</div>
          <div className="mt-2 text-3xl font-extrabold text-[#76B900] font-mono">{balance.toLocaleString('vi-VN')}₫</div>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">{t('billing.total_deposited')}</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400 font-mono">+{totalDeposited.toLocaleString('vi-VN')}₫</div>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">{t('billing.compute_spent')}</div>
          <div className="mt-2 text-3xl font-extrabold text-red-400 font-mono">-{totalSpent.toLocaleString('vi-VN')}₫</div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-[#76B900]" />
          <h2 className="text-base font-bold text-white">{t('billing.transaction_history')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/60">
                <th className="py-3 px-4">{t('billing.type')}</th>
                <th className="py-3 px-4">{t('billing.amount')}</th>
                <th className="py-3 px-4">{t('billing.method')}</th>
                <th className="py-3 px-4">{t('billing.reference')}</th>
                <th className="py-3 px-4">{t('billing.description')}</th>
                <th className="py-3 px-4">{t('billing.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-mono">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                      tx.type === 'DEPOSIT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      tx.type === 'GPU_USAGE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                      'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}>
                      {tx.type === 'DEPOSIT' ? t('billing.deposit') : tx.type === 'GPU_USAGE' ? t('billing.gpu_usage') : t('billing.refund')}
                    </span>
                  </td>
                  <td className={`py-3 px-4 font-bold ${tx.amount >= 0 ? 'text-[#76B900]' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}₫
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">{tx.paymentMethod}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{tx.referenceCode}</td>
                  <td className="py-3 px-4 text-xs text-slate-300 font-sans">{tx.description}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center justify-between">
              <span>{t('billing.deposit_funds')}</span>
              <span className="text-xs font-mono text-[#76B900] font-normal">{t('billing.mb_vietqr')}</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              {t('billing.scan_qr')}
            </p>

            {!showQR ? (
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">{t('billing.select_gateway')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['VietQR', 'VNPay', 'MoMo'] as const).map(gw => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setPaymentGateway(gw)}
                        className={`py-2 px-3 text-xs font-mono rounded-lg border transition ${
                          paymentGateway === gw
                            ? 'bg-[#76B900]/20 border-[#76B900] text-[#76B900] font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {gw}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">{t('billing.select_amount')}</label>
                  <p className="text-[10px] text-slate-500 font-mono mb-2">{t('billing.min_max')}</p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {presets.map(item => (
                      <button
                        key={item.vnd}
                        type="button"
                        onClick={() => { setDepositAmount(item.vnd); setAmountError(''); }}
                        className={`py-2.5 text-xs font-mono rounded border text-center transition ${
                          depositAmount === item.vnd
                            ? 'bg-emerald-950 border-[#76B900] text-[#76B900] font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {item.label} VND
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mt-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => { setDepositAmount(Number(e.target.value)); setAmountError(''); }}
                      min={MIN_DEPOSIT}
                      max={MAX_DEPOSIT}
                      step={10000}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-white focus:border-[#76B900] focus:outline-none"
                    />
                    <div className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                      {depositAmount.toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                  {amountError && (
                    <p className="text-xs text-red-400 font-mono mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {amountError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#76B900] text-black font-extrabold text-xs font-mono hover:bg-emerald-400 transition shadow-lg shadow-[#76B900]/20"
                  >
                    {t('billing.generate_qr', { gateway: paymentGateway })} ({depositAmount.toLocaleString('vi-VN')}₫)
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* QR Display Card */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center space-y-3">
                  <div className="bg-white p-2 rounded-xl shadow-2xl">
                    <img 
                      src={vietQrUrl} 
                      alt="VietQR MB Bank" 
                      className="w-64 h-auto rounded-lg"
                    />
                  </div>

                  {/* Transfer Note Code Info */}
                  <div className="w-full bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('billing.exact_amount')}</span>
                      <span className="text-[#76B900] font-bold text-sm">
                        {depositAmount.toLocaleString('vi-VN')}₫
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('billing.transfer_message')}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-emerald-950 text-[#76B900] border border-[#76B900]/50 rounded font-bold text-sm tracking-wider">
                          {transferCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Copy"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-[#76B900]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                      <span>MB Bank: <span className="text-slate-200 font-bold">{MB_ACCOUNT_NO}</span></span>
                      <span>CTK: <span className="text-slate-200 font-bold">{MB_ACCOUNT_NAME}</span></span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center">
                  {t('billing.scanning_note')}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQR(false)}
                    className="w-1/3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={handleConfirmPaid}
                    className="w-2/3 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold font-mono text-xs hover:opacity-95 transition shadow-lg shadow-[#76B900]/20"
                  >
                    {t('billing.confirm_paid')} (+{depositAmount.toLocaleString('vi-VN')}₫)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
