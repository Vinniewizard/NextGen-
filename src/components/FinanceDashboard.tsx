import React, { useState } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Building, 
  Smartphone, ShieldCheck, RefreshCw, CheckCircle2, History, DollarSign 
} from 'lucide-react';

interface FinanceDashboardProps {
  currentUser: any;
  isDark: boolean;
}

export default function FinanceDashboard({ currentUser, isDark }: FinanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositMethod, setDepositMethod] = useState('M-Pesa');
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [withdrawMethod, setWithdrawMethod] = useState('Bank Transfer');
  const [toast, setToast] = useState<string | null>(null);

  const realBalance = Number(currentUser?.real_balance) || 0;
  const demoBalance = Number(currentUser?.demo_balance) || 10000;

  const triggerNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotice(`Deposit invoice of $${depositAmount} generated via ${depositMethod}. Follow payment instructions to complete.`);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(withdrawAmount) > realBalance) {
      triggerNotice(`Insufficient balance for withdrawal ($${realBalance.toFixed(2)} available).`);
      return;
    }
    triggerNotice(`Withdrawal request of $${withdrawAmount} submitted for processing.`);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Toast Notice */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border bg-[#181a20] border-[#fcd535]/50 text-white shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-[#fcd535]" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Finance & Funding Portfolio</h1>
            <p className="text-xs text-slate-400">Manage deposits, withdrawals, and liquidity settlements across your accounts.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[#0b0e11] rounded-xl border border-[#2b313a]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#fcd535] text-[#0b0e11] font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'deposit' ? 'bg-[#0ecb81] text-[#0b0e11] font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'withdraw' ? 'bg-[#f6465d] text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Portfolio Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Real Trading Balance</span>
              <div className="text-2xl font-black font-mono text-white">
                ${realBalance.toFixed(2)} <span className="text-xs text-[#fcd535] font-normal">USDT</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono block">● 100% Available for live positions</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Demo Practice Balance</span>
              <div className="text-2xl font-black font-mono text-slate-300">
                ${demoBalance.toFixed(2)} <span className="text-xs text-slate-500 font-normal">USD</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono block">● Sandbox practice capital</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Escrow Custody Vault</span>
              <div className="text-2xl font-black font-mono text-[#fcd535]">
                $0.00 <span className="text-xs text-slate-500 font-normal">USDT</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">● Multi-signature escrow protected</span>
            </div>
          </div>

          {/* Quick Actions & Supported Rails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Instant Payment Rails
              </h3>
              <div className="space-y-2.5">
                {[
                  { name: 'Safaricom M-Pesa', type: 'Instant Mobile Payout', speed: '< 60 seconds', status: 'Active' },
                  { name: 'Bank Wire / ACH', type: 'US & Global Banking', speed: '1-3 minutes', status: 'Active' },
                  { name: 'Chipper Cash & Revolut', type: 'Cross-border wallet', speed: 'Instant', status: 'Active' },
                  { name: 'Binance Pay & Crypto', type: 'USDT, BTC, ETH, BNB', speed: 'Blockchain instant', status: 'Active' }
                ].map((rail, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0b0e11] border border-[#2b313a] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-white block">{rail.name}</span>
                      <span className="text-[11px] text-slate-400">{rail.type} · {rail.speed}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                      {rail.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Security & Compliance Guard
              </h3>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-[#0b0e11] border border-[#2b313a] flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Cold Storage & Segregated Accounts</strong>
                    All user capital is held in segregated smart contracts with institutional cold storage security.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0b0e11] border border-[#2b313a] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#fcd535] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Real-time Settlement Protocol</strong>
                    Withdrawal requests are processed with automated audit validation and instant ledger clearance.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="max-w-xl mx-auto p-6 md:p-8 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2b313a] pb-3">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">Deposit Funds to Wallet</h2>
          </div>
          <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Select Payment Rail</label>
              <select
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2.5 text-white font-bold"
              >
                <option value="M-Pesa">Safaricom M-Pesa (Kenya)</option>
                <option value="Bank Transfer">Bank Wire / ACH Transfer (USD / EUR)</option>
                <option value="Chipper Cash">Chipper Cash (Africa / US)</option>
                <option value="Revolut">Revolut / SEPA Instant</option>
                <option value="Binance Pay">Binance Pay (Zero Fees)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Deposit Amount (USD)</label>
              <input
                type="number"
                min="10"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-[#fcd535]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Network / Rail Fee:</span>
                <span className="text-emerald-400 font-bold">$0.00 (Free)</span>
              </div>
              <div className="flex justify-between">
                <span>Credit to Wallet:</span>
                <span className="text-white font-bold">${parseFloat(depositAmount || '0').toFixed(2)} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-[#0b0e11] font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              Continue with {depositMethod}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="max-w-xl mx-auto p-6 md:p-8 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2b313a] pb-3">
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-black text-white">Withdraw Funds</h2>
          </div>
          <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Withdrawal Destination Rail</label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2.5 text-white font-bold"
              >
                <option value="Bank Transfer">Bank Wire / ACH Transfer</option>
                <option value="M-Pesa">Safaricom M-Pesa Phone Number</option>
                <option value="Chipper Cash">Chipper Cash Tag</option>
                <option value="Revolut">Revolut Revtag</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <label>Amount to Withdraw (USD)</label>
                <span>Available: <strong className="text-white">${realBalance.toFixed(2)}</strong></span>
              </div>
              <input
                type="number"
                min="10"
                max={realBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-[#fcd535]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Processing Speed:</span>
                <span className="text-white font-bold">Instant / Under 5 mins</span>
              </div>
              <div className="flex justify-between">
                <span>Withdrawal Fee:</span>
                <span className="text-emerald-400 font-bold">$0.00</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={parseFloat(withdrawAmount) > realBalance}
              className="w-full py-3 bg-[#f6465d] hover:bg-[#f6465d]/90 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Withdrawal
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
