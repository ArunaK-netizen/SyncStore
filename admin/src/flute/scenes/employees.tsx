'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { Trophy, ChevronRight, Search } from 'lucide-react';

export default function EmployeesScene() {
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

          {/* Elevated Star Card Surface */}
          <Surface 
            id="top-star-card" 
            style={{ 
              width: 400, 
              borderRadius: 24, 
              background: 'linear-gradient(135deg, rgba(255, 214, 10, 0.12) 0%, rgba(28, 28, 30, 0.9) 100%)',
              border: '1px solid rgba(255, 214, 10, 0.4)',
              boxShadow: '0 30px 60px -15px rgba(255, 214, 10, 0.25)',
              padding: 24
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-yellow uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={14} /> #1 Top Performer
              </span>
              <span className="bg-yellow/20 text-yellow px-3 py-1 rounded-full text-xs font-bold">Star Award</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-yellow/20 text-yellow font-bold text-2xl flex items-center justify-center border border-yellow/30 shadow-lg">
                AK
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Arun Kumar</h3>
                <p className="text-textSecondary text-xs">Since Sep 2026 · 2 sales</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-textTertiary text-xs">All-time Revenue</p>
                <p className="text-2xl font-bold text-blue">$25.60</p>
              </div>
              <div>
                <p className="text-textTertiary text-xs">This Month</p>
                <p className="text-2xl font-bold text-green">$25.60</p>
              </div>
            </div>
          </Surface>

          {/* Staff Grid Surface */}
          <Surface 
            id="staff-grid" 
            style={{ 
              width: 540, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Staff Members</h3>
                  <p className="text-textSecondary text-xs">2 active employees enrolled</p>
                </div>
                <div className="flex items-center gap-2 bg-surface2 px-3 py-1.5 rounded-xl border border-border">
                  <Search size={14} className="text-textTertiary" />
                  <span className="text-textTertiary text-xs">Search staff...</span>
                </div>
              </div>

              {[
                { name: 'Arun Kumar', sales: '2 sales', rev: '$25.60', avg: '$12.80', initials: 'AK', star: true },
                { name: 'Rajesh Sharma', sales: '0 sales', rev: '$0.00', avg: '$0.00', initials: 'RS', star: false },
              ].map((emp) => (
                <div key={emp.name} className="bg-surface2/60 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${emp.star ? 'bg-yellow/20 text-yellow' : 'bg-surface3 text-textSecondary'}`}>
                      {emp.initials}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{emp.name}</p>
                      <p className="text-textTertiary text-xs">{emp.sales}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue font-bold text-sm">{emp.rev}</p>
                    <p className="text-textTertiary text-[10px]">Avg: {emp.avg}</p>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </ParttimeProvider>
    </AuthProvider>
  );
}
