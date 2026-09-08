import React, { useState } from 'react';
import { Player } from '../types';
import { Search, Trophy } from 'lucide-react';

interface SquadTableProps {
  players: Player[];
  teamName?: string;
  totalPurse?: number;
  remainingPurse?: number;
}

export const SquadTable: React.FC<SquadTableProps> = ({
  players,
  teamName,
  totalPurse = 1000,
  remainingPurse = 1000,
}) => {
  const [search, setSearch] = useState('');

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase()) ||
    p.year.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = players.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

  const roleBadges: Record<string, string> = {
    BATSMAN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    BOWLER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ALL_ROUNDER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    WICKET_KEEPER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Header & Search */}
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-xl text-white tracking-wide flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {teamName ? `${teamName} SQUAD` : 'PURCHASED SQUAD'}
            <span className="text-xs font-sans font-semibold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
              {players.length} Players
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Official roster registered for this tournament
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search squad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th className="py-3.5 px-4">Player</th>
              <th className="py-3.5 px-4">Roll No</th>
              <th className="py-3.5 px-4">Year</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Style</th>
              <th className="py-3.5 px-4 text-right">Bought Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((player, idx) => (
              <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={player.photoUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400'}
                      alt={player.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`;
                      }}
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{player.name}</div>
                      <div className="text-[11px] text-slate-400">{player.branch}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">{player.rollNumber}</td>
                <td className="py-3 px-4 text-slate-300 font-medium">{player.year}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadges[player.role] || 'bg-slate-800 text-slate-300'}`}>
                    {player.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">
                  {player.battingStyle}
                  {player.bowlingStyle && player.bowlingStyle !== 'None' ? ` • ${player.bowlingStyle}` : ''}
                </td>
                <td className="py-3 px-4 text-right font-display font-bold text-base text-amber-400">
                  ₹{player.soldPrice || '-'}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  {players.length === 0
                    ? 'No players bought yet. Bid during the live auction to build your squad!'
                    : 'No players match your search filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Totals */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="text-slate-400">
            Total Squad: <span className="font-bold text-white ml-1">{players.length} Players</span>
          </div>
          <div className="text-slate-400">
            Total Spent: <span className="font-bold text-amber-400 ml-1">₹{totalSpent}</span>
          </div>
        </div>

        <div className="text-slate-400">
          Remaining Purse: <span className="font-bold text-emerald-400 text-sm ml-1">₹{remainingPurse}</span>
          <span className="text-slate-600 ml-1">/ ₹{totalPurse}</span>
        </div>
      </div>
    </div>
  );
};
