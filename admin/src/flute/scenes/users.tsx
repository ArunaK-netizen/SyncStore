'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { ShieldCheck, Plus, Shield, Users } from 'lucide-react';

export default function UsersScene() {
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

          {/* Elevated Security Badge Card Surface */}
          <Surface 
            id="security-badge-card" 
            style={{ 
              width: 380, 
              borderRadius: 24, 
              background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.15) 0%, rgba(28, 28, 30, 0.95) 100%)',
              border: '1px solid rgba(10, 132, 255, 0.4)',
              boxShadow: '0 30px 60px -15px rgba(10, 132, 255, 0.25)',
              padding: 24
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue/20 text-blue flex items-center justify-center font-bold">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Mobile Whitelist</h3>
                <p className="text-textSecondary text-xs">Security & Access Control</p>
              </div>
            </div>
            <p className="text-textSecondary text-xs leading-relaxed mb-4">
              Only employees listed in this whitelist are permitted to log in via the Mobile POS App.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-lg shadow-blue/20">
                <Plus size={14} /> Add Employee
              </button>
            </div>
          </Surface>

          {/* Users Table Surface */}
          <Surface 
            id="users-list-table" 
            style={{ 
              width: 560, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="bg-blue text-white text-xs font-semibold px-3 py-1 rounded-lg">Mobile Whitelist (2)</span>
                  <span className="bg-surface2 text-textSecondary text-xs font-semibold px-3 py-1 rounded-lg">Admins (1)</span>
                </div>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-textTertiary">
                    <th className="text-left py-2.5">Employee</th>
                    <th className="text-left py-2.5">Email</th>
                    <th className="text-right py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-3 font-bold text-white">Arun Kumar</td>
                    <td className="py-3 text-textSecondary">arun@rasagna.com</td>
                    <td className="py-3 text-right"><span className="bg-green/20 text-green px-2.5 py-1 rounded-full font-semibold">Active</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-white">Rajesh Sharma</td>
                    <td className="py-3 text-textSecondary">rajesh@rasagna.com</td>
                    <td className="py-3 text-right"><span className="bg-green/20 text-green px-2.5 py-1 rounded-full font-semibold">Active</span></td>
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
