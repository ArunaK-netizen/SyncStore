'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { Zap, TrendingUp, DollarSign, ShoppingBag, Trophy, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const liveChartData = [
  { date: '2026-09-15', revenue: 0 },
  { date: '2026-09-16', revenue: 0 },
  { date: '2026-09-17', revenue: 0 },
  { date: '2026-09-18', revenue: 0 },
  { date: '2026-09-19', revenue: 0 },
  { date: '2026-09-20', revenue: 0 },
  { date: '2026-09-21', revenue: 25.60 },
];

export default function OverviewScene() {
  return (
    <AuthProvider>
      <ParttimeProvider>
        <div className="w-[1400px] h-[980px] bg-[#0a0a0a] text-white flex p-8 gap-8 items-center justify-center relative overflow-hidden font-outfit">
          <Surface 
            id="app-sidebar" 
            style={{ 
              width: 260, 
              height: 840,
              borderRadius: 20, 
              overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="h-full bg-surface">
              <Sidebar />
            </div>
          </Surface>

          <Surface 
            id="kpi-grid" 
            style={{ 
              width: 880, 
              borderRadius: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16
            }}
          >
            {[
              { label: "TODAY'S REVENUE", val: "$0.00", delta: "↓ 100% vs yesterday", color: "text-blue", icon: <Zap size={16} /> },
              { label: "THIS WEEK", val: "$25.60", delta: null, color: "text-green", icon: <TrendingUp size={16} /> },
              { label: "THIS MONTH", val: "$25.60", delta: null, color: "text-purple", icon: <DollarSign size={16} /> },
              { label: "AVG ORDER VALUE", val: "$12.80", delta: "2 total txns", color: "text-orange", icon: <ShoppingBag size={16} /> },
            ].map((k) => (
              <div key={k.label} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-textSecondary text-xs font-semibold uppercase tracking-wider">{k.label}</p>
                  <div className="w-7 h-7 rounded-lg bg-surface2 flex items-center justify-center text-textTertiary">
                    {k.icon}
                  </div>
                </div>
                <p className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.val}</p>
                <div className="mt-1.5 h-4">
                  {k.delta && <span className="text-xs font-medium text-red">{k.delta}</span>}
                </div>
              </div>
            ))}
          </Surface>

          <Surface 
            id="revenue-chart" 
            style={{ 
              width: 560, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-5 flex flex-col h-[280px]">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <p className="text-white font-semibold text-sm">7-Day Revenue</p>
                <div className="flex items-center gap-1">
                  <span className="text-textTertiary text-xs px-1 text-center">Sep 15 – Sep 21</span>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liveChartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v} width={30} />
                    <Bar dataKey="revenue" fill="#0a84ff" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Surface>

          <Surface 
            id="insights-panel" 
            style={{ 
              width: 300, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-5 flex flex-col gap-3">
              <p className="text-white font-semibold text-sm">Quick Insights</p>

              <div className="bg-surface2 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Trophy size={13} className="text-yellow" />
                  <p className="text-yellow text-xs font-semibold">Month's Star</p>
                </div>
                <p className="text-white font-bold text-sm truncate">Arun Kumar</p>
                <p className="text-green text-xs font-medium mt-0.5">$15.00</p>
              </div>

              <div className="bg-surface2 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users size={13} className="text-blue" />
                  <p className="text-textSecondary text-xs font-semibold">Active Employees</p>
                </div>
                <p className="text-white font-bold text-xl">2</p>
              </div>

              <div className="bg-surface2 rounded-xl p-3.5">
                <p className="text-textSecondary text-xs font-semibold mb-1">Top Product</p>
                <p className="text-white font-bold text-sm truncate">Pepperoni Pizza</p>
                <p className="text-blue text-xs mt-0.5">1 sold · $15.00</p>
              </div>
            </div>
          </Surface>
        </div>
      </ParttimeProvider>
    </AuthProvider>
  );
}
