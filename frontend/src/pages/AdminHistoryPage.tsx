import React, { useState, useEffect } from 'react';
import { History, Shield, CheckCircle2, XCircle, Search, Clock } from 'lucide-react';
import { auctionService } from '../services/api';
import { AuctionState, AuditLog } from '../types';

export const AdminHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<AuctionState[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'auctions' | 'audit'>('auctions');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [histData, logs] = await Promise.all([
          auctionService.getHistory(),
          auctionService.getAuditLogs(),
        ]);
        setHistory(histData);
        setAuditLogs(logs);
      } catch (e) {
        console.error('Failed to load history', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredHistory = history.filter((h) =>
    h.player?.name.toLowerCase().includes(search.toLowerCase()) ||
    h.highestBidderTeamName?.toLowerCase().includes(search.toLowerCase()) ||
    h.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-wide uppercase">
            AUCTION HISTORY & AUDIT LOGS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete trace of all player rounds, bids, sales, and administrative decisions
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'auctions'
                ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Auction Rounds ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'auctions' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player or team name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Player</th>
                    <th className="py-3.5 px-4">Round</th>
                    <th className="py-3.5 px-4 text-center">Starting Price</th>
                    <th className="py-3.5 px-4 text-center">Final Price</th>
                    <th className="py-3.5 px-4">Winning Franchise</th>
                    <th className="py-3.5 px-4 text-center">Total Bids</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistory.map((item) => (
                    <tr key={item.auctionId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{item.player?.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.player?.role} • {item.player?.year}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">
                        Round {item.roundNumber || 1}
                      </td>
                      <td className="py-3.5 px-4 text-center font-display font-bold text-slate-400">
                        ₹{item.startingPrice}
                      </td>
                      <td className="py-3.5 px-4 text-center font-display font-bold text-sm text-amber-400">
                        ₹{item.currentPrice}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.highestBidderTeamName ? (
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            {item.highestBidderTeamName}
                          </span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                        {item.recentBids?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'SOLD' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> SOLD
                          </span>
                        ) : item.status === 'UNSOLD' ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 font-bold text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> UNSOLD
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                            {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredHistory.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No auction records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Logs Tab */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-40">Timestamp</th>
                  <th className="py-3.5 px-4 w-28">User</th>
                  <th className="py-3.5 px-4 w-36">Action</th>
                  <th className="py-3.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400">{log.username}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{log.description}</td>
                  </tr>
                ))}

                {auditLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
