import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  History, 
  ShieldCheck, 
  Sparkles, 
  QrCode, 
  CheckCircle2, 
  Copy, 
  Check, 
  Building2,
  ExternalLink
} from 'lucide-react';
import { Transaction } from '../types';

interface BillingWalletProps {
  balance: number;
  transactions: Transaction[];
  onTopUp: (amount: number, method: 'VietQR' | 'VNPay' | 'MoMo') => void;
}

export const BillingWallet: React.FC<BillingWalletProps> = ({
  balance,
  transactions,
  onTopUp,
}) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(4); // USD (100k VND)
  const [paymentGateway, setPaymentGateway] = useState<'VietQR' | 'VNPay' | 'MoMo'>('VietQR');
  const [showQR, setShowQR] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [transferCode, setTransferCode] = useState<string>('o1wCm');

  const MB_BANK_BIN = '970422';
  const MB_ACCOUNT_NO = '0932296788';
  const MB_ACCOUNT_NAME = 'HOANG ANH TUAN';
  const VND_EXCHANGE_RATE = 25000;

  const amountVnd = Math.round(depositAmount * VND_EXCHANGE_RATE);
  const vietQrUrl = `https://img.vietqr.io/image/${MB_BANK_BIN}-${MB_ACCOUNT_NO}-compact2.png?amount=${amountVnd}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(MB_ACCOUNT_NAME)}`;

  const generateRandomCode = (len = 5) => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;
    setTransferCode(generateRandomCode(5));
    setShowQR(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(transferCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmPaid = () => {
    onTopUp(depositAmount, paymentGateway);
    setShowQR(false);
    setShowDepositModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <span>Billing, Wallets & Financial Ledger</span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#76B900]/20 text-[#76B900] rounded-full border border-[#76B900]/40">
            PAYOS & VIETQR VERIFIED
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time prepaid balance, automated GPU compute metering, and instant VietQR top-ups via MB Bank.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/80">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Current Compute Balance
              </div>
              <div className="text-3xl font-black font-mono text-white mt-1">
                ${balance.toFixed(2)}{' '}
                <span className="text-xs text-slate-500 font-normal">USD</span>
              </div>
              <div className="text-xs font-mono text-[#76B900] mt-0.5">
                ≈ {(balance * VND_EXCHANGE_RATE).toLocaleString('vi-VN')} VND
              </div>
            </div>
            <div className="p-3 bg-[#76B900]/10 rounded-xl border border-[#76B900]/30 text-[#76B900]">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <button
            onClick={() => {
              setShowQR(false);
              setShowDepositModal(true);
            }}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#76B900] hover:bg-emerald-400 text-black font-extrabold text-xs font-mono tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-[#76B900]/20"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>Top Up Balance (VietQR / MB Bank)</span>
          </button>
        </div>

        {/* MB Bank Account Details */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Official Receiving Account</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Bank:</span>
              <span className="text-white font-bold">MB Bank (Quân Đội)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Account Number:</span>
              <span className="text-cyan-400 font-bold">{MB_ACCOUNT_NO}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Account Holder:</span>
              <span className="text-white font-bold">{MB_ACCOUNT_NAME}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Gateway:</span>
              <span className="text-[#76B900] font-bold">PayOS Webhook (Auto 3s)</span>
            </div>
          </div>
        </div>

        {/* Security & Idempotency Card */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
            <ShieldCheck className="w-4 h-4 text-[#76B900]" />
            <span>Automated Webhook Matching</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every deposit generates a unique transfer code (e.g. <span className="text-white font-mono font-bold">o1wCm</span>). When your banking app transfers money with that note, PayOS webhook instantly credits your wallet.
          </p>
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

      {/* Deposit Modal with Real VietQR & PayOS */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center justify-between">
              <span>Deposit Funds to GPU Wallet</span>
              <span className="text-xs font-mono text-[#76B900] font-normal">MB Bank • VietQR</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Scan QR with any Banking App (MB Bank, Vietcombank, Techcombank, MoMo)
            </p>

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
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">Select Top-Up Amount</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { usd: 4, vnd: '100k' },
                      { usd: 10, vnd: '250k' },
                      { usd: 20, vnd: '500k' },
                      { usd: 40, vnd: '1M' }
                    ].map(item => (
                      <button
                        key={item.usd}
                        type="button"
                        onClick={() => setDepositAmount(item.usd)}
                        className={`py-2 text-xs font-mono rounded border text-center transition ${
                          depositAmount === item.usd
                            ? 'bg-emerald-950 border-[#76B900] text-[#76B900] font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div>${item.usd} USD</div>
                        <div className="text-[10px] text-slate-500">{item.vnd} VND</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mt-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-white focus:border-[#76B900] focus:outline-none"
                    />
                    <div className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                      ≈ {(depositAmount * VND_EXCHANGE_RATE).toLocaleString('vi-VN')} VND
                    </div>
                  </div>
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
                    className="px-5 py-2.5 rounded-lg bg-[#76B900] text-black font-extrabold text-xs font-mono hover:bg-emerald-400 transition shadow-lg shadow-[#76B900]/20"
                  >
                    Generate {paymentGateway} QR (${depositAmount} / {amountVnd.toLocaleString('vi-VN')} VND)
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
                      <span>Exact Amount:</span>
                      <span className="text-[#76B900] font-bold text-sm">
                        {amountVnd.toLocaleString('vi-VN')} VND (${depositAmount} USD)
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>Transfer Message (Nội dung CK):</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-emerald-950 text-[#76B900] border border-[#76B900]/50 rounded font-bold text-sm tracking-wider">
                          {transferCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Copy Transfer Code"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-[#76B900]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                      <span>MB Bank: <span className="text-slate-200 font-bold">{MB_ACCOUNT_NO}</span></span>
                      <span>Owner: <span className="text-slate-200 font-bold">{MB_ACCOUNT_NAME}</span></span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center">
                  💡 Scanning the QR with your banking app will automatically set the amount to <span className="text-white font-bold">{amountVnd.toLocaleString('vi-VN')} VND</span> and the message to <span className="text-[#76B900] font-bold">{transferCode}</span>.
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQR(false)}
                    className="w-1/3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmPaid}
                    className="w-2/3 py-2.5 rounded-lg bg-gradient-to-r from-[#76B900] to-emerald-400 text-black font-extrabold font-mono text-xs hover:opacity-95 transition shadow-lg shadow-[#76B900]/20"
                  >
                    Simulate Payment Callback (+${depositAmount})
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
