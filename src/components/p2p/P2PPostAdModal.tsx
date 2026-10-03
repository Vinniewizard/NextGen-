import React, { useState } from 'react';
import { X, PlusCircle, ShieldCheck } from 'lucide-react';
import { COIN_LIST, FIAT_CURRENCIES, PAYMENT_METHODS } from './P2PTypes';

interface P2PPostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onSubmitAd: (adData: any) => Promise<void>;
  isSubmitting: boolean;
}

export default function P2PPostAdModal({
  isOpen,
  onClose,
  currentUser,
  onSubmitAd,
  isSubmitting
}: P2PPostAdModalProps) {
  const [adForm, setAdForm] = useState({
    type: 'sell',
    coin: 'USDT',
    amount: '1000',
    price: '1.00',
    fiat_currency: 'USD',
    paymentMethod: 'Bank Transfer',
    merchant_name: currentUser?.fullName || 'My_Trading_Desk',
    min_limit: '10',
    max_limit: '1000',
    payment_details: 'Bank of America | Acct: 1234 5678 9012 | Name: ' + (currentUser?.fullName || 'Trader'),
    terms: 'Strictly no third-party payments. Instant release once funds reflect in account.',
    required_kyc: false,
    required_min_trades: '0'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAd({
      ...adForm,
      amount: parseFloat(adForm.amount),
      price: parseFloat(adForm.price),
      min_limit: parseFloat(adForm.min_limit),
      max_limit: parseFloat(adForm.max_limit),
      required_min_trades: parseInt(adForm.required_min_trades, 10) || 0,
      required_kyc: adForm.required_kyc ? 1 : 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-[#181a20] border border-[#2b313a] text-white shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#2b313a] pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#fcd535]" />
            <h3 className="text-base font-black">Post P2P Advertisement</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">I Want To</label>
              <select
                value={adForm.type}
                onChange={(e) => setAdForm({ ...adForm, type: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="sell">Sell Crypto (Receive Fiat)</option>
                <option value="buy">Buy Crypto (Pay Fiat)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Asset</label>
              <select
                value={adForm.coin}
                onChange={(e) => setAdForm({ ...adForm, coin: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-bold"
              >
                {COIN_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Total Quantity</label>
              <input
                type="number"
                value={adForm.amount}
                onChange={(e) => setAdForm({ ...adForm, amount: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={adForm.price}
                onChange={(e) => setAdForm({ ...adForm, price: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Fiat Currency</label>
              <select
                value={adForm.fiat_currency}
                onChange={(e) => setAdForm({ ...adForm, fiat_currency: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-bold"
              >
                {FIAT_CURRENCIES.filter(f => f.code !== 'ALL').map(f => (
                  <option key={f.code} value={f.code}>{f.code}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Min Order Limit</label>
              <input
                type="number"
                value={adForm.min_limit}
                onChange={(e) => setAdForm({ ...adForm, min_limit: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Max Order Limit</label>
              <input
                type="number"
                value={adForm.max_limit}
                onChange={(e) => setAdForm({ ...adForm, max_limit: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Payment Method</label>
              <select
                value={adForm.paymentMethod}
                onChange={(e) => setAdForm({ ...adForm, paymentMethod: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-bold"
              >
                {PAYMENT_METHODS.filter(p => p !== 'All Payments').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Merchant Display Name</label>
              <input
                type="text"
                value={adForm.merchant_name}
                onChange={(e) => setAdForm({ ...adForm, merchant_name: e.target.value })}
                className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Payment Account Credentials</label>
            <input
              type="text"
              value={adForm.payment_details}
              onChange={(e) => setAdForm({ ...adForm, payment_details: e.target.value })}
              placeholder="e.g. Bank of America / Safaricom M-Pesa Paybill / Chipper Tag"
              className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Terms of Trade</label>
            <textarea
              rows={2}
              value={adForm.terms}
              onChange={(e) => setAdForm({ ...adForm, terms: e.target.value })}
              className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-sans text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b313a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#fcd535] hover:bg-yellow-300 text-[#0b0e11] font-bold rounded-xl cursor-pointer shadow-md disabled:opacity-40"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Advertisement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
