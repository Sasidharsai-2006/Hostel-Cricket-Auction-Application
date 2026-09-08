import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';
import { auctionService } from '../services/api';

interface BidControlsProps {
  currentPrice: number;
  highestBidderTeamId?: number | null;
  isActive: boolean;
}

export const BidControls: React.FC<BidControlsProps> = ({
  currentPrice,
  highestBidderTeamId,
  isActive,
}) => {
  const { user } = useAuth();
  const { teams, showToast } = useAuction();
  const [submitting, setSubmitting] = useState(false);
  const [customBid, setCustomBid] = useState<string>('');

  const myTeamId = user?.teamId;
  const myTeam = teams.find((t) => t.id === myTeamId);
  const myPurse = myTeam ? myTeam.currentPurse : 0;

  const isLeading = highestBidderTeamId === myTeamId && myTeamId !== null;

  // Next bid increments
  const hasBids = highestBidderTeamId != null;
  const nextMinBid = hasBids ? currentPrice + 10 : currentPrice;
  const bidOptions = [
    nextMinBid,
    currentPrice + 20,
    currentPrice + 50,
    currentPrice + 100,
  ].filter((amt, idx, self) => amt > currentPrice || (!hasBids && amt === currentPrice) && self.indexOf(amt) === idx);

  const handlePlaceBid = async (amount: number) => {
    if (!user || !myTeamId) {
      showToast('Captain not authenticated properly', 'error');
      return;
    }

    if (amount > myPurse) {
      showToast(`Insufficient Purse! You have ₹${myPurse}, but bid is ₹${amount}`, 'error');
      return;
    }

    if (isLeading) {
      showToast('Your team is already the highest bidder!', 'info');
      return;
    }

    setSubmitting(true);
    try {
      await auctionService.bid(user.username, myTeamId, amount);
      setCustomBid('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to place bid';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customBid);
    if (isNaN(parsed)) return;
    handlePlaceBid(parsed);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-400" />
            CAPTAIN BIDDING CONTROLS
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Increase bid to outbid competing captains
          </p>
        </div>

        {/* Current Team Purse Chip */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl">
          <span className="text-xs font-medium text-slate-400">Available Purse:</span>
          <span className={`font-display font-bold text-lg ${myPurse < 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
            ₹{myPurse}
          </span>
        </div>
      </div>

      {/* Leading indicator */}
      {isLeading && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          YOUR TEAM CURRENTLY HOLDS THE WINNING BID (₹{currentPrice})
        </div>
      )}

      {/* Quick Bid Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {bidOptions.map((amount) => {
          const disabled = !isActive || isLeading || submitting || amount > myPurse;
          const exceedsPurse = amount > myPurse;

          return (
            <motion.button
              key={amount}
              whileTap={!disabled ? { scale: 0.96 } : {}}
              onClick={() => handlePlaceBid(amount)}
              disabled={disabled}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl font-display font-bold text-lg transition-all ${
                disabled
                  ? 'bg-slate-800/40 border border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border border-amber-400 text-slate-950 shadow-glow-gold'
              }`}
            >
              <span className="text-xs font-sans font-medium uppercase tracking-wider opacity-80">
                {amount === nextMinBid ? 'NEXT MIN' : `+₹${amount - currentPrice}`}
              </span>
              <span className="text-2xl font-black tracking-tight mt-0.5">
                ₹{amount}
              </span>
              {exceedsPurse && (
                <span className="absolute -bottom-2 text-[9px] bg-rose-900 border border-rose-600 text-rose-200 px-1.5 py-0.5 rounded font-sans uppercase">
                  Insufficient Purse
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Custom Bid Input Form */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
          <input
            type="number"
            min={nextMinBid}
            max={myPurse}
            placeholder={`Custom bid amount (min ₹${nextMinBid})...`}
            value={customBid}
            onChange={(e) => setCustomBid(e.target.value)}
            disabled={!isActive || isLeading || submitting}
            className="w-full pl-8 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={!isActive || isLeading || submitting || !customBid || parseInt(customBid) < nextMinBid || parseInt(customBid) > myPurse}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-display font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'BIDDING...' : 'PLACE BID'}
        </button>
      </form>

      {!isActive && (
        <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Bidding is disabled until the administrator starts the next auction.
        </div>
      )}
    </div>
  );
};
