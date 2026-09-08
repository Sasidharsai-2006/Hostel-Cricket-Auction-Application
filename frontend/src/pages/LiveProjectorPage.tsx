import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shield, Wallet, Sparkles } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { AuctionPlayerCard } from '../components/AuctionPlayerCard';

export const LiveProjectorPage: React.FC = () => {
  const { auctionState, teams } = useAuction();

  const isSold = auctionState?.status === 'SOLD';
  const isUnsold = auctionState?.status === 'UNSOLD';
  const isLive = auctionState?.status === 'ACTIVE' || auctionState?.status === 'PAUSED';

  return (
    <div className="min-h-screen w-full bg-[#070A11] text-white flex flex-col justify-between p-6 lg:p-10 relative overflow-hidden select-none">
      {/* Dynamic Background Atmosphere Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header / Scoreboard Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-glow-gold">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-black text-3xl lg:text-4xl tracking-wider text-white uppercase leading-none">
              HOSTEL CRICKET AUCTION 2026
            </h1>
            <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase mt-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> OFFICIAL LIVE STAGE BROADCAST
            </p>
          </div>
        </div>

        {/* Live Stage Badge & Timer */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              CURRENT ROUND
            </span>
            <span className="font-display font-black text-2xl text-amber-400">
              ROUND {auctionState?.roundNumber || 1}
            </span>
          </div>

          {isLive && (
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl shadow-glow-red">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-display font-black text-sm tracking-wider text-rose-400 uppercase">
                BIDDING IN PROGRESS
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Centerpiece: Massive Player Card Stage */}
      <main className="my-auto py-6 max-w-7xl mx-auto w-full">
        <AuctionPlayerCard
          player={auctionState?.player || null}
          currentPrice={auctionState?.currentPrice || 0}
          startingPrice={auctionState?.startingPrice || 0}
          highestBidderTeamName={auctionState?.highestBidderTeamName}
          callState={auctionState?.callState}
          size="projector"
        />
      </main>

      {/* Fullscreen Celebration Overlay for SOLD */}
      <AnimatePresence>
        {isSold && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <div className="max-w-3xl w-full bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-amber-500 rounded-3xl p-10 lg:p-14 text-center shadow-glow-gold">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="inline-block px-8 py-2.5 rounded-full bg-emerald-500 text-slate-950 font-display font-black text-3xl lg:text-4xl tracking-wider uppercase mb-6 shadow-2xl"
              >
                🎉 SOLD! SOLD! SOLD! 🎉
              </motion.div>

              <h2 className="font-display font-black text-5xl lg:text-7xl text-white uppercase tracking-tight mb-4">
                {auctionState?.player?.name}
              </h2>

              <p className="text-lg text-slate-400 font-semibold uppercase tracking-widest mb-6">
                {auctionState?.player?.role} • {auctionState?.player?.year}
              </p>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around gap-6">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                    PURCHASED BY
                  </span>
                  <span className="font-display font-black text-3xl lg:text-4xl text-amber-400">
                    {auctionState?.highestBidderTeamName}
                  </span>
                </div>

                <div className="h-12 w-px bg-slate-800" />

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                    FINAL PRICE
                  </span>
                  <span className="font-display font-black text-4xl lg:text-5xl text-emerald-400">
                    ₹{auctionState?.currentPrice}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Overlay for UNSOLD */}
      <AnimatePresence>
        {isUnsold && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md"
          >
            <div className="max-w-xl w-full bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-10 text-center shadow-glow-red">
              <span className="inline-block px-6 py-2 rounded-full bg-rose-600 text-white font-display font-bold text-xl uppercase tracking-wider mb-4">
                UNSOLD
              </span>
              <h2 className="font-display font-bold text-4xl text-white uppercase mb-2">
                {auctionState?.player?.name}
              </h2>
              <p className="text-sm text-slate-400">
                Player received no bids. Eligible to return in next round.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Ticker: All 6 Franchise Purses in Live Real Time */}
      <footer className="pt-6 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3 text-xs uppercase font-bold text-slate-400 tracking-wider">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-400" /> ALL 6 FRANCHISE BALANCES
          </span>
          <span>1000 INITIAL BUDGET</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {teams.map((t) => {
            const isLeadingThis = auctionState?.highestBidderTeamId === t.id;
            return (
              <div
                key={t.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isLeadingThis
                    ? 'bg-amber-500/10 border-amber-500 shadow-glow-gold'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-display font-bold text-sm text-white truncate">
                    {t.name}
                  </span>
                  {isLeadingThis && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  )}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400">Purse:</span>
                  <span className="font-display font-bold text-base text-emerald-400">
                    ₹{t.currentPurse}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {t.playerCount} Players
                </div>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
