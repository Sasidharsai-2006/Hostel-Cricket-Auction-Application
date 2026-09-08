import React, { useState, useEffect } from 'react';
import { Search, Plus, Upload, Edit2, Check, X, Shield, Filter, RotateCcw, AlertTriangle } from 'lucide-react';
import { playerService, auctionService } from '../services/api';
import { Player, PlayerRole, PlayerStatus } from '../types';
import { CsvImportModal } from '../components/CsvImportModal';
import { useAuction } from '../context/AuctionContext';

export const AdminPlayersPage: React.FC = () => {
  const { showToast } = useAuction();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Editing Base Price state
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [newBasePrice, setNewBasePrice] = useState<string>('');

  // New Player form state
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    rollNumber: '',
    year: '2nd Year',
    role: 'BATSMAN' as PlayerRole,
    basePrice: 15,
  });

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await playerService.getPlayers({
        role: roleFilter ? (roleFilter as PlayerRole) : undefined,
        year: yearFilter || undefined,
        status: statusFilter ? (statusFilter as PlayerStatus) : undefined,
        search: search || undefined,
      });
      setPlayers(data);
    } catch (e) {
      console.error('Failed to load players', e);
      showToast('Failed to load players list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [roleFilter, yearFilter, statusFilter, search]);

  const handleSaveBasePrice = async (playerId: number) => {
    const parsed = parseInt(newBasePrice);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Base price must be greater than 0', 'error');
      return;
    }

    try {
      await playerService.updateBasePrice(playerId, parsed);
      showToast('Base price updated successfully', 'success');
      setEditingPlayerId(null);
      loadPlayers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update base price', 'error');
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await playerService.createPlayer(newPlayer);
      showToast(`Added player ${newPlayer.name}`, 'success');
      setAddModalOpen(false);
      setNewPlayer({
        name: '',
        rollNumber: '',
        year: '1st Year',
        role: 'BATSMAN',
        basePrice: 50,
      });
      loadPlayers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create player', 'error');
    }
  };

  const roleColors: Record<string, string> = {
    BATSMAN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    BOWLER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ALL_ROUNDER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    WICKET_KEEPER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-slate-800 text-slate-300 border-slate-700',
    IN_AUCTION: 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse',
    SOLD: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold',
    UNSOLD: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-wide uppercase">
            PLAYER MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered participants pool ({players.length} total players shown)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-display font-semibold text-xs tracking-wide flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" /> RESET TOURNAMENT
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs tracking-wide shadow-glow-gold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> ADD PLAYER
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-display font-semibold text-xs tracking-wide flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-amber-400" /> IMPORT CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-lg">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Year Filter */}
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All Roles</option>
          <option value="BATSMAN">Batsman</option>
          <option value="BOWLER">Bowler</option>
          <option value="ALL_ROUNDER">All Rounder</option>
          <option value="WICKET_KEEPER">Wicket Keeper</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="IN_AUCTION">In Auction</option>
          <option value="SOLD">Sold</option>
          <option value="UNSOLD">Unsold</option>
        </select>
      </div>

      {/* Players Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Roll No</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Base Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-4 text-right">Sold Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-display font-black text-xs text-amber-400 shrink-0">
                        {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="font-bold text-white text-sm">{player.name}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{player.rollNumber}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">{player.year}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[player.role] || 'bg-slate-800'}`}>
                      {player.role.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Base Price Column with Quick Edit */}
                  <td className="py-3.5 px-4 text-center">
                    {editingPlayerId === player.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={newBasePrice}
                          onChange={(e) => setNewBasePrice(e.target.value)}
                          className="w-16 px-1.5 py-1 bg-slate-950 border border-amber-500 rounded text-xs text-white text-center"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveBasePrice(player.id)}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingPlayerId(null)}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-display font-bold text-sm text-slate-200">
                          ₹{player.basePrice}
                        </span>
                        {player.status !== 'SOLD' && player.status !== 'IN_AUCTION' && (
                          <button
                            onClick={() => {
                              setEditingPlayerId(player.id);
                              setNewBasePrice(String(player.basePrice));
                            }}
                            className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                            title="Edit Base Price"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[player.status] || 'bg-slate-800'}`}>
                      {player.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Team */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {player.teamName || <span className="text-slate-500">-</span>}
                  </td>

                  {/* Sold Price */}
                  <td className="py-3.5 px-4 text-right font-display font-bold text-sm text-amber-400">
                    {player.soldPrice ? `₹${player.soldPrice}` : <span className="text-slate-500">-</span>}
                  </td>
                </tr>
              ))}

              {players.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No participants found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Player Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" /> ADD NEW PLAYER
            </h3>

            <form onSubmit={handleCreatePlayer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.rollNumber}
                    onChange={(e) => setNewPlayer({ ...newPlayer, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Year</label>
                  <select
                    value={newPlayer.year}
                    onChange={(e) => {
                      const yr = e.target.value;
                      const bp = yr === '2nd Year' ? 15 : 20;
                      setNewPlayer({ ...newPlayer, year: yr, basePrice: bp });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="2nd Year">2nd Year (Base: ₹15)</option>
                    <option value="3rd Year">3rd Year (Base: ₹20)</option>
                    <option value="4th Year">4th Year (Base: ₹20)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Player Style</label>
                  <select
                    value={newPlayer.role}
                    onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value as PlayerRole })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="BATSMAN">Batsman</option>
                    <option value="BOWLER">Bowler</option>
                    <option value="ALL_ROUNDER">All Rounder</option>
                    <option value="WICKET_KEEPER">Wicket Keeper</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Base Price (₹)</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={newPlayer.basePrice}
                  onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-glow-gold"
                >
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Tournament Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">RESET TOURNAMENT</h3>
                <p className="text-xs text-slate-400">Restore all teams & round to beginning</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              This will refund all 6 teams' purse balances back to <strong>1000 points</strong>, clear previous bids/sales, and reset the tournament to <strong>Round 1</strong>.
            </p>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    await auctionService.resetTournament(false);
                    showToast('Tournament reset to Round 1 (purses restored to 1000 pts)!', 'success');
                    setResetModalOpen(false);
                    loadPlayers();
                  } catch (e: any) {
                    showToast(e.response?.data?.message || 'Failed to reset tournament', 'error');
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs tracking-wide shadow-glow-gold transition-colors"
              >
                RESET AUCTION & PURSES (KEEP PLAYERS)
              </button>

              <button
                onClick={async () => {
                  try {
                    await auctionService.resetTournament(true);
                    showToast('Tournament completely wiped! Ready for fresh CSV import.', 'success');
                    setResetModalOpen(false);
                    loadPlayers();
                  } catch (e: any) {
                    showToast(e.response?.data?.message || 'Failed to reset tournament', 'error');
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-display font-bold text-xs tracking-wide transition-colors"
              >
                WIPE EVERYTHING (DELETE PLAYERS & PURSES)
              </button>

              <button
                onClick={() => setResetModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadPlayers}
      />
    </div>
  );
};
