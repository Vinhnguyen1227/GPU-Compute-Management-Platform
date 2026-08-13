import React, { useState } from 'react';
import { Wallet, QrCode, ArrowUpRight, ArrowDownLeft, ShieldCheck, CheckCircle2, History, Plus, CreditCard } from 'lucide-react';
import { Transaction } from '../types';

interface BillingWalletProps {
  balance: number;
  transactions: Transaction[];
  onTopUp: (amount: number, method: 'VietQR' | 'VNPay' | 'MoMo') => void;
}

export const BillingWallet: React.FC<BillingWalletProps> = ({ balance, transactions, onTopUp }) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [paymentGateway, setPaymentGateway] = useState<'VietQR' | 'VNPay' | 'MoMo'>('VietQR');
  const [showQR, setShowQR] = useState(false);

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowQR(true);
  };

  const handleConfirmPaid = () => {
    onTopUp(depositAmount, paymentGateway);
    setShowQR(false);
    setShowDepositModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#76B900]" />
            <span>Wallet Balance & Payment Gateway</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Wallet Service, VietQR top-ups & usage ledger ledger auditability</p>
        </div>
        <button
          onClick={() => setShowDepositModal(true)}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-[#76B900]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Top Up Balance</span>
        </button>
      </div>

      {/* Wallet Balance Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              <span>Account Billing Wallet</span>
              <span className="text-[#76B900] bg-[#76B900]/10 px-2 py-0.5 rounded border border-[#76B900]/30 font-semibold">
                IDEMPOTENT PAYMENTS ENABLED
              </span>
            </div>
            <div className="text-4xl font-extrabold text-white font-mono tracking-tight mt-1">
              ${balance.toFixed(2)} <span className="text-lg text-slate-400 font-normal">USD</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Equivalent to approx <span className="text-emerald-400 font-bold">{(balance * 25450).toLocaleString()} VND</span>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs text-slate-400">
            <span>Billing Engine: Usage Metering Active</span>
            <button
              onClick={() => setShowDepositModal(true)}
              className="text-[#76B900] hover:underline font-bold"
            >
              + Generate QR Top-Up
            </button>
          </div>
        </div>

        {/* Payment Safety Callout */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#76B900]" />
              <span>Idempotent Callback Safety</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every deposit callback uses unique payment reference IDs to prevent duplicate balance additions.
            </p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div>Supported Gateways:</div>
            <div className="text-emerald-400 font-bold">● VietQR (Instant Bank Transfer)</div>
            <div className="text-cyan-400 font-bold">● VNPay & MoMo e-Wallet</div>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-[#76B900]" />
          <span>Billing Ledger & Transaction Logs</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/60">
                <th className="py-3 px-4">Tx ID & Ref</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Gateway</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-200">
                    <div>{tx.id}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{tx.referenceCode}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                      tx.type === 'DEPOSIT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      tx.type === 'GPU_USAGE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                      'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs font-sans">{tx.description}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">{tx.paymentMethod || 'System'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{tx.timestamp}</td>
                  <td className={`py-3.5 px-4 text-right font-bold ${
                    tx.amount > 0 ? 'text-[#76B900]' : 'text-slate-300'
                  }`}>
                    {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} USD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal with QR Simulation */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-2">Deposit Funds to Wallet</h2>
            <p className="text-xs text-slate-400 mb-4 font-mono">Select payment gateway & scan QR code</p>

            {!showQR ? (
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">Select Gateway</label>
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
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">Top-Up Amount (USD)</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[50, 100, 250, 500].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`py-1.5 text-xs font-mono rounded border ${
                          depositAmount === amt ? 'bg-emerald-950 border-[#76B900] text-[#76B900] font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-white focus:border-[#76B900] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#76B900] text-black font-extrabold text-xs hover:bg-emerald-400 transition"
                  >
                    Generate {paymentGateway} QR
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-white rounded-xl inline-block shadow-xl">
                  {/* Simulated VietQR graphic */}
                  <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-400 p-2">
                    <QrCode className="w-32 h-32 text-slate-900" />
                    <div className="text-[10px] font-mono font-bold text-slate-800 mt-1 uppercase">
                      {paymentGateway} - ${depositAmount} USD
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  Scan with your banking app or e-wallet to complete deposit.
                </div>

                <button
                  onClick={handleConfirmPaid}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold text-xs hover:opacity-90 transition shadow-lg shadow-[#76B900]/20"
                >
                  Simulate Bank Payment Success Callback
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
