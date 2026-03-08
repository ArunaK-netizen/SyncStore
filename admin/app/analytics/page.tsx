'use client';
import AppShell from '@/components/AppShell';
import { formatCurrency, formatMonth, LoadingSpinner, PageHeader } from '@/components/UI';
import { useAnalytics, useTransactions } from '@/lib/hooks';
import { ChevronLeft, ChevronRight, Trophy, X } from 'lucide-react';
import {
    Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
    Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { useMemo, useState } from 'react';

const COLORS = ['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#64d2ff', '#ff453a'];

function NavHeader({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <button onClick={onPrev} className="p-1 rounded-lg text-textTertiary hover:text-white hover:bg-surface2 transition-all">
                <ChevronLeft size={16} />
            </button>
            <p className="text-white font-semibold text-sm">{label}</p>
            <button onClick={onNext} className="p-1 rounded-lg text-textTertiary hover:text-white hover:bg-surface2 transition-all">
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

import { useParttime } from '@/lib/ParttimeContext';

export default function AnalyticsPage() {
    const { activeParttime } = useParttime();
    const { transactions: txns, loading: txLoading } = useTransactions(activeParttime?.id);
    const analytics = useAnalytics(txns);

    // Navigation offsets (negative = further back in time)
    const [revenueYearOffset, setRevenueYearOffset] = useState(0); // 0 = current year, 1 = last year
    const [empMonthOffset, setEmpMonthOffset] = useState(0);
    const [productPage, setProductPage] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [categoryProduct, setCategoryProduct] = useState<string | null>(null);
    const [categoryView, setCategoryView] = useState<'overall' | 'monthly'>('overall');

    // --- Revenue: navigable by year (shows all 12 months for the selected year) ---
    const revenueYear = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - revenueYearOffset);
        return d.getFullYear();
    }, [revenueYearOffset]);

    const revenueWindow = useMemo(() => {
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        return months.map(m => {
            const yyyyMm = `${revenueYear}-${m}`;
            const revenue = txns.filter(t => t.date?.startsWith(yyyyMm)).reduce((s, t) => s + (t.totalAmount || 0), 0);
            return { month: yyyyMm, revenue };
        });
    }, [revenueYear, txns]);

    const revenueWindowLabel = `${revenueYear} Revenue`;

    // --- Employee of Month: navigable ---
    const empMonthStr = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - empMonthOffset);
        return d.toISOString().slice(0, 7);
    }, [empMonthOffset]);

    const empMonthLabel = useMemo(() => {
        const [y, m] = empMonthStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(m) - 1]} ${y}`;
    }, [empMonthStr]);

    const empMonthly = useMemo(() => Object.entries(
        txns.filter(t => t.date?.startsWith(empMonthStr))
            .reduce((acc: Record<string, { name: string; revenue: number; tips: number; txCount: number }>, t) => {
                if (!t.userId) return acc;
                if (!acc[t.userId]) acc[t.userId] = { name: t.userName || 'Unknown', revenue: 0, tips: 0, txCount: 0 };
                acc[t.userId].revenue += t.totalAmount || 0;
                acc[t.userId].tips += t.tip || 0;
                acc[t.userId].txCount += 1;
                return acc;
            }, {})
    ).map(([uid, v]) => ({ uid, ...v })).sort((a, b) => b.revenue - a.revenue), [txns, empMonthStr]);

    const monthBest = empMonthly[0] ?? null;

    // --- Products: paginated + drill-down ---
    const PAGE_SIZE = 8;
    const allProducts = analytics.topProducts; // already sorted by revenue
    const totalPages = Math.ceil(allProducts.length / PAGE_SIZE);
    const pagedProducts = allProducts.slice(productPage * PAGE_SIZE, (productPage + 1) * PAGE_SIZE);

    // Product drill-down detail
    const productDetail = useMemo(() => {
        if (!selectedProduct) return null;
        const txList = txns.filter(t => {
            const items = t.items || (t.productName ? [{ productName: t.productName, price: t.price || 0, quantity: t.quantity || 1 }] : []);
            return items.some((i: any) => i.productName === selectedProduct);
        });
        const monthMap: Record<string, number> = {};
        for (const t of txList) {
            const m = t.date?.slice(0, 7) || '';
            if (!monthMap[m]) monthMap[m] = 0;
            const items = t.items || [{ productName: t.productName, price: t.price || 0, quantity: t.quantity || 1 }];
            for (const item of items as any[]) {
                if (item.productName === selectedProduct) monthMap[m] += item.price * item.quantity;
            }
        }
        return Object.entries(monthMap).sort().map(([month, revenue]) => ({ month, revenue }));
    }, [selectedProduct, txns]);

    // --- Category breakdown: overall AND monthly ---
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const buildCategoryStats = (filterMonth?: string) => {
        const map: Record<string, { revenue: number; qty: number }> = {};
        const source = filterMonth ? txns.filter(t => t.date?.startsWith(filterMonth)) : txns;
        for (const t of source) {
            const items = t.items || (t.productName ? [{ productName: t.productName, category: t.category || 'uncategorised', price: t.price || 0, quantity: t.quantity || 1 }] : []);
            for (const item of items as any[]) {
                const cat = item.category || 'uncategorised';
                if (!map[cat]) map[cat] = { revenue: 0, qty: 0 };
                map[cat].revenue += (item.price || 0) * (item.quantity || 1);
                map[cat].qty += item.quantity || 1;
            }
        }
        return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue).map(([name, v]) => ({ name, ...v }));
    };
    const categoryStats = useMemo(() => buildCategoryStats(), [txns]);
    const categoryStatsMonthly = useMemo(() => buildCategoryStats(currentMonthStr), [txns, currentMonthStr]);

    if (txLoading) return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;

    const pieData = [
        { name: 'Cash', value: analytics.paymentBreakdown.cash },
        { name: 'Card', value: analytics.paymentBreakdown.card },
        { name: 'UPI', value: analytics.paymentBreakdown.upi },
    ].filter(d => d.value > 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.length) return (
            <div className="glass-card px-3 py-2 border border-blue/20">
                <p className="text-textSecondary text-xs mb-1">{label}</p>
                <p className="text-blue font-bold text-sm">{formatCurrency(payload[0].value)}</p>
            </div>
        );
        return null;
    };
    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload?.length) return (
            <div className="glass-card px-3 py-2 border border-blue/20">
                <p className="text-white font-bold text-sm">{payload[0].name}: {formatCurrency(payload[0].value)}</p>
            </div>
        );
        return null;
    };

    return (
        <AppShell>
            <div className="p-6 max-w-7xl mx-auto">
                <PageHeader title="Analytics" subtitle="Insights across your part-time business" />

                {/* Employee of Month — navigable */}
                <div className="glass-card p-5 mb-4">
                    <NavHeader
                        label={`⭐ Employee of the Month — ${empMonthLabel}`}
                        onPrev={() => setEmpMonthOffset(o => o + 1)}
                        onNext={() => setEmpMonthOffset(o => Math.max(0, o - 1))}
                    />
                    {monthBest ? (
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-2xl bg-yellow/20 flex items-center justify-center flex-shrink-0">
                                    <Trophy size={22} className="text-yellow" />
                                </div>
                                <div>
                                    <p className="text-yellow text-xs font-bold uppercase tracking-wider mb-0.5">Top Performer</p>
                                    <p className="text-white font-bold text-lg">{monthBest.name}</p>
                                    <p className="text-textSecondary text-sm">{formatCurrency(monthBest.revenue)} revenue · {monthBest.txCount} sales</p>
                                </div>
                            </div>
                            {/* Leaderboard — top 3 only */}
                            <div className="flex-1 space-y-2">
                                {empMonthly.slice(0, 3).map((emp, i) => (
                                    <div key={emp.uid} className="flex items-center gap-2">
                                        <span className={`w-5 text-xs font-bold text-center flex-shrink-0 ${i === 0 ? 'text-yellow' : i === 1 ? 'text-textSecondary' : 'text-textTertiary'}`}>{i + 1}</span>
                                        <span className="text-white text-xs font-medium w-24 truncate">{emp.name}</span>
                                        <div className="flex-1 bg-surface2 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full ${i === 0 ? 'bg-yellow' : i === 1 ? 'bg-blue/70' : 'bg-blue/40'}`}
                                                style={{ width: `${monthBest.revenue > 0 ? (emp.revenue / monthBest.revenue) * 100 : 0}%` }} />
                                        </div>
                                        <span className="text-blue text-xs font-bold tabular-nums w-16 text-right">{formatCurrency(emp.revenue)}</span>
                                        {emp.tips > 0 && <span className="text-orange text-xs tabular-nums w-14 text-right">+{formatCurrency(emp.tips)} tips</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-textTertiary text-sm text-center py-4">No sales data for {empMonthLabel}</p>
                    )}
                </div>

                {/* Yearly Revenue — navigable window */}
                <div className="glass-card p-5 mb-4">
                    <NavHeader
                        label={` Yearly Revenue · ${revenueYear}`}
                        onPrev={() => setRevenueYearOffset(o => o + 1)}
                        onNext={() => setRevenueYearOffset(o => Math.max(0, o - 1))}
                    />
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={revenueWindow}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" vertical={false} />
                            <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} width={42} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="revenue" stroke="#0a84ff" strokeWidth={2.5}
                                dot={{ fill: '#0a84ff', r: 4 }} activeDot={{ r: 6, fill: '#0a84ff', strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Top Products — paginated + drill-down */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-white font-semibold text-sm">
                                {selectedProduct ? (
                                    <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-1.5 text-blue hover:text-white transition-colors">
                                        <X size={14} /> {selectedProduct}
                                    </button>
                                ) : 'Products by Revenue'}
                            </p>
                            {!selectedProduct && totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setProductPage(p => Math.max(0, p - 1))} disabled={productPage === 0}
                                        className="p-1 rounded text-textTertiary hover:text-white disabled:opacity-30 transition-colors">
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-textTertiary text-xs">{productPage + 1}/{totalPages}</span>
                                    <button onClick={() => setProductPage(p => Math.min(totalPages - 1, p + 1))} disabled={productPage === totalPages - 1}
                                        className="p-1 rounded text-textTertiary hover:text-white disabled:opacity-30 transition-colors">
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedProduct && productDetail ? (
                            // Drill-down: monthly revenue for this product
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={productDetail} barSize={16}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" vertical={false} />
                                    <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#636366', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#636366', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} width={38} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(10,132,255,0.08)' }} />
                                    <Bar dataKey="revenue" fill="#0a84ff" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={pagedProducts} layout="vertical" barSize={14}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#636366', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: '#636366', fontSize: 10 }} axisLine={false} tickLine={false} width={90}
                                        tickFormatter={(name: string) => name.length > 12 ? name.slice(0, 12) + '…' : name} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(10,132,255,0.08)' }} />
                                    <Bar dataKey="revenue" fill="#0a84ff" radius={[0, 4, 4, 0]}
                                        onClick={(data: any) => setSelectedProduct(data.name)} cursor="pointer" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {!selectedProduct && <p className="text-textTertiary text-xs text-center mt-2">Click a bar to see monthly trend</p>}
                    </div>

                    {/* Category Breakdown */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-white font-semibold text-sm">Category Performance</p>
                            <div className="flex bg-surface2 rounded-lg p-0.5 gap-0.5">
                                {(['overall', 'monthly'] as const).map(v => (
                                    <button key={v} onClick={() => setCategoryView(v)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${categoryView === v ? 'bg-blue text-white' : 'text-textTertiary hover:text-white'}`}>
                                        {v === 'overall' ? 'All Time' : 'This Month'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {(() => {
                            const data = categoryView === 'monthly' ? categoryStatsMonthly : categoryStats;
                            if (data.length === 0) return (
                                <div className="flex items-center justify-center h-40 text-textTertiary text-sm">
                                    {categoryView === 'monthly' ? 'No sales this month yet' : 'No data yet'}
                                </div>
                            );
                            return (
                                <>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={data.slice(0, 6)} barSize={28}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: '#636366', fontSize: 10 }} axisLine={false} tickLine={false}
                                                tickFormatter={(n: string) => n.length > 8 ? n.slice(0, 8) + '…' : n} />
                                            <YAxis tick={{ fill: '#636366', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} width={38} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(10,132,255,0.08)' }} />
                                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                                {data.slice(0, 6).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="mt-3 space-y-1.5">
                                        {data.slice(0, 5).map((cat, i) => (
                                            <div key={cat.name} className="flex items-center gap-2 text-xs">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                <span className="text-textSecondary capitalize flex-1 truncate">{cat.name}</span>
                                                <span className="text-textTertiary">{cat.qty} units</span>
                                                <span className="text-white font-semibold tabular-nums">{formatCurrency(cat.revenue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="glass-card p-5">
                    <p className="text-white font-semibold text-sm mb-4">Payment Method Breakdown</p>
                    {pieData.length > 0 ? (
                        <div className="flex flex-col lg:flex-row items-center gap-6">
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-3 flex-1">
                                {pieData.map((d, i) => {
                                    const total = pieData.reduce((s, x) => s + x.value, 0);
                                    return (
                                        <div key={d.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                                                    <span className="text-textSecondary text-sm">{d.name}</span>
                                                </div>
                                                <span className="text-white text-sm font-semibold">{formatCurrency(d.value)}</span>
                                            </div>
                                            <div className="bg-surface2 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / total) * 100}%`, background: COLORS[i] }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-textTertiary text-sm">No data yet</div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
