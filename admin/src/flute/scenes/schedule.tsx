'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';

export default function ScheduleScene() {
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

          {/* Elevated Header Surface */}
          <Surface 
            id="schedule-header" 
            style={{ 
              width: 880, 
              borderRadius: 20,
              background: '#1c1c1e',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '20px 24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Shift Timetable</h2>
              <p className="text-textSecondary text-xs mt-0.5">3 Shifts scheduled this week</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl bg-surface2 text-textSecondary border border-border"><ChevronLeft size={16} /></button>
              <span className="text-white text-xs font-semibold px-3">Sep 21 – Sep 27, 2026</span>
              <button className="p-2 rounded-xl bg-surface2 text-textSecondary border border-border"><ChevronRight size={16} /></button>
            </div>
          </Surface>

          {/* Timetable Grid Surface */}
          <Surface 
            id="timetable-grid" 
            style={{ 
              width: 880, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-textTertiary">
                    <th className="text-left py-3 w-32">Employee</th>
                    {['Mon 21', 'Tue 22', 'Wed 23', 'Thu 24', 'Fri 25', 'Sat 26', 'Sun 27'].map((d, i) => (
                      <th key={d} className={`py-3 text-center ${i === 0 ? 'text-blue font-bold' : ''}`}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-4 font-bold text-white">Arun Kumar</td>
                    <td className="p-1">
                      <div className="bg-blue/15 border border-blue/30 text-blue p-2 rounded-lg text-[11px] font-semibold">
                        <div className="flex items-center gap-1"><Clock size={10} /> 09:00 AM</div>
                        <div className="text-[10px] text-textTertiary">→ 05:00 PM</div>
                      </div>
                    </td>
                    <td className="p-1 text-center text-textTertiary">—</td>
                    <td className="p-1">
                      <div className="bg-blue/15 border border-blue/30 text-blue p-2 rounded-lg text-[11px] font-semibold">
                        <div className="flex items-center gap-1"><Clock size={10} /> 09:00 AM</div>
                        <div className="text-[10px] text-textTertiary">→ 05:00 PM</div>
                      </div>
                    </td>
                    <td className="p-1 text-center text-textTertiary">—</td>
                    <td className="p-1">
                      <div className="bg-blue/15 border border-blue/30 text-blue p-2 rounded-lg text-[11px] font-semibold">
                        <div className="flex items-center gap-1"><Clock size={10} /> 01:00 PM</div>
                        <div className="text-[10px] text-textTertiary">→ 09:00 PM</div>
                      </div>
                    </td>
                    <td className="p-1 text-center text-textTertiary">—</td>
                    <td className="p-1 text-center text-textTertiary">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Surface>
        </div>
      </ParttimeProvider>
    </AuthProvider>
  );
}
