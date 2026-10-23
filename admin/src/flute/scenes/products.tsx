'use client';

import React from 'react';
import { Surface } from '@webprodigies/flute';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { ParttimeProvider } from '@/lib/ParttimeContext';
import { Plus, Package, Search } from 'lucide-react';

export default function ProductsScene() {
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

          {/* Elevated Add Product CTA Surface */}
          <Surface 
            id="add-product-cta" 
            style={{ 
              width: 320, 
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.2) 0%, rgba(28, 28, 30, 0.95) 100%)',
              border: '1px solid rgba(10, 132, 255, 0.4)',
              padding: 24,
              boxShadow: '0 25px 50px -10px rgba(10, 132, 255, 0.3)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue/20 text-blue flex items-center justify-center font-bold">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">New Product</h4>
                <p className="text-textSecondary text-xs">Add items to catalog</p>
              </div>
            </div>
            <button className="w-full bg-blue hover:bg-blue/90 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue/20 mt-2">
              <Plus size={16} /> Add Product
            </button>
          </Surface>

          {/* Products Catalog Surface */}
          <Surface 
            id="products-catalog" 
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
                  <h3 className="text-lg font-bold text-white">Product Catalog</h3>
                  <p className="text-textSecondary text-xs">4 Active menu items</p>
                </div>
                <div className="flex items-center gap-2 bg-surface2 px-3 py-1.5 rounded-xl border border-border">
                  <Search size={14} className="text-textTertiary" />
                  <span className="text-textTertiary text-xs">Search...</span>
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-textTertiary text-xs font-semibold">
                    <th className="text-left py-2.5">Product</th>
                    <th className="text-left py-2.5">Category</th>
                    <th className="text-right py-2.5">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {[
                    { name: 'Pepperoni Pizza', cat: 'PIZZA', price: '$15.00' },
                    { name: 'Cold Coffee', cat: 'BEVERAGE', price: '$10.60' },
                    { name: 'Garlic Bread', cat: 'STARTER', price: '$6.50' },
                    { name: 'Chocolate Brownie', cat: 'DESSERT', price: '$8.00' },
                  ].map((p) => (
                    <tr key={p.name}>
                      <td className="py-3 font-semibold text-white">{p.name}</td>
                      <td className="py-3"><span className="bg-surface2 text-blue text-xs font-semibold px-2.5 py-1 rounded-full border border-blue/20">{p.cat}</span></td>
                      <td className="py-3 text-right font-bold text-white tabular-nums">{p.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        </div>
      </ParttimeProvider>
    </AuthProvider>
  );
}
