import React from 'react';
import { motion } from 'framer-motion';
import { Player, CallState } from '../types';
import { Shield, Sparkles, TrendingUp, Trophy } from 'lucide-react';

interface AuctionPlayerCardProps {
  player: Player | null;
  currentPrice: number;
  startingPrice: number;
  highestBidderTeamName?: string | null;
  callState?: CallState;
  size?: 'normal' | 'projector';
}

export const AuctionPlayerCard: React.FC<AuctionPlayerCardProps> = ({
  player,
  currentPrice,
  startingPrice,
  highestBidderTeamName,
  callState,
  size = 'normal',
}) => {
  if (!player) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[420px]">
        <Trophy className="w-16 h-16 text-slate-700 mb-4 stroke-1" />
        <h3 className="text-xl font-display font-semibold text-slate-300">NO PLAYER CURRENTLY ON STAGE</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          The auctioneer will select and present the next participant shortly.
        </p>
      </div>
    );
  }

  const isProjector = size === 'projector';

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    BATSMAN: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
    BOWLER: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
    ALL_ROUNDER: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
    WICKET_KEEPER: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  };

  const roleTheme = roleColors[player.role] || {
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-500/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 shadow-2xl backdrop-blur-xl ${
        isProjector ? 'p-8 lg:p-12' : 'p-6 lg:p-8'
      }`}
    >
      {/* Glow decorative backlight */}
      <div className="absolute top-0 right-1/4 -z-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -z-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Call state announcement banner */}
      {callState && callState !== 'NORMAL' && (
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="mb-4 py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white font-display font-bold text-center tracking-wider text-sm sm:text-base uppercase shadow-lg"
        >
          🚨 {callState.replace('_', ' ')}! FINAL CALL! 🚨
        </motion.div>
      )}

      <div className={`grid gap-8 items-center ${isProjector ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 md:grid-cols-12'}`}>
        {/* Player Image Column */}
        <div className={`relative ${isProjector ? 'lg:col-span-4' : 'md:col-span-5'} flex flex-col items-center`}>
          <div className={`relative rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-glow-gold ${
            isProjector ? 'w-64 h-80 lg:w-72 lg:h-96' : 'w-52 h-64 sm:w-60 sm:h-72'
          }`}>
            <img
              src={player.photoUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400'}
              alt={player.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                // Fallback avatar if external image fails
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`;
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            
            {/* Status tag */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                {player.rollNumber}
              </span>
              <span className="font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                {player.year}
              </span>
            </div>
          </div>

          {/* Style pills below image */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
              🏏 {player.battingStyle || 'Right Handed'}
            </span>
            {player.bowlingStyle && player.bowlingStyle !== 'None' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                🎯 {player.bowlingStyle}
              </span>
            )}
          </div>
        </div>

        {/* Player Details & Live Bidding Counter */}
        <div className={`${isProjector ? 'lg:col-span-8' : 'md:col-span-7'} flex flex-col justify-between`}>
          <div>
            {/* Role & Year Header */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${roleTheme.bg} ${roleTheme.text} ${roleTheme.border}`}>
                {player.role.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                {player.branch}
              </span>
              {player.hostel && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-400">
                  🏠 {player.hostel}
                </span>
              )}
            </div>

            {/* Name */}
            <h2 className={`font-display font-bold uppercase tracking-tight text-white ${
              isProjector ? 'text-4xl lg:text-5xl mb-3' : 'text-3xl lg:text-4xl mb-2'
            }`}>
              {player.name}
            </h2>

            <div className="h-0.5 w-24 bg-gradient-to-r from-amber-500 to-transparent mb-6" />
          </div>

          {/* Pricing & Bidding Display Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
            {/* Base Price Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                BASE PRICE
              </span>
              <div className="font-display font-bold text-2xl sm:text-3xl text-slate-200">
                ₹{startingPrice}
              </div>
              <span className="text-[11px] text-slate-500 mt-1">Starting valuation</span>
            </div>

            {/* Current Live Bid Card */}
            <div className="relative bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-glow-gold overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                CURRENT BID
              </span>
              <motion.div
                key={currentPrice}
                initial={{ scale: 1.15, color: '#FCD34D' }}
                animate={{ scale: 1, color: '#F59E0B' }}
                transition={{ duration: 0.3 }}
                className={`font-display font-black tracking-tight ${
                  isProjector ? 'text-4xl sm:text-5xl lg:text-6xl text-amber-400' : 'text-3xl sm:text-4xl text-amber-400'
                }`}
              >
                ₹{currentPrice}
              </motion.div>
              <span className="text-[11px] text-amber-300/70 mt-1">Live competitive offer</span>
            </div>
          </div>

          {/* Leading Team Card */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  HIGHEST BIDDER / LEADING TEAM
                </span>
                <span className={`font-display font-bold text-white ${isProjector ? 'text-2xl' : 'text-lg sm:text-xl'}`}>
                  {highestBidderTeamName || 'NO BIDS YET'}
                </span>
              </div>
            </div>

            {highestBidderTeamName && (
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-bold animate-pulse">
                HOLDING BID
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
