import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Wallet, Users, FileDown, Trophy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';
import { AuctionPlayerCard } from '../components/AuctionPlayerCard';
import { BidControls } from '../components/BidControls';
import { SquadTable } from '../components/SquadTable';
import { pdfService } from '../services/api';

export const CaptainDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { auctionState, teams, showToast } = useAuction();

  const myTeamId = user?.teamId;
  const myTeam = teams.find((t) => t.id === myTeamId);

  const initialPurse = myTeam?.initialPurse || 1000;
  const currentPurse = myTeam?.currentPurse || 1000;
  const totalSpent = myTeam?.totalSpent || 0;
  const squad = myTeam?.players || [];

  const isAuctionActive = auctionState?.status === 'ACTIVE';
  const isMyTeamLeading = auctionState?.highestBidderTeamId === myTeamId;

  const handleDownloadPdf = () => {
    if (!myTeam) return;
    try {
      pdfService.downloadTeamPdf(myTeam.id, myTeam.name);
      showToast('Downloading your official team squad PDF...', 'info');
    } catch (e) {
      showToast('Failed to download PDF', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Captain Header & Stats Banner */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-glow-gold shrink-0">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                CAPTAIN CONSOLE
              </span>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide uppercase">
                {myTeam?.name || 'TEAM FRANCHISE'}
              </h1>
              <p className="text-xs text-slate-400">
                Captain: <span className="text-white font-semibold">{user?.displayName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-display font-bold text-xs tracking-wide flex items-center gap-2 transition-colors self-start md:self-auto"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            DOWNLOAD SQUAD PDF
          </button>
        </div>

        {/* Animated Purse & Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Animated Purse Card */}
          <motion.div
            key={currentPurse}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-950/70 border border-amber-500/30 p-4 rounded-2xl shadow-glow-gold"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5" /> CURRENT PURSE
            </div>
            <div className="font-display font-black text-3xl text-emerald-400">
              ₹{currentPurse}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Starting ₹{initialPurse}</div>
          </motion.div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> TOTAL SPENT
            </div>
            <div className="font-display font-black text-3xl text-amber-400">
              ₹{totalSpent}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">On player purchases</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" /> PLAYERS BOUGHT
            </div>
            <div className="font-display font-black text-3xl text-white">
              {squad.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">In your franchise</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> BIDDING STATUS
            </div>
            <div className="font-display font-bold text-lg text-white truncate">
              {isMyTeamLeading ? (
                <span className="text-emerald-400">LEADING BID!</span>
              ) : isAuctionActive ? (
                <span className="text-amber-400">ACTIVE BIDDING</span>
              ) : (
                <span className="text-slate-500">STAGE IDLE</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Real-time sync</div>
          </div>
        </div>
      </div>

      {/* Main Live Bidding Stage */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            LIVE PLAYER AUCTION
          </h2>
          <div className="flex items-center gap-3">
            {isAuctionActive && (
              <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-display font-bold text-xs rounded-full flex items-center gap-2 shadow-glow-green">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                BIDDING ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Spotlight Player Card */}
        <AuctionPlayerCard
          player={auctionState?.player || null}
          currentPrice={auctionState?.currentPrice || 0}
          startingPrice={auctionState?.startingPrice || 0}
          highestBidderTeamName={auctionState?.highestBidderTeamName}
          callState={auctionState?.callState}
        />

        {/* Large Tactile Bidding Controls */}
        <BidControls
          currentPrice={auctionState?.currentPrice || 0}
          highestBidderTeamId={auctionState?.highestBidderTeamId}
          isActive={isAuctionActive}
        />
      </div>

      {/* Team Squad Roster */}
      <div className="pt-4">
        <SquadTable
          players={squad}
          teamName={myTeam?.name}
          totalPurse={initialPurse}
          remainingPurse={currentPurse}
        />
      </div>
    </div>
  );
};
