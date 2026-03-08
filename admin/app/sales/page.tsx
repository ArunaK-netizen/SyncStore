'use client';
import React from 'react';
import AppShell from '@/components/AppShell';
import { Badge, EmptyState, formatCurrency, LoadingSpinner, PageHeader } from '@/components/UI';
import { deleteTransaction } from '@/lib/db';
import { useTransactions } from '@/lib/hooks';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, FileText, Search, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// --- Generic custom dropdown ---
function CustomDropdown({ options, value, onChange, placeholder }: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const selected = options.find(o => o.value === value);
    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm text-left transition-colors hover:border-blue/50 focus:outline-none"
            >
                <span className={value === options[0]?.value ? 'text-textSecondary' : 'text-white'}>
                    {selected?.label ?? placeholder ?? 'Select…'}
                </span>
                <ChevronDown size={14} className={`text-textTertiary flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
                    <div className="overflow-y-auto" style={{ maxHeight: '180px' }}>
                        {options.map(opt => (
                            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface2 ${value === opt.value ? 'text-blue font-semibold' : opt.value === options[0]?.value ? 'text-textSecondary' : 'text-white'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


function EmployeeDropdown({ employees, value, onChange }: {
    employees: { uid: string; name: string }[];
    value: string;
    onChange: (uid: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = query
        ? employees.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
        : employees;

    const selectedName = value === 'all' ? 'All Employees' : employees.find(e => e.uid === value)?.name ?? 'All Employees';

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm text-left transition-colors hover:border-blue/50 focus:outline-none"
            >
                <span className={value === 'all' ? 'text-textSecondary' : 'text-white'}>{selectedName}</span>
                <ChevronDown size={14} className={`text-textTertiary flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-2xl overflow-hidden fade-in">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textTertiary" />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search…"
                                className="w-full bg-surface2 text-white text-xs rounded-lg pl-7 pr-3 py-1.5 focus:outline-none placeholder-textTertiary"
                            />
                        </div>
                    </div>
                    {/* Options — max 5 visible, rest scroll */}
                    <div className="overflow-y-auto" style={{ maxHeight: '180px' }}>
                        <button
                            onClick={() => { onChange('all'); setOpen(false); setQuery(''); }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface2 ${value === 'all' ? 'text-blue font-semibold' : 'text-textSecondary'}`}
                        >
                            All Employees
                        </button>
                        {filtered.map(e => (
                            <button
                                key={e.uid}
                                onClick={() => { onChange(e.uid); setOpen(false); setQuery(''); }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface2 ${value === e.uid ? 'text-blue font-semibold' : 'text-white'}`}
                            >
                                {e.name}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-textTertiary text-xs text-center py-4">No employees found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { useParttime } from '@/lib/ParttimeContext';

export default function SalesPage() {
    const { activeParttime } = useParttime();
    const { transactions, loading } = useTransactions(activeParttime?.id);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterPayment, setFilterPayment] = useState('all');
    const [filterEmployee, setFilterEmployee] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    // Pagination
    const PAGE_SIZE = 50;
    const [page, setPage] = useState(0);

    const employees = useMemo(() => {
        const map: Record<string, string> = {};
        for (const t of transactions) {
            if (t.userId && t.userName) map[t.userId] = t.userName;
        }
        return Object.entries(map).map(([uid, name]) => ({ uid, name }));
    }, [transactions]);

    const filtered = useMemo(() => {
        return transactions.filter(t => {
            if (filterPayment !== 'all' && t.paymentMethod !== filterPayment) return false;
            if (filterEmployee !== 'all' && t.userId !== filterEmployee) return false;
            if (filterDateFrom && t.date < filterDateFrom) return false;
            if (filterDateTo && t.date > filterDateTo) return false;
            if (search) {
                const q = search.toLowerCase();
                if (!t.userName?.toLowerCase().includes(q) &&
                    !t.items?.some(i => i.productName.toLowerCase().includes(q))) return false;
            }
            return true;
        });
    }, [transactions, filterPayment, filterEmployee, filterDateFrom, filterDateTo, search]);

    // Reset page when filter changes
    useEffect(() => { setPage(0); }, [filterPayment, filterEmployee, filterDateFrom, filterDateTo, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalFiltered = filtered.reduce((s, t) => s + (t.totalAmount || 0), 0);

    const hasFilters = search || filterPayment !== 'all' || filterEmployee !== 'all' || filterDateFrom || filterDateTo;

    const handleDelete = async (id: string) => {
        if (!activeParttime) return;
        if (confirmDelete !== id) { setConfirmDelete(id); return; }
        setDeleting(id);
        try { await deleteTransaction(activeParttime.id, id); }
        finally { setDeleting(null); setConfirmDelete(null); }
    };

    const exportExcel = () => {
        const rows = filtered.flatMap(t => {
            const timeStr = new Date(t.timestamp || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!t.items || t.items.length === 0) {
                return [{
                    Date: t.date,
                    Time: timeStr,
                    Employee: t.userName || 'Unknown',
                    Product: t.productName || 'Custom',
                    Qty: t.quantity || 1,
                    Payment: t.paymentMethod?.toUpperCase() || '',
                    Amount: (t.price || 0) * (t.quantity || 1),
                }];
            }
            return t.items.map(it => ({
                Date: t.date,
                Time: timeStr,
                Employee: t.userName || 'Unknown',
                Product: it.productName,
                Qty: it.quantity,
                Payment: t.paymentMethod?.toUpperCase() || '',
                Amount: it.price * it.quantity,
            }));
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sales');
        const label = filterDateFrom && filterDateTo
            ? `${filterDateFrom}_to_${filterDateTo}`
            : filterEmployee !== 'all'
                ? employees.find(e => e.uid === filterEmployee)?.name || 'employee'
                : 'all';
        XLSX.writeFile(wb, `sales_${label}.xlsx`);
    };

    const exportPdf = () => {
        const doc = new jsPDF();
        const label = filterDateFrom && filterDateTo
            ? `${filterDateFrom} – ${filterDateTo}`
            : filterEmployee !== 'all'
                ? employees.find(e => e.uid === filterEmployee)?.name || 'All Employees'
                : 'All Employees';
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Rasagna Sales Report', 14, 18);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(`Period: ${label}`, 14, 26);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
        doc.text(`Total Sales: ${formatCurrency(totalFiltered)}  |  Orders: ${filtered.length}`, 14, 38);
        doc.setTextColor(0, 0, 0);

        const tableBody = filtered.flatMap(t => {
            if (!t.items || t.items.length === 0) {
                return [[
                    t.date,
                    t.userName || 'Unknown',
                    t.productName || 'Custom',
                    t.quantity || 1,
                    t.paymentMethod?.toUpperCase() || '',
                    formatCurrency((t.price || 0) * (t.quantity || 1)),
                ]];
            }
            return t.items.map((it: any) => [
                t.date,
                t.userName || 'Unknown',
                it.productName,
                it.quantity,
                t.paymentMethod?.toUpperCase() || '',
                formatCurrency(it.price * it.quantity),
            ]);
        });

        autoTable(doc, {
            startY: 44,
            head: [['Date', 'Employee', 'Product', 'Qty', 'Payment', 'Amount']],
            body: tableBody,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [10, 132, 255], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            foot: [['', '', '', '', 'Total Sales', formatCurrency(totalFiltered)]],
            footStyles: { fontStyle: 'bold', fillColor: [230, 230, 230] },
        });
        const fname = `sales_${label.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(fname);
    };

    if (loading) return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;

    return (
        <AppShell>
            <div className="p-6 max-w-7xl mx-auto">
                <PageHeader
                    title="Sales"
                    subtitle={`${filtered.length} transactions · ${formatCurrency(totalFiltered)}`}
                    action={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportExcel}
                                disabled={filtered.length === 0}
                                className="flex items-center gap-2 bg-surface2 hover:bg-surface3 disabled:opacity-40 text-textSecondary hover:text-white text-sm font-semibold px-4 py-2 rounded-xl border border-border transition-all"
                            >
                                <Download size={15} /> Excel
                            </button>
                            <button
                                onClick={exportPdf}
                                disabled={filtered.length === 0}
                                className="flex items-center gap-2 bg-surface2 hover:bg-surface3 disabled:opacity-40 text-textSecondary hover:text-white text-sm font-semibold px-4 py-2 rounded-xl border border-border transition-all"
                            >
                                <FileText size={15} /> PDF
                            </button>
                        </div>
                    }
                />

                {/* Filters */}
                <div className="glass-card p-4 mb-4">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Search */}
                        <div className="relative lg:col-span-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textTertiary pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search employee or product..."
                                className="w-full bg-surface2 border border-border rounded-xl pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary"
                            />
                        </div>
                        {/* Payment — custom styled dropdown */}
                        <CustomDropdown
                            value={filterPayment}
                            onChange={setFilterPayment}
                            options={[
                                { label: 'All Payments', value: 'all' },
                                { label: 'Cash', value: 'cash' },
                                { label: 'Card', value: 'card' },
                                { label: 'UPI', value: 'upi' },
                            ]}
                        />
                        {/* Searchable employee dropdown */}
                        <EmployeeDropdown
                            employees={employees}
                            value={filterEmployee}
                            onChange={setFilterEmployee}
                        />
                        {/* Date range */}
                        <div className="flex gap-2">
                            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                                className="flex-1 bg-surface2 border border-border rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-blue/50 min-w-0" />
                            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                                className="flex-1 bg-surface2 border border-border rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-blue/50 min-w-0" />
                        </div>
                    </div>
                    {hasFilters && (
                        <button
                            onClick={() => { setSearch(''); setFilterPayment('all'); setFilterEmployee('all'); setFilterDateFrom(''); setFilterDateTo(''); }}
                            className="mt-2 flex items-center gap-1 text-textSecondary hover:text-white text-xs transition-colors"
                        >
                            <X size={12} /> Clear filters
                        </button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <EmptyState icon="🧾" message="No transactions match your filters." />
                ) : (
                    <>
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead className="border-b border-border">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Date</th>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Employee</th>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Items</th>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Payment</th>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Tip</th>
                                            <th className="text-right px-5 py-3 text-textTertiary text-xs font-semibold">Total</th>
                                            <th className="px-5 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map((t) => (
                                            <React.Fragment key={t.id}>
                                                <tr
                                                    className="border-b border-border/50 hover:bg-surface2/40 transition-colors cursor-pointer"
                                                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                                                >
                                                    <td className="px-5 py-3 text-textSecondary text-sm">{t.date}</td>
                                                    <td className="px-5 py-3 text-white text-sm font-medium">{t.userName || 'Unknown'}</td>
                                                    <td className="px-5 py-3 text-textSecondary text-sm">{t.items?.length ?? 1}</td>
                                                    <td className="px-5 py-3">
                                                        <Badge color={t.paymentMethod === 'cash' ? 'green' : t.paymentMethod === 'upi' ? 'blue' : 'orange'}>
                                                            {t.paymentMethod?.toUpperCase()}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5 py-3 text-orange text-sm tabular-nums">{t.tip > 0 ? formatCurrency(t.tip) : '—'}</td>
                                                    <td className="px-5 py-3 text-right text-blue font-bold text-sm tabular-nums">{formatCurrency(t.totalAmount)}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                                                                className={`p-1.5 rounded-lg transition-all ${confirmDelete === t.id ? 'bg-red/20 text-red' : 'text-textTertiary hover:text-red hover:bg-red/10'}`}
                                                            >
                                                                {deleting === t.id ? <div className="w-4 h-4 border border-red border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                                            </button>
                                                            {expanded === t.id ? <ChevronUp size={14} className="text-textTertiary" /> : <ChevronDown size={14} className="text-textTertiary" />}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expanded === t.id && (
                                                    <tr className="bg-surface2/30">
                                                        <td colSpan={7} className="px-5 py-3">
                                                            <div className="space-y-1.5">
                                                                {(t.items && t.items.length > 0 ? t.items : [{
                                                                    id: '', productName: t.productName || 'Unknown', category: t.category || '',
                                                                    price: t.price || 0, quantity: t.quantity || 1
                                                                }]).map((item, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                                        <span className="text-textSecondary">
                                                                            {item.productName}
                                                                            <span className="text-textTertiary ml-2 text-xs">({item.category})</span>
                                                                        </span>
                                                                        <span className="text-white tabular-nums">
                                                                            {item.quantity} × {formatCurrency(item.price)} = <span className="text-blue font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                    className="p-2 rounded-lg bg-surface2 hover:bg-surface3 disabled:opacity-30 text-textSecondary hover:text-white transition-all">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-textSecondary text-sm">
                                    {page + 1} / {totalPages} &nbsp;·&nbsp; {filtered.length} transactions
                                </span>
                                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                                    className="p-2 rounded-lg bg-surface2 hover:bg-surface3 disabled:opacity-30 text-textSecondary hover:text-white transition-all">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppShell>
    );
}
