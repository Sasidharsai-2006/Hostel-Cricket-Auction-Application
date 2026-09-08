import React from 'react';
import { motion } from 'framer-motion';
import { Team } from '../types';
import { Shield, Users, Wallet } from 'lucide-react';

interface TeamPurseCardProps {
  team: Team;
  isLeading?: boolean;
  highlight?: boolean;
}

export const TeamPurseCard: React.FC<TeamPurseCardProps> = ({ team, isLeading, highlight }) => {
  const percentLeft = Math.max(0, Math.min(100, Math.round((team.currentPurse / team.initialPurse) * 100)));

  return (
    <motion.div
      layout
      animate={
        isLeading
          ? { scale: [1, 1.02, 1], borderColor: '#F59E0B' }
          : { scale: 1, borderColor: highlight ? '#3B82F6' : '#374151' }
      }
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl p-4 border bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-sm shadow-lg overflow-hidden transition-all ${
        isLeading
          ? 'border-amber-500 shadow-glow-gold bg-amber-950/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {isLeading && (
        <div className="absolute top-2 right-2 text-[9px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded uppercase tracking-wider">
          LEADING
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-7 h-7 object-contain" />
          ) : (
            <Shield className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-display font-bold text-base text-white truncate tracking-wide">
            {team.name}
          </h4>
          <p className="text-xs text-slate-400 truncate">{team.captainName}</p>
        </div>
      </div>

      {/* Purse & Progress */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Wallet className="w-3 h-3 text-amber-400" /> PURSE
          </span>
          <div className="font-display font-bold text-lg text-emerald-400">
            ₹{team.currentPurse}
            <span className="text-xs text-slate-500 font-sans ml-1">/ {team.initialPurse}</span>
          </div>
        </div>

        {/* Balance bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentLeft}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${
              percentLeft > 50
                ? 'bg-emerald-500'
                : percentLeft > 20
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
        </div>

        {/* Stats Row */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Players:</span>
            <span className="font-bold text-slate-200">{team.playerCount}</span>
          </div>
          <div className="text-slate-400">
            <span>Spent:</span> <span className="font-bold text-amber-400">₹{team.totalSpent}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
