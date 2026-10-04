import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Building, 
  Smartphone, ShieldCheck, RefreshCw, CheckCircle2, History, DollarSign,
  AlertCircle, Copy, Check, X, Download, Clock, ShieldAlert, ArrowRight
} from 'lucide-react';

interface FinanceDashboardProps {
  currentUser: any;
  isDark: boolean;
  gameSettings?: any;
  onBalanceUpdate?: (newBal: number) => void;
  onOpenCashierModal?: (tab?: 'deposit' | 'withdraw') => void;
  onSwitchView?: (view: string) => void;
}

export default function FinanceDashboard({ 
  currentUser, 
  isDark, 
  gameSettings,
  onBalanceUpdate,
  onOpenCashierModal,
  onSwitchView
}: FinanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'statements'>('overview');
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [depositMethod, setDepositMethod] = useState<'paybill' | 'usdt' | 'btc' | 'bank' | 'chipper'>('paybill');
  const [activeDeposit, setActiveDeposit] = useState<any>(null);
  const [mpesaCode, setMpesaCode] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(25);
  const [withdrawMethod, setWithdrawMethod] = useState<'mpesa' | 'crypto' | 'bank' | 'chipper'>('mpesa');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawCoin, setWithdrawCoin] = useState('USDT');

  // Statements & History state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const realBalance = Number(currentUser?.real_balance ?? currentUser?.balance ?? 0);
  const demoBalance = Number(currentUser?.demo_balance ?? 10000);
  const minDeposit = Number(gameSettings?.minDeposit ?? 1);
  const minWithdrawal = Number(gameSettings?.minWithdrawal ?? 15);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Fetch active deposit session and statements
  const fetchActiveDeposit = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/cashier/active-deposit?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success && data.activeDeposit) {
        setActiveDeposit(data.activeDeposit);
        if (data.activeDeposit.amount) setDepositAmount(data.activeDeposit.amount);
      } else {
        setActiveDeposit(null);
      }
    } catch (e) {
      console.warn('Failed to fetch active deposit:', e);
    }
  };

  const fetchStatements = async () => {
    if (!currentUser?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/cashier/history?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        const combined: any[] = [];
        (data.history || []).forEach((d: any) => {
          combined.push({
            id: d.txHash || `dep-${Date.now()}`,
            type: 'deposit',
            amount: Number(d.amount),
            method: d.network || d.coin || 'Deposit',
            asset: d.coin || 'USD',
            status: 'approved',
            date: d.date || new Date().toISOString(),
            raw: d
          });
        });

        (data.withdrawals || []).forEach((w: any) => {
          combined.push({
            id: w.id || `wd-${Date.now()}`,
            type: 'withdrawal',
            amount: Number(w.amount),
            method: w.paymentMethod || 'Withdrawal',
            asset: w.coin || 'USD',
            destination: w.address,
            status: w.status || 'pending',
            date: w.date || new Date().toISOString(),
            raw: w
          });
        });

        // Also check if active deposit is pending
        if (activeDeposit && activeDeposit.status === 'pending') {
          combined.unshift({
            id: activeDeposit.id,
            type: 'deposit',
            amount: Number(activeDeposit.amount),
            method: activeDeposit.payment_method || 'M-Pesa Paybill',
            asset: 'USD',
            status: 'pending',
            date: activeDeposit.created_at,
            raw: activeDeposit
          });
        }

        // Sort desc
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(combined);
      }
    } catch (e) {
      console.warn('Failed to load transaction history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchActiveDeposit();
    fetchStatements();
  }, [currentUser?.id]);

  // Initiate Procedural Deposit
  const handleInitiateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      triggerToast('Please sign in to proceed with deposits.', 'error');
      return;
    }

    if (depositAmount < minDeposit) {
      triggerToast(`Minimum deposit is $${minDeposit.toFixed(2)} USD.`, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/cashier/initiate-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: depositAmount,
          paymentMethod: depositMethod,
          coin: depositMethod === 'paybill' ? 'KES' : 'USDT'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to initiate deposit order.');
      }

      setActiveDeposit(data.deposit);
      triggerToast(`Deposit order of $${depositAmount} USD generated. Follow instructions to complete payment.`);
    } catch (err: any) {
      triggerToast(err.message || 'Deposit initiation failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Payment Confirmation / Receipt
  const handleSubmitDepositProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeposit) return;
    if (!mpesaCode.trim() && !receiptFile) {
      triggerToast('Please provide your M-Pesa transaction confirmation message or upload a receipt.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('userId', currentUser?.id);
      formData.append('amount', (activeDeposit.amount || depositAmount).toString());
      formData.append('paymentMethod', activeDeposit.paymentMethod || depositMethod);
      if (receiptFile) formData.append('receipt', receiptFile);
      if (mpesaCode) formData.append('message', mpesaCode);

      const res = await fetch('/api/cashier/upload-receipt', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit payment proof.');
      }

      triggerToast('Payment proof submitted successfully! Administrator is reviewing your deposit.');
      setMpesaCode('');
      setReceiptFile(null);
      await fetchActiveDeposit();
      await fetchStatements();
    } catch (err: any) {
      triggerToast(err.message || 'Proof submission failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel Active Deposit Order
  const handleCancelDeposit = async () => {
    if (!currentUser?.id) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/cashier/cancel-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          depositId: activeDeposit?.id
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel deposit.');
      }

      setActiveDeposit(null);
      setMpesaCode('');
      setReceiptFile(null);
      triggerToast('Deposit order cancelled. You can now initiate a new deposit.');
      fetchStatements();
    } catch (err: any) {
      triggerToast(err.message || 'Cancellation failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Real Withdrawal
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      triggerToast('Please sign in to withdraw funds.', 'error');
      return;
    }

    if (withdrawAmount < minWithdrawal) {
      triggerToast(`Minimum withdrawal amount is $${minWithdrawal.toFixed(2)} USD.`, 'error');
      return;
    }

    if (withdrawAmount > realBalance) {
      triggerToast(`Insufficient balance. You have $${realBalance.toFixed(2)} USD available.`, 'error');
      return;
    }

    if (!withdrawDestination.trim()) {
      triggerToast('Please enter your destination phone number, wallet address, or bank details.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/cashier/dispatch-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: withdrawAmount,
          paymentMethod: withdrawMethod,
          targetAddress: withdrawDestination.trim(),
          coin: withdrawMethod === 'crypto' ? withdrawCoin : 'USD'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Withdrawal dispatch failed.');
      }

      triggerToast(data.message || `Withdrawal of $${withdrawAmount.toFixed(2)} submitted successfully!`);
      if (data.newBalance !== undefined && onBalanceUpdate) {
        onBalanceUpdate(data.newBalance);
      }
      setWithdrawDestination('');
      fetchStatements();
    } catch (err: any) {
      triggerToast(err.message || 'Withdrawal failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export CSV Statement
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      triggerToast('No transaction records available to export.', 'error');
      return;
    }

    const headers = ['Date', 'Reference ID', 'Type', 'Payment Method', 'Amount (USD)', 'Status', 'Destination'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleString(),
      t.id,
      t.type.toUpperCase(),
      t.method,
      t.amount.toFixed(2),
      t.status.toUpperCase(),
      t.destination || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(cell => `"${cell}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LWEX_Financial_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Financial statement exported successfully!');
  };

  const filteredTransactions = transactions.filter(t => {
    if (historyFilter === 'deposits' && t.type !== 'deposit') return false;
    if (historyFilter === 'withdrawals' && t.type !== 'withdrawal') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q) ||
        (t.destination && t.destination.toLowerCase().includes(q)) ||
        t.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Toast Notice */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all ${
          toast.type === 'success' 
            ? 'bg-[#181a20] border-emerald-500/50 text-white' 
            : 'bg-[#181a20] border-rose-500/50 text-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              Finance & Cashier Hub
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
                Live Rails
              </span>
            </h1>
            <p className="text-xs text-slate-400">Instant deposits, secure withdrawals, and audited transaction statements.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[#0b0e11] rounded-xl border border-[#2b313a] flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#fcd535] text-[#0b0e11] font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deposit' ? 'bg-[#0ecb81] text-[#0b0e11] font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Deposit Cashier</span>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'withdraw' ? 'bg-[#f6465d] text-white font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Withdraw Desk</span>
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'statements' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Statements</span>
          </button>
        </div>
      </div>

      {/* 200% PROMOTIONAL MATCH BANNER */}
      {currentUser && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <div className="text-xs font-black text-amber-300 uppercase tracking-wide">
                200% First Deposit Match Bonus Active
              </div>
              <p className="text-[11px] text-slate-300">
                Deposit $20 or more and complete 5 real trades to unlock up to $500 in matching capital.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('deposit')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wide cursor-pointer shrink-0"
          >
            Claim Bonus Now
          </button>
        </div>
      )}

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Live Real Balance</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase">Real Trading</span>
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                ${realBalance.toFixed(2)} <span className="text-xs text-[#fcd535] font-normal">USD</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#2b313a] text-[11px]">
                <span className="text-slate-400">Available for withdrawal:</span>
                <span className="font-bold text-white font-mono">${realBalance.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Practice Demo Balance</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase">Virtual</span>
              </div>
              <div className="text-3xl font-black font-mono text-slate-300 tracking-tight">
                ${demoBalance.toFixed(2)} <span className="text-xs text-slate-500 font-normal">USD</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#2b313a] text-[11px]">
                <span className="text-slate-400">Unlimited sandbox reload</span>
                <button
                  onClick={() => triggerToast('Demo balance is active for zero-risk practice.')}
                  className="text-blue-400 font-bold hover:underline"
                >
                  Learn Strategy
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Limits & Thresholds</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase">Admin Config</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Min Deposit:</span>
                  <span className="font-bold text-emerald-400">${minDeposit.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Min Withdrawal:</span>
                  <span className="font-bold text-rose-400">${minWithdrawal.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Settlement Speed:</span>
                  <span className="font-bold text-[#fcd535]">Instant (&lt; 15m)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Rails & Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Supported Payment Rails
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">● All Rails Active</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Safaricom M-Pesa (Paybill 247247)', fee: '$0.00 Free', time: 'Instant / < 5 mins', rail: 'paybill' },
                  { name: 'Tether USDT (TRC20 / ERC20)', fee: '$0.00 Free', time: '1 Blockchain Confirm', rail: 'usdt' },
                  { name: 'Bitcoin (BTC)', fee: '$0.00 Free', time: '1 Blockchain Confirm', rail: 'btc' },
                  { name: 'Bank Wire / Wire Transfer', fee: '$0.00 Free', time: '15-30 mins', rail: 'bank' }
                ].map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0b0e11] border border-[#2b313a] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{r.name}</span>
                      <span className="text-[10px] text-slate-400">Speed: {r.time} · Fee: {r.fee}</span>
                    </div>
                    <button
                      onClick={() => {
                        setDepositMethod(r.rail as any);
                        setActiveTab('deposit');
                      }}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded text-[10px] cursor-pointer"
                    >
                      Deposit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Audited Security Standards
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-[#0b0e11] border border-[#2b313a] flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Cold-Storage Escrow Protocols</strong>
                    User capital is preserved in isolated multi-signature cold wallets, shielded from market liquidity shocks.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0b0e11] border border-[#2b313a] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#fcd535] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Manual & Automated Paybill Verification</strong>
                    M-Pesa Paybill deposits are reconciled in real-time with administrator verification logs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DEPOSIT CASHIER ================= */}
      {activeTab === 'deposit' && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Active Deposit Session Card (If User Initiated a Deposit) */}
          {activeDeposit ? (
            <div className="p-6 rounded-2xl bg-[#181a20] border-2 border-emerald-500/40 space-y-5 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2b313a] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h2 className="text-base font-black text-white">
                    Active Deposit Order ({activeDeposit.payment_method?.toUpperCase() || 'PAYBILL'})
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wide">
                  {activeDeposit.status === 'pending' ? 'Pending Admin Approval' : 'Awaiting Payment'}
                </span>
              </div>

              {/* Procedural Instructions */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Paybill / Business No</span>
                  <div className="flex items-center gap-1 text-emerald-400 font-black text-base">
                    <span>247247</span>
                    <button 
                      onClick={() => copyToClipboard('247247', 'paybill')}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      {copiedField === 'paybill' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Account Number / Reference</span>
                  <div className="flex items-center gap-1 text-white font-black text-base">
                    <span>{activeDeposit.accountNo || `KNEX-${(activeDeposit.id || '7789').slice(-6).toUpperCase()}`}</span>
                    <button 
                      onClick={() => copyToClipboard(activeDeposit.accountNo || `KNEX-${(activeDeposit.id || '7789').slice(-6).toUpperCase()}`, 'acc')}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Amount to Pay</span>
                  <span className="text-white font-black text-sm">${activeDeposit.amount} USD</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Approx in Local KES</span>
                  <span className="text-yellow-400 font-black text-sm">KES {Math.round(activeDeposit.amount * 132).toLocaleString()}</span>
                </div>
              </div>

              {/* Step-by-Step Payment Instructions */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white uppercase text-[10px] tracking-wider text-amber-400">
                  Step-by-Step Payment Procedure:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>Open <strong>M-Pesa</strong> &gt; Select <strong>Lipa Na M-Pesa</strong> &gt; <strong>Paybill</strong>.</li>
                  <li>Enter Business No: <strong className="text-emerald-400">247247</strong>.</li>
                  <li>Enter Account No: <strong className="text-white">{activeDeposit.accountNo || `KNEX-${(activeDeposit.id || '7789').slice(-6).toUpperCase()}`}</strong>.</li>
                  <li>Enter Amount: <strong className="text-yellow-400">KES {Math.round(activeDeposit.amount * 132).toLocaleString()}</strong> and confirm with your PIN.</li>
                  <li>Paste the SMS confirmation code or upload the payment screenshot below.</li>
                </ol>
              </div>

              {/* Proof Submission Form */}
              <form onSubmit={handleSubmitDepositProof} className="space-y-4">
                <div>
                  <label className="text-slate-400 block mb-1 text-xs">
                    Paste M-Pesa Confirmation SMS / Transaction Code
                  </label>
                  <input
                    type="text"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value)}
                    placeholder="e.g. QXJ789ABCD Confirmed. Ksh 6,600 sent to 247247..."
                    className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-xs">
                    Or Upload Payment Screenshot (Receipt)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Submitting Proof...' : 'Submit Payment for Approval'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDeposit}
                    disabled={isProcessing}
                    className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Cancel Deposit
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* New Deposit Initiation Form */
            <div className="p-6 md:p-8 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2b313a] pb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-black text-white">Deposit Funds to Real Wallet</h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Min: <strong className="text-emerald-400">${minDeposit.toFixed(2)} USD</strong>
                </span>
              </div>

              <form onSubmit={handleInitiateDeposit} className="space-y-5">
                {/* Rail Selector */}
                <div>
                  <label className="text-slate-400 block mb-2 text-xs font-bold uppercase tracking-wider">
                    1. Select Payment Rail
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'paybill', name: 'M-Pesa Paybill', badge: 'Kenya' },
                      { id: 'usdt', name: 'USDT (TRC20)', badge: 'Crypto' },
                      { id: 'btc', name: 'Bitcoin (BTC)', badge: 'Crypto' },
                      { id: 'bank', name: 'Bank Wire', badge: 'Global' }
                    ].map(rail => (
                      <button
                        type="button"
                        key={rail.id}
                        onClick={() => setDepositMethod(rail.id as any)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          depositMethod === rail.id 
                            ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md' 
                            : 'bg-[#0b0e11] border-[#2b313a] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono block w-max mb-1">
                          {rail.badge}
                        </span>
                        <span className="font-bold text-xs block">{rail.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <label className="text-slate-400 font-bold uppercase tracking-wider">
                      2. Deposit Amount (USD)
                    </label>
                    <span className="font-mono text-yellow-400 text-xs">
                      ≈ KES {Math.round(depositAmount * 132).toLocaleString()}
                    </span>
                  </div>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min={minDeposit}
                      max={50000}
                      value={depositAmount || ''}
                      onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl pl-10 pr-4 py-3 text-white font-mono text-lg font-black focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="grid grid-cols-4 gap-2 mt-2.5">
                    {[20, 50, 100, 250].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setDepositAmount(val)}
                        className={`py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all ${
                          depositAmount === val 
                            ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-black' 
                            : 'bg-[#0b0e11] border-[#2b313a] text-slate-400 hover:text-white'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Info */}
                <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-2 text-xs font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Deposit Processing Fee:</span>
                    <span className="text-emerald-400 font-bold">$0.00 (Zero Fee)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credit to Real Wallet:</span>
                    <span className="text-white font-bold">${depositAmount.toFixed(2)} USD</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || depositAmount < minDeposit}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Generating Order...' : `Generate Deposit Order for $${depositAmount} USD`}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: WITHDRAWAL DESK ================= */}
      {activeTab === 'withdraw' && (
        <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl bg-[#181a20] border border-[#2b313a] space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#2b313a] pb-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-black text-white">Withdraw Funds from Real Wallet</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Min Withdrawal: <strong className="text-rose-400">${minWithdrawal.toFixed(2)} USD</strong>
            </span>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-5">
            {/* Rail Selector */}
            <div>
              <label className="text-slate-400 block mb-2 text-xs font-bold uppercase tracking-wider">
                1. Select Payout Rail
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'mpesa', name: 'Safaricom M-Pesa', badge: 'Instant' },
                  { id: 'crypto', name: 'Crypto (USDT/BTC)', badge: 'Direct' },
                  { id: 'bank', name: 'Bank Wire / ACH', badge: 'Global' },
                  { id: 'chipper', name: 'Chipper Cash', badge: 'Fast' }
                ].map(rail => (
                  <button
                    type="button"
                    key={rail.id}
                    onClick={() => setWithdrawMethod(rail.id as any)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      withdrawMethod === rail.id 
                        ? 'bg-rose-500/10 border-rose-500 text-white shadow-md' 
                        : 'bg-[#0b0e11] border-[#2b313a] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono block w-max mb-1">
                      {rail.badge}
                    </span>
                    <span className="font-bold text-xs block">{rail.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Crypto Coin sub-selection */}
            {withdrawMethod === 'crypto' && (
              <div>
                <label className="text-slate-400 block mb-1 text-xs font-bold uppercase tracking-wider">
                  Select Crypto Asset
                </label>
                <select
                  value={withdrawCoin}
                  onChange={(e) => setWithdrawCoin(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="USDT">USDT (TRC20 / ERC20)</option>
                  <option value="BTC">Bitcoin (BTC Network)</option>
                  <option value="ETH">Ethereum (ERC20)</option>
                </select>
              </div>
            )}

            {/* Destination Input */}
            <div>
              <label className="text-slate-400 block mb-1 text-xs font-bold uppercase tracking-wider">
                2. Destination {withdrawMethod === 'mpesa' ? 'M-Pesa Phone Number' : withdrawMethod === 'crypto' ? 'Wallet Address' : 'Account Details'}
              </label>
              <input
                type="text"
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                placeholder={
                  withdrawMethod === 'mpesa' 
                    ? 'e.g. 0712345678 or 254712345678' 
                    : withdrawMethod === 'crypto' 
                      ? `Paste your ${withdrawCoin} destination address` 
                      : 'Bank Name, Account Number, Swift Code'
                }
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <label className="text-slate-400 font-bold uppercase tracking-wider">
                  3. Amount to Withdraw (USD)
                </label>
                <span className="text-slate-400 font-mono text-xs">
                  Available: <strong className="text-white">${realBalance.toFixed(2)} USD</strong>
                </span>
              </div>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={minWithdrawal}
                  max={realBalance}
                  value={withdrawAmount || ''}
                  onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl pl-10 pr-4 py-3 text-white font-mono text-lg font-black focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              {/* Quick Percentage Selectors */}
              <div className="grid grid-cols-4 gap-2 mt-2.5">
                {[
                  { label: `Min ($${minWithdrawal})`, val: minWithdrawal },
                  { label: '25%', val: Math.round(realBalance * 0.25) },
                  { label: '50%', val: Math.round(realBalance * 0.5) },
                  { label: 'Max (100%)', val: realBalance }
                ].map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setWithdrawAmount(preset.val)}
                    className="py-1.5 rounded-lg border border-[#2b313a] bg-[#0b0e11] hover:border-slate-600 text-slate-400 hover:text-white text-xs font-mono font-bold cursor-pointer transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary & Disclaimers */}
            <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-2 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Withdrawal Speed:</span>
                <span className="text-white font-bold">Direct Ledger Settlement (&lt; 15 mins)</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Real Balance:</span>
                <span className="text-emerald-400 font-bold">
                  ${Math.max(0, realBalance - withdrawAmount).toFixed(2)} USD
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || withdrawAmount < minWithdrawal || withdrawAmount > realBalance || !withdrawDestination.trim()}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/10 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Dispatching Withdrawal...' : `Submit Withdrawal for $${withdrawAmount.toFixed(2)} USD`}
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 4: TRANSACTION STATEMENTS ================= */}
      {activeTab === 'statements' && (
        <div className="space-y-4">
          {/* Statement Controls */}
          <div className="p-4 rounded-2xl bg-[#181a20] border border-[#2b313a] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'all' ? 'bg-[#fcd535] text-[#0b0e11] font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Records
              </button>
              <button
                onClick={() => setHistoryFilter('deposits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'deposits' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Deposits
              </button>
              <button
                onClick={() => setHistoryFilter('withdrawals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'withdrawals' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Withdrawals
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, method, status..."
                className="bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono w-48 sm:w-64"
              />
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Statement Table */}
          <div className="p-4 md:p-6 rounded-2xl bg-[#181a20] border border-[#2b313a] overflow-x-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                <span className="text-xs font-mono">Loading transaction statements...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <History className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-mono">No transaction records found matching the criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[650px] font-mono">
                <thead>
                  <tr className="border-b border-[#2b313a] text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="pb-3 font-bold">Date & Time</th>
                    <th className="pb-3 font-bold">Transaction Type</th>
                    <th className="pb-3 font-bold">Payment Rail</th>
                    <th className="pb-3 font-bold">Amount</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Reference ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b313a]/60">
                  {filteredTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 text-slate-400 text-[11px]">
                        {new Date(tx.date).toLocaleDateString()} <span className="text-[9px] text-slate-500">{new Date(tx.date).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-white font-bold">
                        {tx.method}
                      </td>
                      <td className={`py-3 font-black text-sm ${
                        tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          tx.status === 'approved' || tx.status === 'paid' || tx.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tx.status === 'declined'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-300 animate-pulse'
                        }`}>
                          {tx.status === 'approved' || tx.status === 'paid' ? 'Completed' : tx.status === 'pending' ? 'Pending Review' : tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 text-[10px]">
                        <span className="truncate max-w-[140px] inline-block font-mono" title={tx.id}>
                          {tx.id}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
