import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RotateCcw,
  SkipForward,
  Megaphone,
  AlertTriangle,
  History,
  Layers,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { auctionService, playerService } from '../services/api';
import { AuctionPlayerCard } from '../components/AuctionPlayerCard';
import { TeamPurseCard } from '../components/TeamPurseCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { Player } from '../types';

export const AdminAuctionControlPage: React.FC = () => {
  const { auctionState, teams, refreshState, showToast } = useAuction();
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [customBasePrice, setCustomBasePrice] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [unsoldModalOpen, setUnsoldModalOpen] = useState(false);
  const [undoModalOpen, setUndoModalOpen] = useState(false);

  const activeAuction = auctionState?.status === 'ACTIVE' || auctionState?.status === 'PAUSED';
  const currentAuctionId = auctionState?.auctionId;

  // Load available players for starting next auction using strict round eligibility
  const loadEligiblePlayers = async (targetRound?: number) => {
    try {
      const round = targetRound !== undefined ? targetRound : (auctionState?.roundNumber || 1);
      const players = await auctionService.getEligiblePlayers(round);
      setAvailablePlayers(players);
      if (players.length > 0) {
        const exists = players.some((p) => String(p.id) === selectedPlayerId);
        if (!exists) {
          setSelectedPlayerId(String(players[0].id));
          setCustomBasePrice(String(players[0].basePrice));
        }
      } else {
        setSelectedPlayerId('');
        setCustomBasePrice('');
      }
    } catch (e) {
      console.error('Failed to load eligible players', e);
    }
  };

  useEffect(() => {
    loadEligiblePlayers(auctionState?.roundNumber);
  }, [auctionState?.roundNumber, auctionState?.status]);

  const handleStartAuction = async () => {
    if (!selectedPlayerId) {
      showToast('Please select a player to auction', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const price = customBasePrice ? parseInt(customBasePrice) : undefined;
      await auctionService.start(parseInt(selectedPlayerId), price);
      showToast('Auction started successfully!', 'success');
      loadEligiblePlayers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to start auction';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePauseResume = async () => {
    if (!currentAuctionId) return;
    try {
      if (auctionState.status === 'ACTIVE') {
        await auctionService.pause(currentAuctionId);
        showToast('Auction paused', 'info');
      } else {
        await auctionService.resume(currentAuctionId);
        showToast('Auction resumed', 'info');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update auction state', 'error');
    }
  };

  const handleSetCallState = async (state: 'GOING_ONCE' | 'GOING_TWICE' | 'NORMAL') => {
    if (!currentAuctionId) return;
    try {
      await auctionService.setCallState(currentAuctionId, state);
      showToast(`Call updated to ${state.replace('_', ' ')}!`, 'info');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update call state', 'error');
    }
  };

  const handleConfirmSold = async () => {
    if (!currentAuctionId) return;
    setSoldModalOpen(false);
    try {
      await auctionService.sold(currentAuctionId);
      showToast('Player SOLD!', 'success');
      await refreshState();
      await loadEligiblePlayers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to complete sale', 'error');
    }
  };

  const handleConfirmUnsold = async () => {
    if (!currentAuctionId) return;
    setUnsoldModalOpen(false);
    try {
      await auctionService.unsold(currentAuctionId);
      showToast('Player marked as UNSOLD', 'info');
      await refreshState();
      await loadEligiblePlayers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to mark unsold', 'error');
    }
  };

  const handleConfirmUndo = async () => {
    setUndoModalOpen(false);
    try {
      await auctionService.undo();
      showToast('Sale reversed! Points refunded and squad updated.', 'success');
      await refreshState();
      await loadEligiblePlayers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to undo sale', 'error');
    }
  };

  const handleAutoNextPlayer = async () => {
    try {
      const next = await auctionService.getNextPlayer(auctionState?.roundNumber || 1);
      if (!next) {
        showToast('No more eligible players in this round!', 'info');
        return;
      }
      setSelectedPlayerId(String(next.id));
      setCustomBasePrice(String(next.basePrice));
      showToast(`Loaded ${next.name}`, 'info');
    } catch (e) {
      showToast('Failed to fetch next player', 'error');
    }
  };

  const handleChangeRound = async (roundNum: number) => {
    try {
      await auctionService.setRound(roundNum);
      showToast(`Switched to Round ${roundNum}`, 'success');
      await refreshState();
      await loadEligiblePlayers(roundNum);
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to switch round', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Round Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">AUCTION ROUND CONTROL</h3>
            <p className="text-xs text-slate-400">Manage tournament auction stages</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((r) => (
            <button
              key={r}
              onClick={() => handleChangeRound(r)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                auctionState?.roundNumber === r
                  ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              ROUND {r} {r === 1 ? '(All)' : '(Unsold Only)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Auction Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center: Player Card & Live Bids */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative">
            <AuctionPlayerCard
              player={auctionState?.player || null}
              currentPrice={auctionState?.currentPrice || 0}
              startingPrice={auctionState?.startingPrice || 0}
              highestBidderTeamName={auctionState?.highestBidderTeamName}
              callState={auctionState?.callState}
            />

            {/* Stage status indicator on top right */}
            {activeAuction && (
              <div className="absolute top-6 right-6 z-10">
                <span className="px-3.5 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 font-display font-bold text-xs rounded-full flex items-center gap-2 backdrop-blur-md shadow-glow-red">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  LIVE STAGE
                </span>
              </div>
            )}
          </div>

          {/* Admin Live Action Console */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              ADMIN LIVE STAGE CONTROLS
            </h3>

            {/* If auction is ACTIVE */}
            {activeAuction ? (
              <div className="space-y-4">
                {/* Stage 1: Calls (Going Once, Going Twice) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSetCallState('GOING_ONCE')}
                    className={`py-3 px-4 rounded-xl font-display font-bold text-sm tracking-wide transition-all ${
                      auctionState?.callState === 'GOING_ONCE'
                        ? 'bg-amber-600 text-white shadow-glow-gold'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    📢 GOING ONCE
                  </button>

                  <button
                    onClick={() => handleSetCallState('GOING_TWICE')}
                    className={`py-3 px-4 rounded-xl font-display font-bold text-sm tracking-wide transition-all ${
                      auctionState?.callState === 'GOING_TWICE'
                        ? 'bg-rose-600 text-white shadow-glow-red'
                        : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    🚨 GOING TWICE
                  </button>

                  <button
                    onClick={handlePauseResume}
                    className="py-3 px-4 rounded-xl font-display font-bold text-sm tracking-wide bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    {auctionState?.status === 'ACTIVE' ? (
                      <>
                        <Pause className="w-4 h-4 text-amber-400" /> PAUSE AUCTION
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-emerald-400" /> RESUME AUCTION
                      </>
                    )}
                  </button>
                </div>

                {/* Stage 2: Final Verdicts (SOLD, UNSOLD) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setSoldModalOpen(true)}
                    disabled={!auctionState?.highestBidderTeamId}
                    className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-display font-black text-xl tracking-wide shadow-glow-green flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-6 h-6" />
                    SOLD TO {auctionState?.highestBidderTeamName || 'TEAM'} (₹{auctionState?.currentPrice})
                  </button>

                  <button
                    onClick={() => setUnsoldModalOpen(true)}
                    className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 font-display font-bold text-lg tracking-wide flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-rose-400" />
                    DECLARE UNSOLD
                  </button>
                </div>
              </div>
            ) : (
              /* If auction is IDLE: Start Next Player */
              <div className="space-y-4">
                {availablePlayers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-sm mb-0.5">ROUND {auctionState?.roundNumber || 1} POOL COMPLETED</span>
                      <span>
                        {(auctionState?.roundNumber || 1) < 3
                          ? `All eligible players for Round ${auctionState?.roundNumber || 1} have appeared! Advance to Round ${(auctionState?.roundNumber || 1) + 1} to auction unsold players.`
                          : 'Tournament auction completed! Check final squads in Analytics.'}
                      </span>
                    </div>
                    {(auctionState?.roundNumber || 1) < 3 && (
                      <button
                        onClick={() => handleChangeRound((auctionState?.roundNumber || 1) + 1)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-display text-xs tracking-wide shadow-glow-gold whitespace-nowrap ml-4"
                      >
                        ADVANCE TO ROUND {(auctionState?.roundNumber || 1) + 1} →
                      </button>
                    )}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase text-slate-400">
                        Select Next Player
                      </label>
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {availablePlayers.length} unauctioned in Round {auctionState?.roundNumber || 1}
                      </span>
                    </div>
                    <select
                      value={selectedPlayerId}
                      onChange={(e) => {
                        setSelectedPlayerId(e.target.value);
                        const found = availablePlayers.find((p) => String(p.id) === e.target.value);
                        if (found) setCustomBasePrice(String(found.basePrice));
                      }}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                    >
                      {availablePlayers.length === 0 && (
                        <option value="">No unauctioned players left in Round {auctionState?.roundNumber || 1}</option>
                      )}
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.role.replace('_', ' ')} • {p.year} • Base: ₹{p.basePrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Starting Price (₹)
                    </label>
                    <input
                      type="number"
                      value={customBasePrice}
                      onChange={(e) => setCustomBasePrice(e.target.value)}
                      placeholder="Base price"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAutoNextPlayer}
                      className="w-full py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-1 transition-colors"
                      title="Auto select next in pool"
                    >
                      <SkipForward className="w-4 h-4" /> Next
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleStartAuction}
                    disabled={submitting || !selectedPlayerId}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-black text-lg tracking-wide shadow-glow-gold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-40"
                  >
                    <Play className="w-5 h-5 fill-slate-950" />
                    {submitting ? 'STARTING...' : 'START AUCTION FOR THIS PLAYER'}
                  </button>

                  <button
                    onClick={() => setUndoModalOpen(true)}
                    className="px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-display font-semibold text-sm flex items-center gap-2 transition-colors"
                    title="Undo the last confirmed sale"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    UNDO LAST SALE
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bid Stream Feed for current auction */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              LIVE BID HISTORY ({auctionState?.recentBids?.length || 0} BIDS)
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {auctionState?.recentBids && auctionState.recentBids.length > 0 ? (
                auctionState.recentBids.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500">#{auctionState.recentBids!.length - idx}</span>
                      <span className="font-bold text-white text-sm">{b.teamName}</span>
                    </div>
                    <div className="font-display font-bold text-base text-amber-400">
                      ₹{b.amount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No bids placed for current player yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 6 Franchise Purses in Real-Time */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-display font-bold text-lg text-white tracking-wide">
              FRANCHISE PURSES
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              UPDATES AT SOLD
            </span>
          </div>

          <div className="space-y-3">
            {teams.map((t) => (
              <TeamPurseCard
                key={t.id}
                team={t}
                isLeading={auctionState?.highestBidderTeamId === t.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={soldModalOpen}
        title="CONFIRM PLAYER SALE"
        message={`Are you sure you want to sell ${auctionState?.player?.name} to ${auctionState?.highestBidderTeamName} for ₹${auctionState?.currentPrice}? This will immediately deduct points from their purse and permanently add the player to their roster.`}
        confirmLabel="CONFIRM SOLD"
        variant="primary"
        onConfirm={handleConfirmSold}
        onCancel={() => setSoldModalOpen(false)}
      />

      <ConfirmModal
        isOpen={unsoldModalOpen}
        title="CONFIRM MARK UNSOLD"
        message={`Mark ${auctionState?.player?.name} as UNSOLD? No purse points will be deducted. The player will be eligible to return in Round 2 or Round 3.`}
        confirmLabel="MARK UNSOLD"
        variant="danger"
        onConfirm={handleConfirmUnsold}
        onCancel={() => setUnsoldModalOpen(false)}
      />

      <ConfirmModal
        isOpen={undoModalOpen}
        title="REVERSE LAST SALE"
        message="Are you sure you want to undo the last player sale? The winning team will be refunded their points, and the player will be removed from their squad and made available again."
        confirmLabel="YES, UNDO SALE"
        variant="warning"
        onConfirm={handleConfirmUndo}
        onCancel={() => setUndoModalOpen(false)}
      />
    </div>
  );
};
