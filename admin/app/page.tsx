'use client';
import AppShell from '@/components/AppShell';
import { formatCurrency, formatShortDate, LoadingSpinner } from '@/components/UI';
import { useAnalytics, useTransactions } from '@/lib/hooks';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, DollarSign, ShoppingBag, TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';

function Delta({ current, previous, label }: { current: number; previous: number; label?: string }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-green' : 'text-red'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}%{label ? ` vs ${label}` : ''}
    </span>
  );
}

import { useParttime } from '@/lib/ParttimeContext';

export default function HomePage() {
  const { activeParttime } = useParttime();
  const { transactions, loading } = useTransactions(activeParttime?.id);
  const analytics = useAnalytics(transactions);

  // ALL hooks must be declared before any conditional return
  const [dayOffset, setDayOffset] = useState(0);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i) - dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      const rev = transactions.filter(t => t.date === dateStr).reduce((s, t) => s + (t.totalAmount || 0), 0);
      return { date: dateStr, revenue: rev };
    });
  }, [transactions, dayOffset]);

  const chartLabel = useMemo(() => {
    const start = chartData[0]?.date;
    const end = chartData[6]?.date;
    if (!start || !end) return '';
    const fmt = (d: string) => {
      const [, m, day] = d.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(m) - 1]} ${parseInt(day)}`;
    };
    return `${fmt(start)} – ${fmt(end)}`;
  }, [chartData]);

  if (loading) {
    return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;
  }

  const today = format(new Date(), 'EEEE, MMMM do');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card px-3 py-2 border border-blue/20">
          <p className="text-textSecondary text-xs mb-1">{label}</p>
          <p className="text-blue font-bold text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const kpis = [
    {
      label: "Today's Revenue",
      value: formatCurrency(analytics.todayRevenue),
      icon: <Zap size={16} />,
      color: 'text-blue',
      delta: <Delta current={analytics.todayRevenue} previous={analytics.yesterdayRevenue} label="yesterday" />,
    },
    {
      label: 'This Week',
      value: formatCurrency(analytics.weekRevenue),
      icon: <TrendingUp size={16} />,
      color: 'text-green',
      delta: <Delta current={analytics.weekRevenue} previous={analytics.lastWeekRevenue} label="last week" />,
    },
    {
      label: 'This Month',
      value: formatCurrency(analytics.monthRevenue),
      icon: <DollarSign size={16} />,
      color: 'text-purple',
      delta: null,
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(analytics.avgOrderValue),
      icon: <ShoppingBag size={16} />,
      color: 'text-orange',
      delta: <span className="text-textTertiary text-xs">{transactions.length} total txns</span>,
    },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Date heading */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
            <p className="text-textSecondary text-sm mt-0.5">{today}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {kpis.map((k) => (
            <div key={k.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-textSecondary text-xs font-semibold uppercase tracking-wider">{k.label}</p>
                <div className="w-7 h-7 rounded-lg bg-surface2 flex items-center justify-center text-textTertiary">
                  {k.icon}
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
              <div className="mt-1.5 h-4">{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Chart + Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

          {/* 7-Day Revenue — navigable */}
          <div className="lg:col-span-2 glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <p className="text-white font-semibold text-sm">7-Day Revenue</p>
              <div className="flex items-center gap-1">
                {dayOffset > 0 && (
                  <button onClick={() => setDayOffset(0)} className="px-2 py-1 rounded-lg text-xs text-blue bg-blue/10 font-semibold mr-1">Today</button>
                )}
                <button onClick={() => setDayOffset((o: number) => o + 1)} className="p-1 rounded-lg text-textTertiary hover:text-white hover:bg-surface2 transition-all">
                  <ChevronLeft size={15} />
                </button>
                <span className="text-textTertiary text-xs px-1 min-w-[120px] text-center">{chartLabel}</span>
                <button onClick={() => setDayOffset((o: number) => Math.max(0, o - 1))} disabled={dayOffset === 0} className="p-1 rounded-lg text-textTertiary hover:text-white hover:bg-surface2 disabled:opacity-30 transition-all">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0" style={{ minHeight: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: '#636366', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#636366', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => '$' + v}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(10,132,255,0.08)' }} />
                  <Bar dataKey="revenue" fill="#0a84ff" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <p className="text-white font-semibold text-sm">Quick Insights</p>

            {analytics.monthlyBest && (
              <div className="bg-surface2 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Trophy size={13} className="text-yellow" />
                  <p className="text-yellow text-xs font-semibold">Month's Star</p>
                </div>
                <p className="text-white font-bold text-sm truncate">{analytics.monthlyBest.name}</p>
                <p className="text-green text-xs font-medium mt-0.5">{formatCurrency(analytics.monthlyBest.revenue)}</p>
              </div>
            )}

            <div className="bg-surface2 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users size={13} className="text-blue" />
                <p className="text-textSecondary text-xs font-semibold">Active Employees</p>
              </div>
              <p className="text-white font-bold text-xl">{analytics.employees.length}</p>
            </div>

            {analytics.topProducts[0] && (
              <div className="bg-surface2 rounded-xl p-3.5">
                <p className="text-textSecondary text-xs font-semibold mb-1">Top Product</p>
                <p className="text-white font-bold text-sm truncate">{analytics.topProducts[0].name}</p>
                <p className="text-blue text-xs mt-0.5">
                  {analytics.topProducts[0].qty} sold · {formatCurrency(analytics.topProducts[0].revenue)}
                </p>
              </div>
            )}

            {analytics.totalRevenue > 0 && analytics.totalTips > 0 && (
              <div className="bg-surface2 rounded-xl p-3.5">
                <p className="text-textSecondary text-xs font-semibold mb-1">Tip Rate</p>
                <p className="text-orange font-bold text-lg">
                  {((analytics.totalTips / analytics.totalRevenue) * 100).toFixed(1)}%
                </p>
                <p className="text-textTertiary text-xs">{formatCurrency(analytics.totalTips)} in tips</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
