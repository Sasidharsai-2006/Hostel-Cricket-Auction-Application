import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Shield, KeyRound, User as UserIcon, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useAuction();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (u = username, p = password) => {
    if (!u.trim() || !p.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(u, p);
      showToast(`Welcome, ${user.displayName}!`, 'success');
      if (user.userType === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/captain');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid username or password';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickCredentials = [
    { label: 'Admin', u: 'admin', p: 'Admin@123', color: 'border-amber-500/40 text-amber-400' },
    { label: 'Captain 1 (Tigers)', u: 'captain1', p: 'Captain@101', color: 'border-blue-500/40 text-blue-400' },
    { label: 'Captain 2 (Lions)', u: 'captain2', p: 'Captain@102', color: 'border-emerald-500/40 text-emerald-400' },
    { label: 'Captain 3 (Warriors)', u: 'captain3', p: 'Captain@103', color: 'border-purple-500/40 text-purple-400' },
    { label: 'Captain 4 (Kings)', u: 'captain4', p: 'Captain@104', color: 'border-yellow-500/40 text-yellow-400' },
    { label: 'Captain 5 (Strikers)', u: 'captain5', p: 'Captain@105', color: 'border-rose-500/40 text-rose-400' },
    { label: 'Captain 6 (Challengers)', u: 'captain6', p: 'Captain@106', color: 'border-cyan-500/40 text-cyan-400' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090D16] relative overflow-hidden">
      {/* Glow decorative backlight */}
      <div className="absolute top-1/4 left-1/3 -z-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-glow-gold mx-auto mb-4">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <h1 className="font-display font-black text-2xl tracking-wide text-white uppercase">
              HOSTEL CRICKET AUCTION
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Official Player Auction Portal
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="admin or captain1...captain6"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Enter assigned password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-bold text-base tracking-wide transition-all shadow-glow-gold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'ENTER AUCTION PORTAL'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Login Chips for Live Demo & Event Access */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5 text-center">
              Event Quick Access (1-Click Login)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {quickCredentials.map((c) => (
                <button
                  key={c.u}
                  type="button"
                  onClick={() => {
                    setUsername(c.u);
                    setPassword(c.p);
                    handleLogin(c.u, c.p);
                  }}
                  className={`p-2 rounded-xl bg-slate-950/80 border hover:bg-slate-800 text-left text-[11px] font-semibold transition-colors flex items-center justify-between ${c.color}`}
                >
                  <span className="truncate">{c.label}</span>
                  <ArrowRight className="w-3 h-3 opacity-60 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
