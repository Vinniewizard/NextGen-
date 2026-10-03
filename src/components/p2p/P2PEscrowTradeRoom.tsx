import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, Clock, Copy, Send, 
  ChevronRight, AlertTriangle, Lock, X, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { TradeSession, P2POrder, ChatMessage } from './P2PTypes';

interface P2PEscrowTradeRoomProps {
  trade: TradeSession;
  order: P2POrder | null;
  currentUser: any;
  buyerEmail: string;
  sellerEmail: string;
  onMarkPaid: () => Promise<void>;
  onRelease: () => Promise<void>;
  onCancel: () => Promise<void>;
  onDispute: (reason: string, details: string) => Promise<void>;
  onSendChat: (text: string) => Promise<void>;
  onBackToOrders: () => void;
  isSubmitting: boolean;
  isDark: boolean;
  onTriggerToast: (msg: string, success?: boolean) => void;
}

export default function P2PEscrowTradeRoom({
  trade,
  order,
  currentUser,
  buyerEmail,
  sellerEmail,
  onMarkPaid,
  onRelease,
  onCancel,
  onDispute,
  onSendChat,
  onBackToOrders,
  isSubmitting,
  isDark,
  onTriggerToast
}: P2PEscrowTradeRoomProps) {
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState('15:00');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Payment not received after 15 minutes');
  const [disputeDetails, setDisputeDetails] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const isUserBuyer = currentUser && trade.buyer_id === currentUser.id;
  const isUserSeller = currentUser && trade.seller_id === currentUser.id;

  // Live Escrow Countdown for Unpaid Orders (Strict Binance Rules)
  useEffect(() => {
    // When order is marked as Paid, it NEVER expires or auto-cancels
    if (trade.status !== 'open') {
      setTimeLeft(trade.status === 'paid' ? 'Protected' : trade.status);
      return;
    }

    const updateTimer = () => {
      const created = new Date(trade.created_at).getTime();
      const expires = created + 15 * 60 * 1000;
      const remaining = expires - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Expired');
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [trade.created_at, trade.status]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trade.chat_messages]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    onTriggerToast(`Copied ${fieldName} to clipboard!`, true);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const parsedChatMessages: ChatMessage[] = trade.chat_messages
    ? (() => {
        try { return JSON.parse(trade.chat_messages); } catch { return []; }
      })()
    : [];

  const totalFiat = (trade.amount * trade.price).toFixed(2);
  const fiatCurrency = order?.fiat_currency || 'USD';

  return (
    <div className={`rounded-2xl border overflow-hidden font-sans ${
      isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Top Header & Status Bar */}
      <div className="p-5 border-b border-[#2b313a] bg-[#1e2329]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToOrders}
              className="p-1 hover:bg-[#2b313a] rounded-lg text-slate-400 hover:text-white mr-1 cursor-pointer"
              title="Back to Orders"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-400">Order ID:</span>
            <span className="text-sm font-mono font-black text-[#fcd535]">#{trade.id.substring(0, 12)}</span>
            <button 
              onClick={() => copyToClipboard(trade.id, 'Order ID')}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-slate-400">
            Created: {new Date(trade.created_at).toLocaleTimeString()} · Counterparty: {isUserBuyer ? (order?.merchant_name || sellerEmail) : buyerEmail}
          </div>
        </div>

        {/* 3-Step Binance Stepper */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">1. Escrow Locked</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          <div className={`flex items-center gap-1.5 font-bold ${
            trade.status === 'open' 
              ? 'text-[#fcd535] animate-pulse' 
              : 'text-emerald-400'
          }`}>
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
            <span className="hidden sm:inline">2. Paid</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

          <div className={`flex items-center gap-1.5 font-bold ${
            trade.status === 'completed' 
              ? 'text-emerald-400' 
              : 'text-slate-500'
          }`}>
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
            <span className="hidden sm:inline">3. Released</span>
          </div>
        </div>

        {/* Dynamic Countdown or Status Badge */}
        {trade.status === 'open' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Pay within: {timeLeft}</span>
          </div>
        )}
        {trade.status === 'paid' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Paid · Escrow Protected (Awaiting Release)</span>
          </div>
        )}
        {trade.status === 'disputed' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Appeal Active · Arbitration in Progress</span>
          </div>
        )}
        {trade.status === 'completed' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Order Completed</span>
          </div>
        )}
        {trade.status === 'cancelled' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold">
            <span>Order Cancelled</span>
          </div>
        )}
      </div>

      {/* Main Two-Column Trade Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2b313a]">
        
        {/* Left Panel: Escrow Payment Details & Controls */}
        <div className="lg:col-span-7 p-6 space-y-6">
          
          {/* Amount Due Card */}
          <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
              Fiat Amount To Transfer
            </span>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {parseFloat(totalFiat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-bold text-[#fcd535] ml-2">{fiatCurrency}</span>
              </div>
              <button
                onClick={() => copyToClipboard(totalFiat, 'Amount')}
                className="px-2.5 py-1 text-xs text-[#fcd535] bg-yellow-400/10 border border-yellow-400/30 rounded-lg hover:bg-yellow-400/20 flex items-center gap-1 cursor-pointer font-mono"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Amount</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#2b313a] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Crypto in Escrow:</span>
              <span className="text-white font-bold">{trade.amount} {trade.coin}</span>
            </div>
          </div>

          {/* Seller Verified Payment Credentials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Seller Payment Information
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Verified Account
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-[#2b313a]/60">
                <span className="text-slate-400">Payment Rail</span>
                <span className="text-white font-bold">{order?.paymentMethod || 'Bank Transfer'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#2b313a]/60">
                <span className="text-slate-400">Account / Instructions</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#fcd535] font-bold max-w-[280px] truncate text-right">
                    {order?.payment_details || 'Bank of America | 4820 9182 4410'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order?.payment_details || '', 'Account Details')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Payment Reference</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">P2P-{trade.id.substring(0, 8)}</span>
                  <button
                    onClick={() => copyToClipboard(`P2P-${trade.id.substring(0, 8)}`, 'Payment Reference')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Guarantee Card */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-200">100% Escrow Protection Active</span>
              The seller's {trade.amount} {trade.coin} is locked in the system vault. The seller cannot cancel or withdraw these funds while the trade is active.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Buyer Controls */}
            {isUserBuyer && (
              <div className="flex flex-col sm:flex-row gap-3">
                {trade.status === 'open' && (
                  <button
                    onClick={() => setShowMarkPaidModal(true)}
                    className="flex-1 py-3 px-4 bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-[#0b0e11] font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transferred, Notify Seller</span>
                  </button>
                )}
                {trade.status === 'open' && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={isSubmitting}
                    className="py-3 px-4 bg-[#2b313a] hover:bg-[#363d47] text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
                {(trade.status === 'paid' || trade.status === 'open') && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="py-3 px-4 bg-[#2b313a] hover:bg-[#363d47] text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl border border-rose-900/30 transition-colors cursor-pointer"
                  >
                    Appeal / Need Help
                  </button>
                )}
              </div>
            )}

            {/* Seller Controls */}
            {isUserSeller && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={trade.status !== 'paid'}
                  onClick={() => setShowReleaseModal(true)}
                  className={`flex-1 py-3 px-4 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    trade.status === 'paid'
                      ? 'bg-[#fcd535] hover:bg-yellow-300 text-[#0b0e11] shadow-yellow-500/20 animate-pulse'
                      : 'bg-[#2b313a] text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Payment Received & Release Crypto</span>
                </button>
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="py-3 px-4 bg-[#2b313a] hover:bg-[#363d47] text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl border border-rose-900/30 transition-colors cursor-pointer"
                >
                  Appeal / Dispute
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Panel: Live Trade Chat Arena */}
        <div className="lg:col-span-5 flex flex-col h-[520px]">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-[#2b313a] bg-[#1e2329]/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-white">Live Trade Chat</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Escrow Bot Connected</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs font-sans scrollbar-thin">
            {parsedChatMessages.map(msg => {
              const isSystem = msg.sender === 'system';
              const isMe = currentUser && msg.sender === currentUser.id;
              const isMerchant = msg.sender === 'merchant';

              if (isSystem) {
                return (
                  <div key={msg.id} className="p-2.5 rounded-xl bg-[#0b0e11] border border-[#2b313a] text-center text-slate-300 text-[11px] leading-relaxed">
                    <span className="font-bold text-[#fcd535] mr-1">⚡ Escrow Guard:</span>
                    {msg.text}
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    isMe 
                      ? 'bg-[#fcd535] text-[#0b0e11] font-medium rounded-tr-none' 
                      : isMerchant 
                        ? 'bg-[#2b313a] text-slate-100 rounded-tl-none border border-yellow-500/30'
                        : 'bg-[#0b0e11] text-slate-200 rounded-tl-none border border-[#2b313a]'
                  }`}>
                    <div className="text-[9px] font-mono opacity-70 mb-0.5">
                      {isMe ? 'You' : isMerchant ? 'Verified Merchant' : (msg.senderEmail || 'Counterparty')}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Canned Quick Replies */}
          <div className="px-3 py-2 border-t border-[#2b313a] bg-[#0b0e11] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              "I've transferred the funds", 
              "Checking bank now, 1 min", 
              "Payment verified, releasing!", 
              "Hello, ready to trade"
            ].map((canned, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setChatInput(canned)}
                className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-[#181a20] hover:bg-[#2b313a] border border-[#2b313a] text-slate-300 hover:text-white whitespace-nowrap cursor-pointer"
              >
                {canned}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#2b313a] bg-[#1e2329]/60 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message to counterparty..."
              className="flex-1 bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#fcd535]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 bg-[#fcd535] hover:bg-yellow-300 disabled:opacity-40 text-[#0b0e11] rounded-xl transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

      {/* Safety Confirmation Modals */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#181a20] border border-[#2b313a] text-white space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold">Confirm Payment Transferred</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Have you truly completed the transfer of <strong className="text-[#fcd535] font-mono">{totalFiat} {fiatCurrency}</strong> using your own account? Marking as paid without making payment violates terms and risks account suspension.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b313a]">
              <button
                onClick={() => setShowMarkPaidModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Go Back
              </button>
              <button
                onClick={async () => {
                  setShowMarkPaidModal(false);
                  await onMarkPaid();
                }}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-[#0b0e11] rounded-xl shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Confirming...' : 'Yes, I Have Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#181a20] border border-[#2b313a] text-white space-y-4">
            <div className="flex items-center gap-2 text-[#fcd535]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold">Release Crypto From Escrow</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>CRITICAL CHECK:</strong> Have you logged into your bank account or M-Pesa app and verified the payment of <strong className="text-white">{totalFiat} {fiatCurrency}</strong> has arrived? Never rely on SMS or counterparty claims. Escrow release is permanent and cannot be reversed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b313a]">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowReleaseModal(false);
                  await onRelease();
                }}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-[#fcd535] hover:bg-yellow-300 text-[#0b0e11] rounded-xl shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Releasing...' : 'Confirm & Release Crypto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#181a20] border border-[#2b313a] text-white space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold">File Escrow Appeal</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filing an appeal freezes the escrow funds. An arbitration officer will join the chat room to review bank transaction statements.
            </p>
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Reason for Appeal</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Payment not received after 15 minutes">Payment not received after 15 minutes</option>
                  <option value="Incorrect payment amount received">Incorrect payment amount received</option>
                  <option value="Third party account used without consent">Third party account used without consent</option>
                  <option value="Seller unresponsive">Seller unresponsive</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Additional Evidence / Notes</label>
                <textarea
                  rows={2}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="Paste transaction reference code or details..."
                  className="w-full bg-[#0b0e11] border border-[#2b313a] rounded-xl px-3 py-2 text-white font-sans text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b313a]">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  setShowDisputeModal(false);
                  await onDispute(disputeReason, disputeDetails);
                }}
                className="px-5 py-2 text-xs font-bold bg-[#f6465d] hover:bg-rose-500 text-white rounded-xl shadow-md cursor-pointer"
              >
                Submit Appeal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#181a20] border border-[#2b313a] text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold">Cancel P2P Escrow Order</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel this trade? 
              If you have already transferred the fiat funds, <strong className="text-rose-400 font-bold">DO NOT CANCEL</strong> as you could lose your payment. Cancelling will return the locked crypto from escrow back to the seller.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b313a]">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Keep Order Active
              </button>
              <button
                onClick={async () => {
                  setShowCancelModal(false);
                  await onCancel();
                }}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
