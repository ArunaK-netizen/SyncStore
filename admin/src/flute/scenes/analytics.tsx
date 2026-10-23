'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const yearlyData = [
  { month: 'Jan', revenue: 1200 },
  { month: 'Feb', revenue: 1800 },
  { month: 'Mar', revenue: 2400 },
  { month: 'Apr', revenue: 3100 },
  { month: 'May', revenue: 2900 },
  { month: 'Jun', revenue: 4200 },
  { month: 'Jul', revenue: 4800 },
  { month: 'Aug', revenue: 5600 },
  { month: 'Sep', revenue: 6400 },
];

const pieData = [
  { name: 'UPI', value: 15.00, color: '#0a84ff' },
  { name: 'Cash', value: 10.60, color: '#30d158' },
  { name: 'Card', value: 0.00, color: '#ff9f0a' },
];

export default function AnalyticsScene() {
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

          {/* Yearly Trend Chart Surface */}
          <Surface 
            id="yearly-trend-chart" 
            style={{ 
              width: 580, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">2026 Yearly Revenue Trend</h3>
                  <p className="text-textSecondary text-xs">Total cumulative sales growth</p>
                </div>
                <span className="bg-blue/15 text-blue font-semibold px-3 py-1 rounded-full text-xs">2026</span>
              </div>

              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v} width={40} />
                    <Line type="monotone" dataKey="revenue" stroke="#0a84ff" strokeWidth={3} dot={{ fill: '#0a84ff', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Surface>

          {/* Payment Breakdown Card Surface */}
          <Surface 
            id="payment-breakdown-card" 
            style={{ 
              width: 320, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-6 flex flex-col gap-4">
              <h3 className="text-base font-bold text-white">Payment Method Split</h3>
              
              <div className="w-full h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                {pieData.map((d) => (
                  <div key={d.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-textSecondary">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">${d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Surface>
        </div>
      </ParttimeProvider>
    </AuthProvider>
  );
}
