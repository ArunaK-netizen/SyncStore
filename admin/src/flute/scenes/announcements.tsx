'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { Megaphone, Plus } from 'lucide-react';

export default function AnnouncementsScene() {
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

          {/* Elevated Header CTA Surface */}
          <Surface 
            id="announcement-header" 
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
              <h2 className="text-xl font-bold text-white tracking-tight">Staff Announcements</h2>
              <p className="text-textSecondary text-xs mt-0.5">Post broadcasts visible to mobile POS users</p>
            </div>
            <button className="flex items-center gap-2 bg-blue text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue/20">
              <Plus size={14} /> New Announcement
            </button>
          </Surface>

          {/* Announcements Feed Surface */}
          <Surface 
            id="announcements-feed" 
            style={{ 
              width: 880, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-6 flex flex-col gap-4">
              {[
                { title: 'September Shift Timetable Published', body: 'The shift schedule for the upcoming week of Sep 21–27 has been finalized and published.', date: '21 Sep 2026', author: 'Admin' },
                { title: 'New Menu Items Added', body: 'Please review the updated price list for Pepperoni Pizza and Cold Coffee under the Products tab.', date: '18 Sep 2026', author: 'Admin' },
              ].map((ann) => (
                <div key={ann.title} className="bg-surface2/60 p-4 rounded-xl border border-white/5 flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-blue/15 text-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">{ann.title}</h4>
                    <p className="text-textSecondary text-xs leading-relaxed">{ann.body}</p>
                    <p className="text-textTertiary text-[10px] mt-2">{ann.date} · by {ann.author}</p>
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
