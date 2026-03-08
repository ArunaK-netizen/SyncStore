'use client';
import AppShell from '@/components/AppShell';
import { EmptyState, LoadingSpinner, formatCurrency, formatShortDate } from '@/components/UI';
import { AdminUser, Transaction, subscribeAdminUsers } from '@/lib/db';
import { useTransactions } from '@/lib/hooks';
import { useEffect, useMemo, useState } from 'react';
import {
    Bar, BarChart, CartesianGrid, Cell,
    ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import * as XLSX from 'xlsx';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Employee {
    uid: string;
    name: string;
    totalRevenue: number;
    totalTips: number;
    totalTx: number;
    firstSeen: string;
    lastSeen: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORY_COLORS = ['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#ff453a', '#64d2ff', '#ffd60a'];

function getMonthDays(ym: string): string[] {
    const [y, m] = ym.split('-').map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`);
}

function getItems(t: Transaction) {
    return t.items?.length
        ? t.items
        : t.productName
            ? [{ id: '', productName: t.productName, category: t.category || 'Other', price: t.price || 0, quantity: t.quantity || 1 }]
            : [];
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-card px-3 py-2 border border-blue/20 text-xs">
            <p className="text-textSecondary mb-1">{label}</p>
            <p className="text-blue font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
    );
}

// ─── Employee List ────────────────────────────────────────────────────────────
function EmployeeList({ employees, transactions, onSelect }: {
    employees: Employee[];
    transactions: Transaction[];
    onSelect: (uid: string) => void;
}) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split('T')[0];
    const [query, setQuery] = useState('');

    const filtered = query.trim()
        ? employees.filter(e => e.name.toLowerCase().includes(query.trim().toLowerCase()))
        : employees;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Employees</h1>
                    <p className="text-textSecondary text-sm mt-0.5">
                        {employees.length} staff member{employees.length !== 1 ? 's' : ''} · Click any card for a full report
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <div className="relative mb-5">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-textTertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search employees…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full bg-surface2 text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-surface3 focus:border-blue focus:outline-none placeholder-textTertiary transition-colors"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-3.5 flex items-center text-textTertiary hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            {query && (
                <p className="text-textSecondary text-xs mb-4">
                    {filtered.length === 0 ? 'No employees match your search.' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`}
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((emp, idx) => {
                    const monthRev = transactions
                        .filter(t => t.userId === emp.uid && t.date?.startsWith(currentMonth))
                        .reduce((s, t) => s + (t.totalAmount || 0), 0);
                    const todayRev = transactions
                        .filter(t => t.userId === emp.uid && t.date === today)
                        .reduce((s, t) => s + (t.totalAmount || 0), 0);
                    const avg = emp.totalTx > 0 ? emp.totalRevenue / emp.totalTx : 0;
                    const isTop = idx === 0;

                    return (
                        <button
                            key={emp.uid}
                            onClick={() => onSelect(emp.uid)}
                            className="glass-card p-5 text-left hover:border-blue/40 hover:bg-blue/5 transition-all duration-200 group"
                        >
                            {/* Avatar + name row */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold
                                    ${isTop ? 'bg-yellow/20 text-yellow' : 'bg-surface2 text-textSecondary'}`}>
                                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    {isTop && (
                                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-[10px] text-black font-bold">★</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-base truncate">{emp.name}</p>
                                    <p className="text-textTertiary text-xs">
                                        Since {formatShortDate(emp.firstSeen)} · {emp.totalTx} sales
                                    </p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-textSecondary">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Revenue rows */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-textSecondary">All-time</span>
                                    <span className="text-blue font-bold tabular-nums">{formatCurrency(emp.totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-textSecondary">This month</span>
                                    <span className="text-green font-semibold tabular-nums">{formatCurrency(monthRev)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-textSecondary">Today</span>
                                    <span className="text-white font-semibold tabular-nums">{formatCurrency(todayRev)}</span>
                                </div>
                                <div className="h-px bg-surface2 my-2" />
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-textTertiary">Avg / sale</span>
                                    <span className="text-purple tabular-nums">{formatCurrency(avg)}</span>
                                </div>
                                {emp.totalTips > 0 && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-textTertiary">Total tips</span>
                                        <span className="text-orange tabular-nums">{formatCurrency(emp.totalTips)}</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Employee Detail ──────────────────────────────────────────────────────────
function EmployeeDetail({ uid, employees, transactions, onBack }: {
    uid: string;
    employees: Employee[];
    transactions: Transaction[];
    onBack: () => void;
}) {
    const emp = employees.find(e => e.uid === uid)!;
    const empTx = useMemo(
        () => transactions.filter(t => t.userId === uid).sort((a, b) => b.timestamp - a.timestamp),
        [uid, transactions]
    );

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    const [view, setView] = useState<'overview' | 'day' | 'month'>('overview');
    const [selectedDay, setSelectedDay] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // ── Overview stats ──────────────────────────────────────
    const overview = useMemo(() => {
        const todayRev = empTx.filter(t => t.date === today).reduce((s, t) => s + (t.totalAmount || 0), 0);
        const monthRev = empTx.filter(t => t.date?.startsWith(currentMonth)).reduce((s, t) => s + (t.totalAmount || 0), 0);
        const avgSale = empTx.length > 0 ? emp.totalRevenue / emp.totalTx : 0;

        // Best day ever
        const byDay: Record<string, number> = {};
        empTx.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + (t.totalAmount || 0); });
        const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

        // Category breakdown (all time)
        const catMap: Record<string, { revenue: number; qty: number }> = {};
        empTx.forEach(t => {
            getItems(t).forEach(item => {
                if (!catMap[item.category]) catMap[item.category] = { revenue: 0, qty: 0 };
                catMap[item.category].revenue += item.price * item.quantity;
                catMap[item.category].qty += item.quantity;
            });
        });
        const categories = Object.entries(catMap)
            .map(([cat, v]) => ({ cat, ...v }))
            .sort((a, b) => b.revenue - a.revenue);

        // Top products (all time)
        const prodMap: Record<string, { name: string; revenue: number; qty: number; category: string }> = {};
        empTx.forEach(t => {
            getItems(t).forEach(item => {
                if (!prodMap[item.productName]) prodMap[item.productName] = { name: item.productName, revenue: 0, qty: 0, category: item.category };
                prodMap[item.productName].revenue += item.price * item.quantity;
                prodMap[item.productName].qty += item.quantity;
            });
        });
        const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

        // Payment methods
        const pay = { cash: 0, card: 0, upi: 0 };
        empTx.forEach(t => {
            if (t.paymentMethod === 'cash') pay.cash += t.totalAmount || 0;
            else if (t.paymentMethod === 'card') pay.card += t.totalAmount || 0;
            else if (t.paymentMethod === 'upi') pay.upi += t.totalAmount || 0;
        });

        // Last 30 days chart
        const last30: { date: string; label: string; revenue: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const rev = empTx.filter(t => t.date === ds).reduce((s, t) => s + (t.totalAmount || 0), 0);
            last30.push({ date: ds, label: String(d.getDate()), revenue: rev });
        }

        return { todayRev, monthRev, avgSale, bestDay, categories, topProducts, pay, last30 };
    }, [empTx, emp, today, currentMonth]);

    // ── Day view ─────────────────────────────────────────────
    const dayData = useMemo(() => {
        const dayTx = empTx.filter(t => t.date === selectedDay);
        const dayRevenue = dayTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

        const catMap: Record<string, { revenue: number; qty: number; items: Record<string, { qty: number; revenue: number }> }> = {};
        dayTx.forEach(t => {
            getItems(t).forEach(item => {
                if (!catMap[item.category]) catMap[item.category] = { revenue: 0, qty: 0, items: {} };
                catMap[item.category].revenue += item.price * item.quantity;
                catMap[item.category].qty += item.quantity;
                if (!catMap[item.category].items[item.productName]) catMap[item.category].items[item.productName] = { qty: 0, revenue: 0 };
                catMap[item.category].items[item.productName].qty += item.quantity;
                catMap[item.category].items[item.productName].revenue += item.price * item.quantity;
            });
        });
        const categories = Object.entries(catMap)
            .map(([cat, v]) => ({ cat, ...v, items: Object.entries(v.items).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue) }))
            .sort((a, b) => b.revenue - a.revenue);

        const pay = { cash: 0, card: 0, upi: 0 };
        dayTx.forEach(t => {
            if (t.paymentMethod === 'cash') pay.cash += t.totalAmount || 0;
            else if (t.paymentMethod === 'card') pay.card += t.totalAmount || 0;
            else if (t.paymentMethod === 'upi') pay.upi += t.totalAmount || 0;
        });

        return { dayTx, dayRevenue, categories, pay };
    }, [empTx, selectedDay]);

    // ── Month view ────────────────────────────────────────────
    const monthData = useMemo(() => {
        const monthTx = empTx.filter(t => t.date?.startsWith(selectedMonth));
        const monthRevenue = monthTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
        const workingDays = new Set(monthTx.map(t => t.date)).size;

        const days = getMonthDays(selectedMonth);
        const dailyChart = days.map(date => ({
            date,
            label: String(parseInt(date.split('-')[2])),
            revenue: monthTx.filter(t => t.date === date).reduce((s, t) => s + (t.totalAmount || 0), 0),
            txCount: monthTx.filter(t => t.date === date).length,
        }));
        const bestDay = [...dailyChart].sort((a, b) => b.revenue - a.revenue)[0];

        const catMap: Record<string, { revenue: number; qty: number }> = {};
        monthTx.forEach(t => {
            getItems(t).forEach(item => {
                if (!catMap[item.category]) catMap[item.category] = { revenue: 0, qty: 0 };
                catMap[item.category].revenue += item.price * item.quantity;
                catMap[item.category].qty += item.quantity;
            });
        });
        const categories = Object.entries(catMap).map(([cat, v]) => ({ cat, ...v })).sort((a, b) => b.revenue - a.revenue);

        const prodMap: Record<string, { name: string; revenue: number; qty: number; category: string }> = {};
        monthTx.forEach(t => {
            getItems(t).forEach(item => {
                if (!prodMap[item.productName]) prodMap[item.productName] = { name: item.productName, revenue: 0, qty: 0, category: item.category };
                prodMap[item.productName].revenue += item.price * item.quantity;
                prodMap[item.productName].qty += item.quantity;
            });
        });
        const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

        const pay = { cash: 0, card: 0, upi: 0 };
        monthTx.forEach(t => {
            if (t.paymentMethod === 'cash') pay.cash += t.totalAmount || 0;
            else if (t.paymentMethod === 'card') pay.card += t.totalAmount || 0;
            else if (t.paymentMethod === 'upi') pay.upi += t.totalAmount || 0;
        });

        return { monthTx, monthRevenue, workingDays, dailyChart, bestDay, categories, topProducts, pay };
    }, [empTx, selectedMonth]);

    // Generate month options (all months that have data)
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        empTx.forEach(t => { if (t.date) months.add(t.date.slice(0, 7)); });
        return [...months].sort((a, b) => b.localeCompare(a));
    }, [empTx]);

    const formatMonthLabel = (ym: string) => {
        const [y, m] = ym.split('-');
        return `${MONTHS[parseInt(m) - 1]} ${y}`;
    };

    // ── Shared sub-components ────────────────────────────────

    const CategoryBreakdown = ({ categories, totalRevenue }: {
        categories: { cat: string; revenue: number; qty: number }[];
        totalRevenue: number;
    }) => (
        <div className="glass-card p-5">
            <p className="text-white font-semibold text-sm mb-4">Category Breakdown</p>
            {categories.length === 0 ? (
                <p className="text-textSecondary text-sm">No data</p>
            ) : (
                <div className="space-y-3">
                    {categories.map((c, i) => {
                        const pct = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0;
                        return (
                            <div key={c.cat}>
                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                                        <span className="text-white font-medium capitalize">{c.cat}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-textSecondary text-xs">{c.qty} units</span>
                                        <span className="text-white font-semibold tabular-nums">{formatCurrency(c.revenue)}</span>
                                        <span className="text-textTertiary text-xs w-10 text-right">{pct.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const PaymentBreakdown = ({ pay }: { pay: { cash: number; card: number; upi: number } }) => {
        const total = pay.cash + pay.card + pay.upi;
        return (
            <div className="glass-card p-5">
                <p className="text-white font-semibold text-sm mb-4">Payment Methods</p>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Cash', value: pay.cash, color: 'text-green', bg: 'bg-green/10', icon: '💵' },
                        { label: 'Card', value: pay.card, color: 'text-blue', bg: 'bg-blue/10', icon: '💳' },
                        { label: 'UPI', value: pay.upi, color: 'text-purple', bg: 'bg-purple/10', icon: '📱' },
                    ].map(p => (
                        <div key={p.label} className={`rounded-xl p-3 ${p.bg}`}>
                            <p className="text-lg mb-1">{p.icon}</p>
                            <p className={`${p.color} font-bold text-sm tabular-nums`}>{formatCurrency(p.value)}</p>
                            <p className="text-textSecondary text-xs">{p.label}</p>
                            <p className="text-textTertiary text-xs">{total > 0 ? ((p.value / total) * 100).toFixed(0) : 0}%</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const TopProducts = ({ products }: { products: { name: string; revenue: number; qty: number; category: string }[] }) => (
        <div className="glass-card p-5">
            <p className="text-white font-semibold text-sm mb-4">Top Items Sold</p>
            {products.length === 0 ? <p className="text-textSecondary text-sm">No data</p> : (
                <div className="space-y-2">
                    {products.map((p, i) => (
                        <div key={p.name} className="flex items-center gap-3 py-2 border-b border-surface2 last:border-0">
                            <span className="text-textTertiary text-xs w-5 text-center font-bold">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{p.name}</p>
                                <p className="text-textTertiary text-xs capitalize">{p.category} · {p.qty} sold</p>
                            </div>
                            <p className="text-blue font-bold text-sm tabular-nums flex-shrink-0">{formatCurrency(p.revenue)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Back + Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="flex items-center gap-1.5 text-blue hover:text-blue/80 transition-colors text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    All Employees
                </button>
                <div className="h-4 w-px bg-surface2" />
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-blue/20 flex items-center justify-center text-blue font-bold text-lg">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{emp.name}</h1>
                        <p className="text-textSecondary text-xs">
                            Part-time · Active since {formatShortDate(emp.firstSeen)} · Last sale {formatShortDate(emp.lastSeen)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'All-time Revenue', value: formatCurrency(emp.totalRevenue), color: 'text-blue', icon: '💰' },
                    { label: 'This Month', value: formatCurrency(overview.monthRev), color: 'text-green', icon: '📅' },
                    { label: 'Today', value: formatCurrency(overview.todayRev), color: 'text-white', icon: '🌅' },
                    { label: 'Avg / Sale', value: formatCurrency(overview.avgSale), color: 'text-purple', icon: '📊' },
                ].map(s => (
                    <div key={s.label} className="glass-card p-4">
                        <p className="text-lg mb-1">{s.icon}</p>
                        <p className={`${s.color} font-bold text-xl tabular-nums`}>{s.value}</p>
                        <p className="text-textSecondary text-xs mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2 mb-6">
                {(['overview', 'day', 'month'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200
                            ${view === v ? 'bg-blue text-white' : 'bg-surface2 text-textSecondary hover:text-white'}`}
                    >
                        {v === 'overview' ? '📈 Overview' : v === 'day' ? '📆 Day Report' : '🗓 Month Report'}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW ── */}
            {view === 'overview' && (
                <div className="space-y-4 fade-in">
                    {/* Best day callout */}
                    {overview.bestDay && (
                        <div className="glass-card p-4 border-yellow/20 bg-yellow/5 flex items-center gap-4">
                            <span className="text-2xl">🏆</span>
                            <div>
                                <p className="text-yellow font-bold text-sm">Best Day Ever</p>
                                <p className="text-white text-lg font-bold">{formatCurrency(overview.bestDay[1])}</p>
                                <p className="text-textSecondary text-xs">{formatShortDate(overview.bestDay[0])}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-textSecondary text-xs">Total transactions</p>
                                <p className="text-white font-bold text-lg">{emp.totalTx}</p>
                            </div>
                        </div>
                    )}

                    {/* 30-day trend */}
                    <div className="glass-card p-5">
                        <p className="text-white font-semibold text-sm mb-4">Last 30 Days Revenue</p>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={overview.last30} barSize={8}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#38383a" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: '#98989d', fontSize: 10 }} axisLine={false} tickLine={false}
                                    interval={4} />
                                <YAxis tick={{ fill: '#98989d', fontSize: 10 }} axisLine={false} tickLine={false}
                                    tickFormatter={v => '$' + v} width={45} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(10,132,255,0.08)' }} />
                                <Bar dataKey="revenue" fill="#0a84ff" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <CategoryBreakdown categories={overview.categories} totalRevenue={emp.totalRevenue} />
                        <div className="space-y-4">
                            <PaymentBreakdown pay={overview.pay} />
                        </div>
                    </div>
                    <TopProducts products={overview.topProducts} />
                </div>
            )}

            {/* ── DAY REPORT ── */}
            {view === 'day' && (
                <div className="space-y-4 fade-in">
                    {/* Date picker */}
                    <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
                        <label className="text-textSecondary text-sm font-semibold">Select Date</label>
                        <input
                            type="date"
                            value={selectedDay}
                            max={today}
                            onChange={e => setSelectedDay(e.target.value)}
                            className="bg-surface2 text-white text-sm rounded-xl px-3 py-2 border border-surface3 focus:border-blue focus:outline-none"
                        />
                        <div className="flex gap-2 flex-wrap">
                            {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                                const d = new Date(); d.setDate(d.getDate() - offset);
                                const ds = d.toISOString().split('T')[0];
                                const hasTx = empTx.some(t => t.date === ds);
                                return (
                                    <button key={ds} onClick={() => setSelectedDay(ds)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                            ${selectedDay === ds ? 'bg-blue text-white' : hasTx ? 'bg-surface2 text-white' : 'bg-surface2 text-textTertiary'}
                                        `}
                                    >
                                        {offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : formatShortDate(ds)}
                                        {hasTx && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green inline-block" />}
                                    </button>
                                );
                            })}
                        </div>
                        {dayData.dayTx.length > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => {
                                        const rows = dayData.dayTx.flatMap((t, i) => {
                                            const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const items = getItems(t);
                                            if (items.length === 0) {
                                                return [{
                                                    Time: timeStr,
                                                    Product: t.productName || 'Custom',
                                                    Qty: t.quantity || 1,
                                                    Payment: t.paymentMethod?.toUpperCase() || '',
                                                    Amount: (t.price || 0) * (t.quantity || 1),
                                                }];
                                            }
                                            return items.map(it => ({
                                                Time: timeStr,
                                                Product: it.productName,
                                                Qty: it.quantity,
                                                Payment: t.paymentMethod?.toUpperCase() || '',
                                                Amount: it.price * it.quantity,
                                            }));
                                        });
                                        const ws = XLSX.utils.json_to_sheet(rows);
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, 'Day');
                                        XLSX.writeFile(wb, `${emp.name}_${selectedDay}.xlsx`);
                                    }}
                                    className="flex items-center gap-1.5 bg-surface2 hover:bg-surface3 text-textSecondary hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-border transition-all"
                                >
                                    <Download size={13} /> Excel
                                </button>
                                <button
                                    onClick={() => {
                                        const doc = new jsPDF();
                                        doc.setFontSize(14);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text(`${emp.name} — Day Report`, 14, 18);
                                        doc.setFontSize(9);
                                        doc.setFont('helvetica', 'normal');
                                        doc.setTextColor(120, 120, 120);
                                        doc.text(`Date: ${selectedDay}`, 14, 26);
                                        const dayTips = dayData.dayTx.reduce((s: number, t: any) => s + (t.tip || 0), 0);
                                        doc.text(`Total Sales: $${dayData.dayRevenue.toFixed(2)}  |  Tips: $${dayTips.toFixed(2)}  |  Orders: ${dayData.dayTx.length}`, 14, 32);
                                        doc.setTextColor(0, 0, 0);

                                        const tableBody = dayData.dayTx.flatMap(t => {
                                            const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const items = getItems(t);
                                            if (items.length === 0) {
                                                return [[
                                                    timeStr,
                                                    t.productName || 'Custom',
                                                    t.quantity || 1,
                                                    t.paymentMethod?.toUpperCase() || '',
                                                    `$${((t.price || 0) * (t.quantity || 1)).toFixed(2)}`
                                                ]];
                                            }
                                            return items.map(it => [
                                                timeStr,
                                                it.productName,
                                                it.quantity,
                                                t.paymentMethod?.toUpperCase() || '',
                                                `$${(it.price * it.quantity).toFixed(2)}`
                                            ]);
                                        });

                                        autoTable(doc, {
                                            startY: 38,
                                            head: [['Time', 'Product', 'Qty', 'Payment', 'Amount']],
                                            body: tableBody,
                                            styles: { fontSize: 8, cellPadding: 3 },
                                            headStyles: { fillColor: [10, 132, 255], textColor: 255, fontStyle: 'bold' },
                                            alternateRowStyles: { fillColor: [245, 245, 245] },
                                            foot: [['', '', '', 'Total Sales', `$${dayData.dayRevenue.toFixed(2)}`]],
                                            footStyles: { fontStyle: 'bold', fillColor: [230, 230, 230] },
                                        });
                                        doc.save(`${emp.name}_${selectedDay}.pdf`);
                                    }}
                                    className="flex items-center gap-1.5 bg-surface2 hover:bg-surface3 text-textSecondary hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-border transition-all"
                                >
                                    <FileText size={13} /> PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {dayData.dayTx.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <p className="text-3xl mb-3">😴</p>
                            <p className="text-white font-semibold">No sales on {formatShortDate(selectedDay)}</p>
                            <p className="text-textSecondary text-sm mt-1">It was a day off, or no transactions were recorded.</p>
                        </div>
                    ) : (
                        <>
                            {/* Day KPIs */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total Revenue', value: formatCurrency(dayData.dayRevenue), color: 'text-blue' },
                                    { label: 'Transactions', value: String(dayData.dayTx.length), color: 'text-green' },
                                    { label: 'Avg / Sale', value: formatCurrency(dayData.dayRevenue / dayData.dayTx.length), color: 'text-purple' },
                                    {
                                        label: 'vs Avg Day', value: (overview.avgSale > 0
                                            ? ((dayData.dayRevenue / dayData.dayTx.length / overview.avgSale - 1) * 100).toFixed(0) + '%'
                                            : '—'), color: 'text-orange'
                                    },
                                ].map(s => (
                                    <div key={s.label} className="glass-card p-4 text-center">
                                        <p className={`${s.color} font-bold text-xl tabular-nums`}>{s.value}</p>
                                        <p className="text-textSecondary text-xs mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Category → Items breakdown */}
                            <div className="glass-card p-5">
                                <p className="text-white font-semibold text-sm mb-4">
                                    Sales by Category &amp; Item on {formatShortDate(selectedDay)}
                                </p>
                                <div className="space-y-5">
                                    {dayData.categories.map((cat, ci) => (
                                        <div key={cat.cat}>
                                            {/* Category header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[ci % CATEGORY_COLORS.length] }} />
                                                    <span className="text-white font-semibold capitalize">{cat.cat}</span>
                                                    <span className="text-textTertiary text-xs">{cat.qty} units</span>
                                                </div>
                                                <span className="text-blue font-bold tabular-nums">{formatCurrency(cat.revenue)}</span>
                                            </div>
                                            {/* Items in this category */}
                                            <div className="ml-5 space-y-1.5">
                                                {cat.items.map(item => (
                                                    <div key={item.name} className="flex items-center justify-between py-1.5 px-3 bg-surface2 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white text-sm">{item.name}</span>
                                                            <span className="text-xs text-textTertiary bg-surface3 px-2 py-0.5 rounded-full">×{item.qty}</span>
                                                        </div>
                                                        <span className="text-textSecondary text-sm tabular-nums">{formatCurrency(item.revenue)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <PaymentBreakdown pay={dayData.pay} />

                            {/* Raw transactions */}
                            <div className="glass-card p-5">
                                <p className="text-white font-semibold text-sm mb-4">All Transactions ({dayData.dayTx.length})</p>
                                <div className="space-y-2">
                                    {dayData.dayTx.map((t, i) => {
                                        const items = getItems(t);
                                        return (
                                            <div key={t.id} className="bg-surface2 rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-textTertiary text-xs font-mono">#{i + 1}</span>
                                                        <span className="text-xs text-textSecondary uppercase bg-surface3 px-2 py-0.5 rounded-full">
                                                            {t.paymentMethod}
                                                        </span>
                                                    </div>
                                                    <span className="text-blue font-bold text-sm tabular-nums">{formatCurrency(t.totalAmount)}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {items.map((item, j) => (
                                                        <span key={j} className="text-xs text-textSecondary bg-surface3 px-2 py-0.5 rounded-lg">
                                                            {item.productName} ×{item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── MONTH REPORT ── */}
            {view === 'month' && (
                <div className="space-y-4 fade-in">
                    {/* Month selector */}
                    <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
                        <label className="text-textSecondary text-sm font-semibold">Select Month</label>
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-surface2 text-white text-sm rounded-xl px-3 py-2 border border-surface3 focus:border-blue focus:outline-none"
                        >
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonthLabel(m)}</option>
                            ))}
                        </select>
                        {monthData.monthTx.length > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => {
                                        const rows = monthData.monthTx.flatMap((t: any) => {
                                            const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const items = getItems(t);
                                            if (items.length === 0) {
                                                return [{
                                                    Date: t.date,
                                                    Time: timeStr,
                                                    Product: t.productName || 'Custom',
                                                    Qty: t.quantity || 1,
                                                    Payment: t.paymentMethod?.toUpperCase() || '',
                                                    Amount: (t.price || 0) * (t.quantity || 1),
                                                }];
                                            }
                                            return items.map(it => ({
                                                Date: t.date,
                                                Time: timeStr,
                                                Product: it.productName,
                                                Qty: it.quantity,
                                                Payment: t.paymentMethod?.toUpperCase() || '',
                                                Amount: it.price * it.quantity,
                                            }));
                                        });
                                        const ws = XLSX.utils.json_to_sheet(rows);
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, 'Month');
                                        XLSX.writeFile(wb, `${emp.name}_${selectedMonth}.xlsx`);
                                    }}
                                    className="flex items-center gap-1.5 bg-surface2 hover:bg-surface3 text-textSecondary hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-border transition-all"
                                >
                                    <Download size={13} /> Excel
                                </button>
                                <button
                                    onClick={() => {
                                        const monthTotal = monthData.monthTx.reduce((s: number, t: any) => s + (t.totalAmount || 0), 0);
                                        const monthTips = monthData.monthTx.reduce((s: number, t: any) => s + (t.tip || 0), 0);
                                        const doc = new jsPDF();
                                        doc.setFontSize(14);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text(`${emp.name} — Month Report`, 14, 18);
                                        doc.setFontSize(9);
                                        doc.setFont('helvetica', 'normal');
                                        doc.setTextColor(120, 120, 120);
                                        doc.text(`Month: ${selectedMonth}`, 14, 26);
                                        doc.text(`Total Sales: $${monthTotal.toFixed(2)}  |  Tips: $${monthTips.toFixed(2)}  |  Orders: ${monthData.monthTx.length}`, 14, 32);
                                        doc.setTextColor(0, 0, 0);

                                        const tableBody = monthData.monthTx.flatMap((t: any) => {
                                            const items = getItems(t);
                                            if (items.length === 0) {
                                                return [[
                                                    t.date,
                                                    t.productName || 'Custom',
                                                    t.quantity || 1,
                                                    t.paymentMethod?.toUpperCase() || '',
                                                    `$${((t.price || 0) * (t.quantity || 1)).toFixed(2)}`
                                                ]];
                                            }
                                            return items.map(it => [
                                                t.date,
                                                it.productName,
                                                it.quantity,
                                                t.paymentMethod?.toUpperCase() || '',
                                                `$${(it.price * it.quantity).toFixed(2)}`
                                            ]);
                                        });

                                        autoTable(doc, {
                                            startY: 38,
                                            head: [['Date', 'Product', 'Qty', 'Payment', 'Amount']],
                                            body: tableBody,
                                            styles: { fontSize: 8, cellPadding: 3 },
                                            headStyles: { fillColor: [10, 132, 255], textColor: 255, fontStyle: 'bold' },
                                            alternateRowStyles: { fillColor: [245, 245, 245] },
                                            foot: [['', '', '', 'Total Sales', `$${monthTotal.toFixed(2)}`]],
                                            footStyles: { fontStyle: 'bold', fillColor: [230, 230, 230] },
                                        });
                                        doc.save(`${emp.name}_${selectedMonth}.pdf`);
                                    }}
                                    className="flex items-center gap-1.5 bg-surface2 hover:bg-surface3 text-textSecondary hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-border transition-all"
                                >
                                    <FileText size={13} /> PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {monthData.monthTx.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <p className="text-3xl mb-3">📭</p>
                            <p className="text-white font-semibold">No sales in {formatMonthLabel(selectedMonth)}</p>
                        </div>
                    ) : (
                        <>
                            {/* Month KPIs */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Month Revenue', value: formatCurrency(monthData.monthRevenue), color: 'text-blue' },
                                    { label: 'Working Days', value: `${monthData.workingDays}`, color: 'text-green' },
                                    { label: 'Avg / Day', value: formatCurrency(monthData.workingDays > 0 ? monthData.monthRevenue / monthData.workingDays : 0), color: 'text-purple' },
                                    { label: 'Best Day', value: monthData.bestDay?.revenue > 0 ? formatCurrency(monthData.bestDay.revenue) : '$0', color: 'text-yellow' },
                                ].map(s => (
                                    <div key={s.label} className="glass-card p-4 text-center">
                                        <p className={`${s.color} font-bold text-xl tabular-nums`}>{s.value}</p>
                                        <p className="text-textSecondary text-xs mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Daily bar chart */}
                            <div className="glass-card p-5">
                                <p className="text-white font-semibold text-sm mb-4">Daily Revenue — {formatMonthLabel(selectedMonth)}</p>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={monthData.dailyChart} barSize={10}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#38383a" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: '#98989d', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                                        <YAxis tick={{ fill: '#98989d', fontSize: 10 }} axisLine={false} tickLine={false}
                                            tickFormatter={v => '$' + v} width={45} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(10,132,255,0.08)' }} />
                                        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                            {monthData.dailyChart.map((entry, i) => (
                                                <Cell key={i} fill={entry.date === monthData.bestDay?.date ? '#ffd60a' : '#0a84ff'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                {monthData.bestDay?.revenue > 0 && (
                                    <p className="text-textTertiary text-xs mt-2">
                                        🟡 Gold bar = best day ({formatShortDate(monthData.bestDay.date)}: {formatCurrency(monthData.bestDay.revenue)})
                                    </p>
                                )}
                            </div>

                            {/* Daily table */}
                            <div className="glass-card p-5">
                                <p className="text-white font-semibold text-sm mb-4">Day-by-Day Breakdown</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-textTertiary text-xs uppercase tracking-wide border-b border-surface2">
                                                <th className="py-2 text-left pr-4">Date</th>
                                                <th className="py-2 text-right pr-4">Revenue</th>
                                                <th className="py-2 text-right pr-4">Transactions</th>
                                                <th className="py-2 text-right">Avg / Sale</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthData.dailyChart.filter(d => d.revenue > 0).map(d => (
                                                <tr key={d.date} className="border-b border-surface2/50 hover:bg-surface2/50 transition-colors">
                                                    <td className="py-2.5 pr-4">
                                                        <button
                                                            onClick={() => { setSelectedDay(d.date); setView('day'); }}
                                                            className="text-white hover:text-blue transition-colors font-medium"
                                                        >
                                                            {formatShortDate(d.date)}
                                                        </button>
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-blue font-bold tabular-nums">{formatCurrency(d.revenue)}</td>
                                                    <td className="py-2.5 pr-4 text-right text-textSecondary tabular-nums">{d.txCount}</td>
                                                    <td className="py-2.5 text-right text-purple tabular-nums">
                                                        {d.txCount > 0 ? formatCurrency(d.revenue / d.txCount) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <CategoryBreakdown categories={monthData.categories} totalRevenue={monthData.monthRevenue} />
                                <PaymentBreakdown pay={monthData.pay} />
                            </div>
                            <TopProducts products={monthData.topProducts} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
import { useParttime } from '@/lib/ParttimeContext';

export default function EmployeesPage() {
    const { activeParttime } = useParttime();
    const { transactions, loading: txLoading } = useTransactions(activeParttime?.id);
    const [selectedUid, setSelectedUid] = useState<string | null>(null);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminLoading, setAdminLoading] = useState(true);

    useEffect(() => {
        if (!activeParttime) {
            setAdminUsers([]);
            setAdminLoading(false);
            return;
        }
        setAdminLoading(true);
        const unsub = subscribeAdminUsers(activeParttime.id, (data) => {
            setAdminUsers(data);
            setAdminLoading(false);
        });
        return unsub;
    }, [activeParttime]);

    const employees = useMemo<Employee[]>(() => {
        const map: Record<string, Employee> = {};

        // Seed with all whitelisted employees (even those with no sales yet)
        for (const u of adminUsers) {
            map[u.uid] = {
                uid: u.uid,
                name: u.name || u.email,
                totalRevenue: 0, totalTips: 0, totalTx: 0,
                firstSeen: '', lastSeen: '',
            };
        }

        // Layer in transaction data
        transactions.forEach(t => {
            if (!t.userId) return;
            if (!map[t.userId]) {
                map[t.userId] = {
                    uid: t.userId,
                    name: t.userName || 'Unknown',
                    totalRevenue: 0, totalTips: 0, totalTx: 0,
                    firstSeen: t.date || '',
                    lastSeen: t.date || '',
                };
            }
            map[t.userId].totalRevenue += t.totalAmount || 0;
            map[t.userId].totalTips += t.tip || 0;
            map[t.userId].totalTx += 1;
            if (t.date && (!map[t.userId].firstSeen || t.date < map[t.userId].firstSeen)) map[t.userId].firstSeen = t.date;
            if (t.date && t.date > map[t.userId].lastSeen) map[t.userId].lastSeen = t.date;
        });

        return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [adminUsers, transactions]);

    const loading = txLoading || adminLoading;

    if (loading) return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;

    return (
        <AppShell>
            {selectedUid ? (
                <EmployeeDetail
                    uid={selectedUid}
                    employees={employees}
                    transactions={transactions}
                    onBack={() => setSelectedUid(null)}
                />
            ) : employees.length === 0 ? (
                <div className="p-6">
                    <EmptyState icon="👥" message="No employee data yet. Sales will appear here once recorded." />
                </div>
            ) : (
                <EmployeeList
                    employees={employees}
                    transactions={transactions}
                    onSelect={setSelectedUid}
                />
            )}
        </AppShell>
    );
}
