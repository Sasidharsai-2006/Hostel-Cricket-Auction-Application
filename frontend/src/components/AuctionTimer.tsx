import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

interface AuctionTimerProps {
  size?: 'normal' | 'large';
}

export const AuctionTimer: React.FC<AuctionTimerProps> = ({ size = 'normal' }) => {
  const { timer } = useAuction();
  const seconds = timer.remainingSeconds;
  const isUrgent = seconds <= 3 && seconds > 0;
  const isTimeUp = seconds === 0;

  const isLarge = size === 'large';

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={
          isUrgent
            ? { scale: [1, 1.08, 1], rotate: [0, -1, 1, 0] }
            : { scale: 1 }
        }
        transition={{ repeat: Infinity, duration: 0.6 }}
        className={`relative flex items-center justify-center rounded-2xl border font-display font-bold shadow-2xl transition-all ${
          isLarge ? 'w-28 h-28 text-5xl' : 'w-20 h-20 text-3xl'
        } ${
          isTimeUp
            ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-glow-red'
            : isUrgent
            ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-glow-gold animate-pulse'
            : 'bg-slate-900/90 border-slate-700 text-emerald-400 shadow-glow-green'
        }`}
      >
        <span>{seconds}s</span>
        <Clock className={`absolute top-2 right-2 text-slate-500/60 ${isLarge ? 'w-4 h-4' : 'w-3 h-3'}`} />
      </motion.div>
      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1.5">
        {timer.isRunning ? (isUrgent ? 'LAST CHANCE!' : 'AUCTION TIMER') : (isTimeUp ? "TIME'S UP" : 'TIMER PAUSED')}
      </span>
    </div>
  );
};
