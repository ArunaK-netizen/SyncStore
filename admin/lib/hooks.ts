'use client';
import { Product, subscribeProducts, subscribeTransactions, Transaction } from '@/lib/db';
import { useEffect, useState } from 'react';

export function useTransactions(parttimeId: string | undefined) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!parttimeId) {
            setTransactions([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsub = subscribeTransactions(parttimeId, (data) => {
            setTransactions(data);
            setLoading(false);
        });
        return unsub;
    }, [parttimeId]);

    return { transactions, loading };
}

export function useProducts(parttimeId: string | undefined) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!parttimeId) {
            setProducts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsub = subscribeProducts(parttimeId, (data) => {
            setProducts(data);
            setLoading(false);
        });
        return unsub;
    }, [parttimeId]);

    return { products, loading };
}

// Derived analytics from transactions
export function useAnalytics(transactions: Transaction[]) {
    const totalRevenue = transactions.reduce((s, t) => s + (t.totalAmount || 0), 0);
    const totalTips = transactions.reduce((s, t) => s + (t.tip || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = transactions
        .filter(t => t.date === today)
        .reduce((s, t) => s + (t.totalAmount || 0), 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayRevenue = transactions
        .filter(t => t.date === yesterdayStr)
        .reduce((s, t) => s + (t.totalAmount || 0), 0);

    const month = today.slice(0, 7);
    const monthRevenue = transactions
        .filter(t => t.date?.startsWith(month))
        .reduce((s, t) => s + (t.totalAmount || 0), 0);

    // This week (Mon–today) vs last week same span
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1; // 0=Mon
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekRevenue = transactions
        .filter(t => t.date >= weekStartStr && t.date <= today)
        .reduce((s, t) => s + (t.totalAmount || 0), 0);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(weekStart.getDate() - 7 + dayOfWeek);
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];
    const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0];
    const lastWeekRevenue = transactions
        .filter(t => t.date >= lastWeekStartStr && t.date <= lastWeekEndStr)
        .reduce((s, t) => s + (t.totalAmount || 0), 0);

    const avgOrderValue = transactions.length > 0 ? (transactions.reduce((s, t) => s + (t.totalAmount || 0), 0) / transactions.length) : 0;

    // Employees from unique userId
    const employeeMap: Record<string, { name: string; revenue: number; txCount: number }> = {};
    for (const t of transactions) {
        if (!t.userId) continue;
        if (!employeeMap[t.userId]) {
            employeeMap[t.userId] = { name: t.userName || 'Unknown', revenue: 0, txCount: 0 };
        }
        employeeMap[t.userId].revenue += t.totalAmount || 0;
        employeeMap[t.userId].txCount += 1;
    }
    const employees = Object.entries(employeeMap).map(([uid, v]) => ({ uid, ...v }));

    // Monthly best employee
    const monthTxs = transactions.filter(t => t.date?.startsWith(month));
    const monthEmpMap: Record<string, { name: string; revenue: number }> = {};
    for (const t of monthTxs) {
        if (!t.userId) continue;
        if (!monthEmpMap[t.userId]) monthEmpMap[t.userId] = { name: t.userName || 'Unknown', revenue: 0 };
        monthEmpMap[t.userId].revenue += t.totalAmount || 0;
    }
    const monthlyBest = Object.entries(monthEmpMap)
        .map(([uid, v]) => ({ uid, ...v }))
        .sort((a, b) => b.revenue - a.revenue)[0];

    // Top products by revenue
    const productRevMap: Record<string, { name: string; revenue: number; qty: number; category: string }> = {};
    for (const t of transactions) {
        const items = t.items || (t.productName ? [{ productName: t.productName, category: t.category || '', price: t.price || 0, quantity: t.quantity || 1, id: '' }] : []);
        for (const item of items) {
            const key = item.productName;
            if (!productRevMap[key]) productRevMap[key] = { name: key, revenue: 0, qty: 0, category: item.category };
            productRevMap[key].revenue += item.price * item.quantity;
            productRevMap[key].qty += item.quantity;
        }
    }
    const topProducts = Object.values(productRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Last 7 days revenue
    const last7: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const rev = transactions.filter(t => t.date === dateStr).reduce((s, t) => s + (t.totalAmount || 0), 0);
        last7.push({ date: dateStr, revenue: rev });
    }

    // Monthly revenue (last 12 months)
    const monthly: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.toISOString().slice(0, 7);
        const rev = transactions.filter(t => t.date?.startsWith(m)).reduce((s, t) => s + (t.totalAmount || 0), 0);
        monthly.push({ month: m, revenue: rev });
    }

    // Payment method breakdown
    const paymentBreakdown = { cash: 0, card: 0, upi: 0 };
    for (const t of transactions) {
        if (t.paymentMethod === 'cash') paymentBreakdown.cash += t.totalAmount || 0;
        else if (t.paymentMethod === 'card') paymentBreakdown.card += t.totalAmount || 0;
        else if (t.paymentMethod === 'upi') paymentBreakdown.upi += t.totalAmount || 0;
    }

    return {
        totalRevenue, totalTips, todayRevenue, yesterdayRevenue,
        weekRevenue, lastWeekRevenue, avgOrderValue,
        monthRevenue, employees, monthlyBest, topProducts,
        last7, monthly, paymentBreakdown,
    };
}
