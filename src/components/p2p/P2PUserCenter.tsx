import React, { useState } from 'react';
import { 
  Building, Smartphone, CreditCard, ShieldCheck, Award, 
  Clock, CheckCircle2, Plus, Edit2, Trash2 
} from 'lucide-react';
import { UserInfo } from './P2PTypes';

interface P2PUserCenterProps {
  currentUser: any;
  userInfo: UserInfo;
  isDark: boolean;
  onTriggerToast: (msg: string, success?: boolean) => void;
}

export default function P2PUserCenter({
  currentUser,
  userInfo,
  isDark,
  onTriggerToast
}: P2PUserCenterProps) {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'Bank Transfer', title: 'Bank Account (USD)', details: 'Bank of America · **** 4410', active: true },
    { id: '2', type: 'M-Pesa', title: 'Safaricom M-Pesa (KES)', details: '0712 *** 678 · Vincent K.', active: true },
    { id: '3', type: 'Chipper Cash', title: 'Chipper Cash Tag', details: '@vinnie_global', active: true }
  ]);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodType, setNewMethodType] = useState('Bank Transfer');
  const [newMethodDetails, setNewMethodDetails] = useState('');

  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodDetails.trim()) return;
    setPaymentMethods(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type: newMethodType,
        title: `${newMethodType} Account`,
        details: newMethodDetails.trim(),
        active: true
      }
    ]);
    setNewMethodDetails('');
    setShowAddMethod(false);
    onTriggerToast('New payment method saved to your P2P profile.', true);
  };

  const handleDeleteMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
    onTriggerToast('Payment method removed.', true);
  };

  return (
    <div className={`p-6 md:p-8 rounded-2xl border space-y-8 font-sans ${
      isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Merchant Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0e11] border border-[#2b313a]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#2b313a] to-[#363d47] border-2 border-[#fcd535] flex items-center justify-center font-black text-white text-xl">
            {(currentUser?.fullName || currentUser?.email || 'Trader').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">
                {currentUser?.fullName || 'Verified Trader'}
              </h2>
              <span className="p-0.5 rounded bg-yellow-400/10 text-[#fcd535]" title="Verified Merchant">
                <Award className="w-4 h-4 fill-[#fcd535]/20 text-[#fcd535]" />
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                VIP Tier 1
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              UID: {currentUser?.id?.substring(0, 10) || 'USER-98412'} · Email: {currentUser?.email || 'trader@lwex.io'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#181a20] border border-[#2b313a] text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Funding Wallet</span>
            <span className="text-sm font-black font-mono text-[#fcd535]">${userInfo.balance.toFixed(2)} USDT</span>
          </div>
        </div>
      </div>

      {/* 30-Day Statistics Grid */}
      <div>
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
          30-Day Trading Performance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">30d Orders</span>
            <span className="text-xl font-bold text-white">{userInfo.completedTrades + 124}</span>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">30d Completion</span>
            <span className="text-xl font-bold text-emerald-400">99.6%</span>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Avg Pay Time</span>
            <span className="text-xl font-bold text-white">1.8 min</span>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Avg Release Time</span>
            <span className="text-xl font-bold text-[#fcd535]">2.1 min</span>
          </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Payment Methods (Buyer will see this when you sell)
            </h3>
            <p className="text-xs text-slate-400">Your accounts for receiving fiat currency.</p>
          </div>
          <button
            onClick={() => setShowAddMethod(true)}
            className="px-3.5 py-1.5 bg-[#fcd535] hover:bg-yellow-300 text-[#0b0e11] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Method</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paymentMethods.map(m => (
            <div
              key={m.id}
              className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#181a20] border border-[#2b313a] flex items-center justify-center text-[#fcd535]">
                  {m.type === 'M-Pesa' ? <Smartphone className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{m.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{m.details}</div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteMethod(m.id)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#181a20] border border-[#2b313a] text-white space-y-4">
            <h3 className="text-base font-bold">Add Payment Method</h3>
            <form onSubmit={handleAddMethod} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Method Type</label>
                <select
                  value={newMethodType}
                  onChange={(e) => setNewMethodType(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Bank Transfer">Bank Transfer (Wire / ACH)</option>
                  <option value="M-Pesa">Safaricom M-Pesa</option>
                  <option value="Chipper Cash">Chipper Cash</option>
                  <option value="Revolut">Revolut</option>
                  <option value="Wise">Wise</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Account Details / Phone / Tag</label>
                <input
                  type="text"
                  value={newMethodDetails}
                  onChange={(e) => setNewMethodDetails(e.target.value)}
                  placeholder="e.g. Account: 12345678, Bank: Chase, Name: Vincent K."
                  className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b313a]">
                <button
                  type="button"
                  onClick={() => setShowAddMethod(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#fcd535] text-[#0b0e11] rounded-xl"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
