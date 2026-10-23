'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { Download, FileText, Search } from 'lucide-react';

export default function SalesScene() {
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

          {/* Elevated Sales Action Header */}
          <Surface 
            id="sales-action-bar" 
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
              <h2 className="text-xl font-bold text-white tracking-tight">Sales Transactions</h2>
              <p className="text-textSecondary text-xs mt-0.5">2 transactions recorded · $25.60 Total</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-blue text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue/20">
                <Download size={14} /> Export Excel
              </button>
              <button className="flex items-center gap-2 bg-surface2 text-textSecondary px-4 py-2 rounded-xl text-xs font-semibold border border-border">
                <FileText size={14} /> Export PDF
              </button>
            </div>
          </Surface>

          {/* Sales Table Surface */}
          <Surface 
            id="tx-table-surface" 
            style={{ 
              width: 880, 
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-surface2 flex items-center gap-2 px-3 py-2 rounded-xl border border-border">
                  <Search size={14} className="text-textTertiary" />
                  <span className="text-textTertiary text-xs">Search employee or product...</span>
                </div>
                <div className="bg-surface2 px-4 py-2 rounded-xl border border-border text-xs text-textSecondary font-semibold">
                  All Payments
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-textTertiary text-xs font-semibold">
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Employee</th>
                    <th className="text-left py-3">Items</th>
                    <th className="text-left py-3">Payment</th>
                    <th className="text-right py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  <tr>
                    <td className="py-3 text-textSecondary text-xs">2026-09-21</td>
                    <td className="py-3 font-semibold text-white">Arun Kumar</td>
                    <td className="py-3 text-textSecondary text-xs">1 item (Pepperoni Pizza)</td>
                    <td className="py-3"><span className="bg-blue/20 text-blue text-xs font-semibold px-2.5 py-1 rounded-full">UPI</span></td>
                    <td className="py-3 text-right font-bold text-blue">$15.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-textSecondary text-xs">2026-09-21</td>
                    <td className="py-3 font-semibold text-white">Arun Kumar</td>
                    <td className="py-3 text-textSecondary text-xs">1 item (Cold Coffee)</td>
                    <td className="py-3"><span className="bg-green/20 text-green text-xs font-semibold px-2.5 py-1 rounded-full">CASH</span></td>
                    <td className="py-3 text-right font-bold text-blue">$10.60</td>
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
