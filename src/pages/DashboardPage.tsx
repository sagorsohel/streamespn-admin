import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import api from '../lib/api';
import { 
  Users, 
  Tv, 
  TrendingUp, 
  ShieldCheck, 
  Database, 
  Server, 
  RefreshCw, 
  Plus, 
  CheckCircle2,
  Zap
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const checkBackendAndUsers = async () => {
      try {
        const healthRes = await api.get('/../health');
        if (healthRes.status === 200) {
          setBackendStatus('online');
        }
      } catch (err) {
        setBackendStatus('offline');
      }

      try {
        const usersRes = await api.get('/users');
        if (usersRes.data?.success) {
          setUsersCount(usersRes.data.count || 1);
        }
      } catch (err) {
        setUsersCount(1); // fallback demo count
      }
    };

    checkBackendAndUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
              <Zap className="h-3.5 w-3.5" /> Welcome Back
            </div>
            <h1 className="text-2xl font-black text-white">{user?.name || 'System Admin'}</h1>
            <p className="text-xs text-slate-400">
              Logged in as <span className="text-slate-200 font-mono">{user?.email || 'N/A'}</span> • Role:{' '}
              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-300">
                {user?.role || 'ADMIN'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500">
              <Plus className="h-4 w-4" /> Add New Stream
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Users</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{usersCount !== null ? usersCount : '1'}</span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              <TrendingUp className="mr-1 h-3 w-3" /> +12%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Registered users in database</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Live Streams</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Tv className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">8</span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
              LIVE NOW
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Sports channels broadcasting</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Database Status</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">MySQL + Drizzle</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-500">streamespn_database connected</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Backend Server</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-white">Express.js (5000)</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {backendStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">http://localhost:5000/api</p>
        </div>
      </div>

      {/* Main Content Layout (Table & System Overview) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Channels Stream Demo Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Active Live Channels</h3>
              <p className="text-xs text-slate-400">Currently broadcasting sports streams</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Channel Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quality</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-white">ESPN 1 HD</td>
                  <td className="py-3 px-4 text-slate-400">Football / Soccer</td>
                  <td className="py-3 px-4"><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">1080p60</span></td>
                  <td className="py-3 px-4"><span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">ONLINE</span></td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-white">ESPN 2 USA</td>
                  <td className="py-3 px-4 text-slate-400">Basketball / NBA</td>
                  <td className="py-3 px-4"><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">1080p</span></td>
                  <td className="py-3 px-4"><span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">ONLINE</span></td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-white">ESPN News Live</td>
                  <td className="py-3 px-4 text-slate-400">News & Highlights</td>
                  <td className="py-3 px-4"><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">720p</span></td>
                  <td className="py-3 px-4"><span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">ONLINE</span></td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-white">ESPN Cricket Extra</td>
                  <td className="py-3 px-4 text-slate-400">Cricket / T20</td>
                  <td className="py-3 px-4"><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">4K UHD</span></td>
                  <td className="py-3 px-4"><span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">ONLINE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Credentials & System Info Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Admin Account Info</h3>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-semibold text-white">{user?.name || 'System Admin'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-300">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role:</span>
              <span className="font-bold text-rose-400 uppercase">{user?.role || 'admin'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Auth Method:</span>
              <span className="text-slate-300">JWT Token</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">System Architecture</p>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                <span>Frontend: Vite + React 19 + Tailwind CSS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                <span>State: Redux Toolkit (authSlice)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                <span>Backend: Express.js + Drizzle ORM + MySQL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
