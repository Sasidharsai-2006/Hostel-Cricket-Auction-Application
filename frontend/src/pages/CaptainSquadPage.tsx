import React from 'react';
import { Download, Shield, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';
import { SquadTable } from '../components/SquadTable';
import { pdfService } from '../services/api';

export const CaptainSquadPage: React.FC = () => {
  const { user } = useAuth();
  const { teams, showToast } = useAuction();

  const myTeamId = user?.teamId;
  const myTeam = teams.find((t) => t.id === myTeamId);

  const handleDownloadPdf = () => {
    if (!myTeam) return;
    try {
      pdfService.downloadTeamPdf(myTeam.id, myTeam.name);
      showToast('Downloading team squad PDF...', 'info');
    } catch (e) {
      showToast('Failed to download PDF', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="p-6 lg:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="font-display font-black text-3xl text-white uppercase tracking-wide">
              {myTeam?.name || 'MY SQUAD'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Captain: <span className="text-white font-semibold">{user?.displayName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs tracking-wide shadow-glow-gold flex items-center gap-2 transition-transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          DOWNLOAD OFFICIAL SQUAD PDF
        </button>
      </div>

      <SquadTable
        players={myTeam?.players || []}
        teamName={myTeam?.name}
        totalPurse={myTeam?.initialPurse || 1000}
        remainingPurse={myTeam?.currentPurse || 1000}
      />
    </div>
  );
};
