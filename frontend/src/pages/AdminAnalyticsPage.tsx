import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Users, Wallet, Star, FileText } from 'lucide-react';
import { auctionService, pdfService } from '../services/api';
import { AuctionReport } from '../types';
import { useAuction } from '../context/AuctionContext';

export const AdminAnalyticsPage: React.FC = () => {
  const { showToast } = useAuction();
  const [report, setReport] = useState<AuctionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await auctionService.getAnalytics();
        setReport(data);
      } catch (e) {
        console.error('Failed to load analytics', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleDownloadReport = () => {
    try {
      pdfService.downloadAuctionReportPdf();
      showToast('Generating official report PDF...', 'info');
    } catch (e) {
      showToast('Failed to download report', 'error');
    }
  };

  if (!report && !loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        No analytics data available currently.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-wide uppercase">
            AUCTION ANALYTICS & INSIGHTS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Financial performance, bidding trends, and franchise spending distribution
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-display font-bold text-xs tracking-wide shadow-glow-gold flex items-center gap-2 transition-transform active:scale-95"
        >
          <FileText className="w-4 h-4" />
          DOWNLOAD FULL AUCTION REPORT PDF
        </button>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" /> TOTAL PLAYERS
          </div>
          <div className="font-display font-bold text-3xl text-white">
            {report?.totalPlayers || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sold: <span className="text-emerald-400 font-bold">{report?.soldPlayers}</span> • Unsold: <span className="text-rose-400 font-bold">{report?.unsoldPlayers}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-amber-400" /> TOTAL POINTS SPENT
          </div>
          <div className="font-display font-bold text-3xl text-amber-400">
            ₹{report?.totalPointsSpent || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across 6 franchises
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" /> AVERAGE PLAYER PRICE
          </div>
          <div className="font-display font-bold text-3xl text-blue-400">
            ₹{report?.averagePlayerPrice || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Per sold player
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-purple-400" /> HIGHEST PURCHASE
          </div>
          <div className="font-display font-bold text-3xl text-purple-400">
            ₹{report?.highestPlayerPrice || 0}
          </div>
          <div className="text-[11px] text-slate-300 truncate mt-1">
            {report?.highestPurchasedPlayer ? `${report.highestPurchasedPlayer.name} (${report.highestPurchasedPlayer.teamName})` : 'No purchases yet'}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Buys & Team Spendings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top 5 Purchases */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> TOP 5 HIGHEST PURCHASES
          </h3>

          <div className="space-y-3">
            {report?.topPurchases && report.topPurchases.length > 0 ? (
              report.topPurchases.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <img
                      src={player.photoUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400'}
                      alt={player.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{player.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {player.teamName} • {player.role}
                      </div>
                    </div>
                  </div>
                  <div className="font-display font-black text-lg text-amber-400">
                    ₹{player.soldPrice}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                No purchases recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Team Financial Standing */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" /> FRANCHISE FINANCIAL STANDING
          </h3>

          <div className="space-y-3">
            {report?.teams?.map((team) => (
              <div
                key={team.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-white">{team.name}</span>
                  <div className="font-display font-bold text-emerald-400 text-sm">
                    ₹{team.currentPurse} <span className="text-slate-500 font-sans font-normal text-xs">left</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, (team.totalSpent / team.initialPurse) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Spent: <strong className="text-white">₹{team.totalSpent}</strong></span>
                  <span>Squad Size: <strong className="text-white">{team.playerCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
