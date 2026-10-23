'use client';
import React from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';

export function LiveAppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ParttimeProvider>
        <div className="w-[1400px] h-[900px] bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/10 shadow-2xl font-outfit relative">
          {children}
        </div>
      </ParttimeProvider>
    </AuthProvider>
  );
}
