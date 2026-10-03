import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldCheck, CheckCircle2, AlertCircle, Clock, 
  RefreshCw, ChevronRight, Lock, ArrowLeft, MessageSquare, Zap
} from 'lucide-react';
import { P2POrder, TradeSession, UserInfo } from './p2p/P2PTypes';
import P2PNavigation from './p2p/P2PNavigation';
import P2PFilterBar from './p2p/P2PFilterBar';
import P2POrderRow from './p2p/P2POrderRow';
import P2POrderModal from './p2p/P2POrderModal';
import P2PEscrowTradeRoom from './p2p/P2PEscrowTradeRoom';
import P2PExpressTrade from './p2p/P2PExpressTrade';
import P2PUserCenter from './p2p/P2PUserCenter';
import P2PPostAdModal from './p2p/P2PPostAdModal';

interface P2PMarketplaceProps {
  currentUser: any;
  isDark: boolean;
  onBalanceUpdate?: () => void;
}

export default function P2PMarketplace({ currentUser, isDark, onBalanceUpdate }: P2PMarketplaceProps) {
  // Navigation tabs: 'marketplace' | 'express' | 'my-orders' | 'user-center'
  const [mainTab, setMainTab] = useState<'marketplace' | 'express' | 'my-orders' | 'user-center'>('marketplace');

  // Trade direction: 'buy' (user wants to buy crypto) | 'sell' (user wants to sell crypto)
  const [tradeDirection, setTradeDirection] = useState<'buy' | 'sell'>('buy');
  
  // Selected Crypto
  const [selectedCoin, setSelectedCoin] = useState<string>('USDT');

  // Filter Bar state
  const [fiatCurrency, setFiatCurrency] = useState<string>('USD');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'price' | 'completion' | 'orders'>('price');

  // Data state
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [activeTrades, setActiveTrades] = useState<TradeSession[]>([]);
  const [currentTrade, setCurrentTrade] = useState<TradeSession | null>(null);
  const [currentOrder, setCurrentOrder] = useState<P2POrder | null>(null);
  const [currentTradeBuyerEmail, setCurrentTradeBuyerEmail] = useState('');
  const [currentTradeSellerEmail, setCurrentTradeSellerEmail] = useState('');

  // The Overs (expanded order row drawer) & Modal
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<P2POrder | null>(null);

  // Modals & submission state
  const [showPostAdModal, setShowPostAdModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; success: boolean } | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);

  // Helper for effective user profile (ensures guest exploration also connects to live chat/trade room)
  const getEffectiveUser = () => {
    if (currentUser && currentUser.id) return currentUser;
    try {
      const saved = localStorage.getItem('lwex_p2p_demo_user');
      if (saved) return JSON.parse(saved);
      const demo = {
        id: 'trader_' + Math.random().toString(36).substring(2, 9),
        email: 'verified.trader@binance-p2p.com',
        name: 'Verified Trader',
        is_verified: true,
        real_balance: 5000
      };
      localStorage.setItem('lwex_p2p_demo_user', JSON.stringify(demo));
      return demo;
    } catch {
      return { id: 'trader_guest', email: 'guest@binance-p2p.com', name: 'Guest Trader', is_verified: true };
    }
  };

  const effectiveUser = getEffectiveUser();

  // User info / balance
  const [userInfo, setUserInfo] = useState<UserInfo>({
    balance: effectiveUser?.real_balance || 2500,
    verificationStatus: 'verified',
    completedTrades: 16
  });

  const triggerToast = (text: string, success: boolean = true) => {
    setFeedbackToast({ text, success });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  // Initial Data Loading
  useEffect(() => {
    fetchOrders();
    fetchMyTrades();
    fetchUserInfo();
  }, [currentUser]);

  // Periodic Refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchOrders();
          fetchMyTrades();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // Trade Room Live Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentTrade) {
      interval = setInterval(() => {
        refreshCurrentTrade(currentTrade.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentTrade?.id]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/p2p/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error fetching P2P ads:', e);
    }
  };

  const fetchMyTrades = async () => {
    const user = getEffectiveUser();
    if (!user) return;
    try {
      const res = await fetch('/api/p2p/trades', {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveTrades(data.trades || []);
      }
    } catch (e) {
      console.error('Error fetching user trades:', e);
    }
  };

  const fetchUserInfo = async () => {
    const user = getEffectiveUser();
    if (!user) return;
    try {
      const res = await fetch('/api/p2p/user-info', {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserInfo({
          balance: data.balance ?? (effectiveUser?.real_balance || 2500),
          verificationStatus: data.verificationStatus || 'verified',
          completedTrades: data.completedTrades || 16
        });
      }
    } catch (e) {
      console.error('Error loading portfolio:', e);
    }
  };

  const refreshCurrentTrade = async (tradeId: string) => {
    const user = getEffectiveUser();
    try {
      const res = await fetch(`/api/p2p/trades/${tradeId}`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentTrade(data.trade);
        if (data.order) setCurrentOrder(data.order);
        setCurrentTradeBuyerEmail(data.buyerEmail || 'Buyer');
        setCurrentTradeSellerEmail(data.sellerEmail || 'Seller');
        if (onBalanceUpdate) onBalanceUpdate();
      }
    } catch (e) {
      console.error('Error syncing trade room:', e);
    }
  };

  // Trade Initiation (Locking Escrow & DIRECTING to Room / Chat Room)
  const handleInitiateTrade = async (order: P2POrder, cryptoAmount: number) => {
    const user = getEffectiveUser();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/p2p/trades', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}` 
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: cryptoAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setExpandedOrderId(null);
        setSelectedOrderForModal(null);
        triggerToast(`Escrow Locked! Directing to Binance Live Trade & Chat Room...`, true);
        await refreshCurrentTrade(data.tradeId);
        fetchMyTrades();
        fetchUserInfo();
      } else {
        triggerToast(data.message || 'Failed to initiate escrow contract.', false);
      }
    } catch (e: any) {
      triggerToast('Error connecting to secure escrow cluster.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark As Paid
  const handleMarkAsPaid = async () => {
    if (!currentTrade) return;
    const user = getEffectiveUser();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/p2p/trades/${currentTrade.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Payment marked as sent! Seller notified to verify & release.', true);
        await refreshCurrentTrade(currentTrade.id);
        fetchMyTrades();
      } else {
        triggerToast(data.message || 'Failed to mark as paid.', false);
      }
    } catch (e) {
      triggerToast('Failed to update escrow state.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Release Escrow
  const handleReleaseEscrow = async () => {
    if (!currentTrade) return;
    const user = getEffectiveUser();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/p2p/trades/${currentTrade.id}/release`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Escrow Released! ${currentTrade.amount} ${currentTrade.coin} credited.`, true);
        await refreshCurrentTrade(currentTrade.id);
        fetchMyTrades();
        fetchUserInfo();
        if (onBalanceUpdate) onBalanceUpdate();
      } else {
        triggerToast(data.message || 'Could not release escrow.', false);
      }
    } catch (e) {
      triggerToast('Network timeout during release.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Trade
  const handleCancelTrade = async (targetTradeId?: string) => {
    const tradeId = targetTradeId || currentTrade?.id;
    if (!tradeId) return;
    const user = getEffectiveUser();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/p2p/trades/${tradeId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Order cancelled. Escrow returned to seller.', true);
        if (currentTrade?.id === tradeId) {
          await refreshCurrentTrade(tradeId);
        }
        await fetchMyTrades();
        await fetchUserInfo();
        await fetchOrders();
      } else {
        triggerToast(data.message || 'Cancellation failed.', false);
      }
    } catch (e) {
      triggerToast('Cancellation failed.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispute Trade
  const handleDisputeTrade = async (reason: string, details: string) => {
    if (!currentTrade) return;
    const user = getEffectiveUser();
    try {
      const res = await fetch(`/api/p2p/trades/${currentTrade.id}/dispute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}` 
        },
        body: JSON.stringify({ reason, details })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Dispute filed. Escrow frozen. Support agent assigned to live chat room.', true);
        await refreshCurrentTrade(currentTrade.id);
        fetchMyTrades();
      } else {
        triggerToast(data.message || 'Failed to file dispute.', false);
      }
    } catch (e) {
      triggerToast('Failed to file dispute.', false);
    }
  };

  // Send Chat Message
  const handleSendChat = async (text: string) => {
    if (!currentTrade) return;
    const user = getEffectiveUser();
    try {
      const res = await fetch(`/api/p2p/trades/${currentTrade.id}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}` 
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        refreshCurrentTrade(currentTrade.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Post New Merchant Ad
  const handleCreateAd = async (adData: any) => {
    const user = getEffectiveUser();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/p2p/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}` 
        },
        body: JSON.stringify(adData)
      });
      const data = await res.json();
      if (data.success) {
        setShowPostAdModal(false);
        triggerToast('Your advertisement is now live on the Binance P2P order book!', true);
        fetchOrders();
        fetchUserInfo();
      } else {
        triggerToast(data.message || 'Failed to post advertisement.', false);
      }
    } catch (e) {
      triggerToast('Communication error with ad engine.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Sorted Order Book
  const filteredOrders = orders.filter(order => {
    const expectedListingType = tradeDirection === 'buy' ? 'sell' : 'buy';
    if (order.type !== expectedListingType) return false;

    if (selectedCoin !== 'ALL' && order.coin !== selectedCoin) return false;
    if (fiatCurrency !== 'ALL' && (order.fiat_currency || 'USD') !== fiatCurrency) return false;

    if (paymentFilter !== 'all') {
      const pm = (order.paymentMethod || '').toLowerCase();
      if (!pm.includes(paymentFilter.toLowerCase())) return false;
    }

    if (amountFilter) {
      const target = parseFloat(amountFilter);
      if (!isNaN(target)) {
        const minL = order.min_limit ?? 0;
        const maxL = order.max_limit ?? (order.amount * order.price);
        if (target < minL || target > maxL) return false;
      }
    }

    if (verifiedOnly && !order.is_verified) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price') {
      return tradeDirection === 'buy' ? a.price - b.price : b.price - a.price;
    }
    if (sortBy === 'completion') {
      return (b.completion_rate || 99) - (a.completion_rate || 99);
    }
    if (sortBy === 'orders') {
      return (b.orders_count || 0) - (a.orders_count || 0);
    }
    return 0;
  });

  const activeEscrows = activeTrades.filter(t => t.status === 'open' || t.status === 'paid');
  const activeEscrowsCount = activeEscrows.length;

  return (
    <div className={`w-full max-w-[1440px] mx-auto space-y-5 font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-fade-in ${
          feedbackToast.success 
            ? 'bg-[#181a20]/95 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10' 
            : 'bg-[#181a20]/95 border-rose-500/50 text-rose-400 shadow-rose-500/10'
        }`}>
          {feedbackToast.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-xs font-semibold text-white">{feedbackToast.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECT TO ROOM / CHAT ROOM VIEW (Active Binance Escrow Trade Session)     */}
      {/* ========================================================================= */}
      {currentTrade ? (
        <div className="space-y-4 animate-fade-in">
          {/* Top Breadcrumb & Live Room Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#181a20] border border-[#2b313a]">
            <button
              onClick={() => {
                setCurrentTrade(null);
                fetchMyTrades();
              }}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-300 hover:text-[#fcd535] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#fcd535]" />
              <span>← Back to P2P Marketplace (Trade #P2P-{currentTrade.id.substring(0, 8)} Active)</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-2 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Escrow Room & Chat Active</span>
              </span>
            </div>
          </div>

          {/* Full Dedicated Binance Trade & Chat Room */}
          <P2PEscrowTradeRoom
            trade={currentTrade}
            order={currentOrder}
            currentUser={effectiveUser}
            buyerEmail={currentTradeBuyerEmail}
            sellerEmail={currentTradeSellerEmail}
            onMarkPaid={handleMarkAsPaid}
            onRelease={handleReleaseEscrow}
            onCancel={handleCancelTrade}
            onDispute={handleDisputeTrade}
            onSendChat={handleSendChat}
            onBackToOrders={() => {
              setCurrentTrade(null);
              fetchMyTrades();
            }}
            isSubmitting={isSubmitting}
            isDark={isDark}
            onTriggerToast={triggerToast}
          />
        </div>
      ) : (
        <>
          {/* Persistent Banner if user has open trades waiting */}
          {activeEscrowsCount > 0 && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-yellow-500/15 via-[#fcd535]/10 to-amber-500/15 border border-[#fcd535]/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5 text-xs text-[#fcd535] font-bold font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
                <span>You have an ongoing P2P escrow trade with active chat room!</span>
              </div>
              <button
                onClick={() => {
                  const active = activeEscrows[0];
                  if (active) refreshCurrentTrade(active.id);
                }}
                className="w-full sm:w-auto px-4 py-1.5 bg-[#fcd535] hover:bg-yellow-300 text-[#0b0e11] font-black text-xs rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Enter Live Chat Room →</span>
              </button>
            </div>
          )}

          {/* 1. TOP BINANCE NAVIGATION & SUB-BAR */}
          <P2PNavigation
            activeTab={mainTab}
            onSelectTab={setMainTab}
            activeEscrowsCount={activeEscrowsCount}
            onPostAdClick={() => setShowPostAdModal(true)}
            isDark={isDark}
          />

          {/* 2. TAB CONTENT ROUTING */}
          {mainTab === 'marketplace' && (
            <div className="space-y-4">
              
              {/* Trading Controls & Filters */}
              <P2PFilterBar
                tradeDirection={tradeDirection}
                onTradeDirectionChange={(dir) => {
                  setTradeDirection(dir);
                  setExpandedOrderId(null);
                }}
                selectedCoin={selectedCoin}
                onCoinChange={(coin) => {
                  setSelectedCoin(coin);
                  setExpandedOrderId(null);
                }}
                amountFilter={amountFilter}
                onAmountFilterChange={setAmountFilter}
                fiatCurrency={fiatCurrency}
                onFiatCurrencyChange={setFiatCurrency}
                paymentFilter={paymentFilter}
                onPaymentFilterChange={setPaymentFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                verifiedOnly={verifiedOnly}
                onVerifiedOnlyChange={setVerifiedOnly}
                refreshCountdown={refreshCountdown}
                onRefreshClick={() => {
                  fetchOrders();
                  setRefreshCountdown(15);
                }}
                isDark={isDark}
              />

              {/* Advertiser Order Book Table */}
              <div className={`rounded-2xl border overflow-hidden ${
                isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                
                {/* Table Header (Exact Binance P2P columns) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-[#2b313a] bg-[#1e2329]/40">
                  <div className="col-span-4">Advertiser (Rate / Speed)</div>
                  <div className="col-span-2 text-right md:text-left">Price</div>
                  <div className="col-span-3">Available & Limit</div>
                  <div className="col-span-2">Payment Methods</div>
                  <div className="col-span-1 text-right">Trade</div>
                </div>

                {/* Empty State */}
                {filteredOrders.length === 0 && (
                  <div className="py-16 text-center space-y-3">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-400">No advertisements found matching your criteria</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try adjusting your fiat currency, payment rail, or amount filter to find active verified merchants.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCoin('USDT');
                        setFiatCurrency('ALL');
                        setPaymentFilter('all');
                        setAmountFilter('');
                        setVerifiedOnly(false);
                      }}
                      className="px-4 py-1.5 text-xs text-[#fcd535] bg-yellow-400/10 border border-yellow-400/30 rounded-lg hover:bg-yellow-400/20 font-bold transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}

                {/* Order Rows with direct order modal and expandable drawer */}
                <div>
                  {filteredOrders.map(order => (
                    <P2POrderRow
                      key={order.id}
                      order={order}
                      tradeDirection={tradeDirection}
                      isExpanded={expandedOrderId === order.id}
                      onToggleExpand={() => {
                        setExpandedOrderId(prev => prev === order.id ? null : order.id);
                      }}
                      onOpenModal={(ord) => {
                        setSelectedOrderForModal(ord);
                      }}
                      onInitiateTrade={handleInitiateTrade}
                      userBalance={userInfo.balance}
                      currentUser={effectiveUser}
                      isSubmitting={isSubmitting}
                      isDark={isDark}
                    />
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* EXPRESS MODE */}
          {mainTab === 'express' && (
            <P2PExpressTrade
              orders={orders}
              currentUser={effectiveUser}
              userBalance={userInfo.balance}
              onInitiateTrade={handleInitiateTrade}
              isSubmitting={isSubmitting}
              isDark={isDark}
              onTriggerToast={triggerToast}
            />
          )}

          {/* MY ORDERS & ESCROW LIST */}
          {mainTab === 'my-orders' && (
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-black text-white">Your P2P Escrow Orders & Chat History</h3>
                  <p className="text-xs text-slate-400">View active escrow trades, release audits, and re-enter live chat rooms.</p>
                </div>
              </div>

              {activeTrades.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-400">No trades found</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not opened any P2P trades yet. Browse the order book to purchase or sell crypto with zero fees.
                  </p>
                  <button
                    onClick={() => setMainTab('marketplace')}
                    className="px-4 py-2 bg-[#fcd535] text-[#0b0e11] font-black text-xs rounded-xl hover:bg-yellow-300 transition-colors cursor-pointer"
                  >
                    Go To Order Book
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTrades.map(trade => {
                    const isBuyer = effectiveUser && trade.buyer_id === effectiveUser.id;
                    return (
                      <div
                        key={trade.id}
                        className="p-4 rounded-xl bg-[#0b0e11] border border-[#2b313a] hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                              isBuyer ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {isBuyer ? 'BUYING' : 'SELLING'}
                            </span>
                            <span className="text-sm font-black text-white font-mono">
                              {trade.amount} {trade.coin}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              ≈ ${(trade.amount * trade.price).toFixed(2)} USD
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Order ID: #{trade.id.substring(0, 10)} · {new Date(trade.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                            trade.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : trade.status === 'paid'
                                ? 'bg-yellow-500/10 text-[#fcd535] border border-yellow-500/20'
                                : trade.status === 'open'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-800 text-slate-400'
                          }`}>
                            {trade.status.toUpperCase()}
                          </span>

                          {trade.status === 'open' && (
                            <button
                              onClick={() => handleCancelTrade(trade.id)}
                              disabled={isSubmitting}
                              className="px-3 py-2 bg-[#2b313a] hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/50 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => refreshCurrentTrade(trade.id)}
                            className="px-4 py-2 bg-[#fcd535] hover:bg-yellow-300 text-[#0b0e11] font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Enter Live Chat Room</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* USER CENTER */}
          {mainTab === 'user-center' && (
            <P2PUserCenter
              currentUser={effectiveUser}
              userInfo={userInfo}
              isDark={isDark}
              onTriggerToast={triggerToast}
            />
          )}

          {/* DEDICATED ORDER CONFIRMATION MODAL (Direct to Chat Room) */}
          <P2POrderModal
            isOpen={selectedOrderForModal !== null}
            onClose={() => setSelectedOrderForModal(null)}
            order={selectedOrderForModal}
            tradeDirection={tradeDirection}
            onInitiateTrade={handleInitiateTrade}
            userBalance={userInfo.balance}
            currentUser={effectiveUser}
            isSubmitting={isSubmitting}
            isDark={isDark}
          />

          {/* POST NEW AD MODAL */}
          <P2PPostAdModal
            isOpen={showPostAdModal}
            onClose={() => setShowPostAdModal(false)}
            currentUser={effectiveUser}
            onSubmitAd={handleCreateAd}
            isSubmitting={isSubmitting}
          />
        </>
      )}

    </div>
  );
}
