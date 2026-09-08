import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Upload, FileDown, Trophy, Users, Shield, Wallet, Sparkles } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { TeamPurseCard } from '../components/TeamPurseCard';
import { CsvImportModal } from '../components/CsvImportModal';
import { pdfService } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const { teams, auctionState, refreshState, showToast } = useAuction();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const totalPointsSpent = teams.reduce((acc, t) => acc + t.totalSpent, 0);
  const totalPurchasedPlayers = teams.reduce((acc, t) => acc + t.playerCount, 0);

  const isAuctionLive = auctionState?.status === 'ACTIVE' || auctionState?.status === 'PAUSED';

  const handleDownloadFullReport = () => {
    try {
      pdfService.downloadAuctionReportPdf();
      showToast('Downloading complete auction report PDF...', 'info');
    } catch (e) {
      showToast('Failed to trigger PDF download', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> OFFICIAL EVENT COMMAND CENTER
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide uppercase">
              Hostel Cricket Auction 2026
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Real-time administrative control panel for 6 competing hostel franchises. Monitor team balances, execute player sales, and govern rounds.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/auction"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-bold text-sm tracking-wide shadow-glow-gold flex items-center gap-2 transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              {isAuctionLive ? 'GO TO ACTIVE AUCTION' : 'LAUNCH AUCTION ROOM'}
            </Link>

            <button
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-display font-semibold text-xs tracking-wide flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              IMPORT CSV PLAYERS
            </button>

            <button
              onClick={handleDownloadFullReport}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-display font-semibold text-xs tracking-wide flex items-center gap-2 transition-colors"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              FULL REPORT PDF
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" /> TEAMS
          </div>
          <div className="font-display font-bold text-3xl text-white">6</div>
          <div className="text-[11px] text-slate-500 mt-1">1000 Initial Purse Each</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> PLAYERS SOLD
          </div>
          <div className="font-display font-bold text-3xl text-emerald-400">
            {totalPurchasedPlayers}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 6 squads</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" /> TOTAL POINTS SPENT
          </div>
          <div className="font-display font-bold text-3xl text-amber-400">
            ₹{totalPointsSpent}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Of 6,000 total tournament points</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" /> AUCTION STATUS
          </div>
          <div className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isAuctionLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            {auctionState?.status || 'IDLE'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAuctionLive ? `Player: ${auctionState?.player?.name}` : 'Waiting to start next player'}
          </div>
        </div>
      </div>

      {/* Six Teams Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
              FRANCHISE OVERVIEW
            </h2>
            <p className="text-xs text-slate-400">Live purses and squads across all 6 teams</p>
          </div>
          <Link
            to="/admin/teams"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Full Rosters →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => (
            <TeamPurseCard
              key={t.id}
              team={t}
              isLeading={auctionState?.highestBidderTeamId === t.id}
            />
          ))}
        </div>
      </div>

      <CsvImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={refreshState}
      />
    </div>
  );
};
