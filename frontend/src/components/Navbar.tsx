import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';
import { LogOut, Radio, Tv, Shield, Trophy } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { connected, auctionState } = useAuction();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roundNum = auctionState?.roundNumber || 1;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <Link to={isAdmin ? "/admin" : "/captain"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-glow-gold">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="font-display tracking-wide font-bold text-lg text-white leading-none flex items-center gap-2">
                HOSTEL CRICKET AUCTION
                <span className="text-[10px] uppercase font-sans tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Inter-Hostel Championship 2026</p>
            </div>
          </Link>

          {/* Round Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            ROUND {roundNum}
          </div>
        </div>

        {/* Center / Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/admin'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/auction"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/admin/auction'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Auction Control
              </Link>
              <Link
                to="/admin/players"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/admin/players'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Players
              </Link>
              <Link
                to="/admin/teams"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/admin/teams'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Teams
              </Link>
              <Link
                to="/admin/history"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/admin/history'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                History
              </Link>
              <Link
                to="/admin/analytics"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/admin/analytics'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Analytics
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/captain"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/captain'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Auction
              </Link>
              <Link
                to="/captain/squad"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  location.pathname === '/captain/squad'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Squad
              </Link>
            </>
          )}
        </div>

        {/* Right side: Projector View, Connection status, User & Logout */}
        <div className="flex items-center gap-3">
          {/* Projector Mode Link */}
          <Link
            to="/live"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Projector / LED Screen Display"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Projector View</span>
          </Link>

          {/* WebSocket Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              connected
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/50 border-rose-500/30 text-rose-400'
            }`}
            title={connected ? 'Real-time WebSocket active' : 'Disconnected, reconnecting...'}
          >
            <Radio className={`w-3 h-3 ${connected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
            <span className="hidden sm:inline">{connected ? 'Live' : 'Connecting'}</span>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                {isAdmin ? <Shield className="w-3 h-3 text-amber-400" /> : null}
                {user?.displayName || user?.username}
              </div>
              <div className="text-[10px] text-amber-400/90 font-medium">
                {isAdmin ? 'ADMIN' : user?.teamName || 'CAPTAIN'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
