import React, { useState } from 'react';
import { Download, FileText, Shield, Users } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { pdfService } from '../services/api';
import { SquadTable } from '../components/SquadTable';

export const AdminTeamsPage: React.FC = () => {
  const { teams, showToast } = useAuction();
  const [selectedTeamId, setSelectedTeamId] = useState<number>(teams[0]?.id || 1);

  const currentTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const handleDownloadTeamPdf = (teamId: number, teamName: string) => {
    try {
      pdfService.downloadTeamPdf(teamId, teamName);
      showToast(`Generating squad PDF for ${teamName}...`, 'info');
    } catch (e) {
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleDownloadReportPdf = () => {
    try {
      pdfService.downloadAuctionReportPdf();
      showToast('Generating official auction tournament report...', 'info');
    } catch (e) {
      showToast('Failed to download report', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-wide uppercase">
            FRANCHISE TEAMS & SQUADS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete roster breakdowns and official PDF certificates
          </p>
        </div>

        <button
          onClick={handleDownloadReportPdf}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-display font-bold text-xs tracking-wide shadow-glow-green flex items-center gap-2 transition-transform active:scale-95"
        >
          <FileText className="w-4 h-4" />
          DOWNLOAD TOURNAMENT REPORT PDF
        </button>
      </div>

      {/* Team Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTeamId(t.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedTeamId === t.id
                ? 'bg-amber-500/10 border-amber-500 shadow-glow-gold'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className={`w-4 h-4 ${selectedTeamId === t.id ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="font-display font-bold text-sm text-white truncate">
                {t.name}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Purse:</span>
              <span className="font-bold text-emerald-400">₹{t.currentPurse}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {t.playerCount} Players
            </div>
          </button>
        ))}
      </div>

      {/* Current Selected Team Squad Details */}
      {currentTeam && (
        <div className="space-y-6">
          {/* Team Snapshot Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h2 className="font-display font-black text-2xl text-white uppercase tracking-wide">
                  {currentTeam.name}
                </h2>
                <p className="text-xs text-slate-400">
                  Captain: <span className="text-white font-semibold">{currentTeam.captainName}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Purse</span>
                <span className="font-display font-bold text-lg text-emerald-400">
                  ₹{currentTeam.currentPurse} <span className="text-xs text-slate-600 font-sans">/ {currentTeam.initialPurse}</span>
                </span>
              </div>

              <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Spent</span>
                <span className="font-display font-bold text-lg text-amber-400">
                  ₹{currentTeam.totalSpent}
                </span>
              </div>

              <button
                onClick={() => handleDownloadTeamPdf(currentTeam.id, currentTeam.name)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-display font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-amber-400" />
                TEAM PDF
              </button>
            </div>
          </div>

          {/* Squad Roster Table */}
          <SquadTable
            players={currentTeam.players || []}
            teamName={currentTeam.name}
            totalPurse={currentTeam.initialPurse}
            remainingPurse={currentTeam.currentPurse}
          />
        </div>
      )}
    </div>
  );
};
