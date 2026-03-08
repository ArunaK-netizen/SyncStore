'use client';
import AppShell from '@/components/AppShell';
import { Badge, EmptyState, formatCurrency, LoadingSpinner, PageHeader } from '@/components/UI';
import { AccessRequest, addAdminEmail, addAdminUser, AdminUser, approveAccessRequest, rejectAccessRequest, removeAdminEmail, removeAdminUser, subscribeAccessRequests, subscribeAdminEmails, subscribeAdminUsers } from '@/lib/db';
import { useTransactions } from '@/lib/hooks';
import { Plus, Shield, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useParttime } from '@/lib/ParttimeContext';

export default function UsersPage() {
    const { activeParttime } = useParttime();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminEmails, setAdminEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ email: '', name: '', uid: '' });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'whitelist' | 'admins' | 'employees'>('whitelist');
    const { transactions, loading: txLoading } = useTransactions(activeParttime?.id);

    // Access requests
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [actioningRequest, setActioningRequest] = useState<string | null>(null);

    // Admin email form
    const [adminEmailInput, setAdminEmailInput] = useState('');
    const [adminEmailSaving, setAdminEmailSaving] = useState(false);
    const [confirmRemoveEmail, setConfirmRemoveEmail] = useState<string | null>(null);

    useEffect(() => {
        if (!activeParttime) {
            setAdminUsers([]);
            setAdminEmails([]);
            setAccessRequests([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsub1 = subscribeAdminUsers(activeParttime.id, (data) => {
            setAdminUsers(data);
            setLoading(false);
        });
        const unsub2 = subscribeAdminEmails(activeParttime.id, (emails) => {
            setAdminEmails(emails);
        });
        const unsub3 = subscribeAccessRequests(activeParttime.id, (data) => {
            setAccessRequests(data);
        });
        return () => { unsub1(); unsub2(); unsub3(); };
    }, [activeParttime]);

    const employeesFromTx = useMemo(() => {
        const map: Record<string, { uid: string; name: string; revenue: number; txCount: number; lastDate: string }> = {};
        for (const t of transactions) {
            if (!t.userId) continue;
            if (!map[t.userId]) {
                map[t.userId] = { uid: t.userId, name: t.userName || 'Unknown', revenue: 0, txCount: 0, lastDate: t.date || '' };
            }
            map[t.userId].revenue += t.totalAmount || 0;
            map[t.userId].txCount += 1;
            if (t.date > map[t.userId].lastDate) map[t.userId].lastDate = t.date;
        }
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [transactions]);

    const getLastSale = (uid: string) => {
        const userTxs = transactions.filter(t => t.userId === uid);
        if (userTxs.length === 0) return null;
        return userTxs.sort((a, b) => b.timestamp - a.timestamp)[0];
    };

    const getTotalRevenue = (uid: string) =>
        transactions.filter(t => t.userId === uid).reduce((s, t) => s + (t.totalAmount || 0), 0);

    const handleAdd = async () => {
        if (!form.email || !activeParttime) return;
        setSaving(true);
        try {
            await addAdminUser(activeParttime.id, {
                uid: form.uid.trim() || form.email.trim(),
                email: form.email.trim(),
                name: form.name.trim(),
                addedAt: Date.now(),
            });
            setForm({ email: '', name: '', uid: '' });
            setShowAdd(false);
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!activeParttime) return;
        if (confirmDelete !== id) { setConfirmDelete(id); return; }
        await removeAdminUser(activeParttime.id, id);
        setConfirmDelete(null);
    };

    const handleAddAdminEmail = async () => {
        const email = adminEmailInput.trim().toLowerCase();
        if (!email || !email.includes('@') || !activeParttime) return;
        setAdminEmailSaving(true);
        try {
            await addAdminEmail(activeParttime.id, email);
            setAdminEmailInput('');
        } finally {
            setAdminEmailSaving(false);
        }
    };

    const handleApprove = async (req: AccessRequest) => {
        if (!activeParttime) return;
        setActioningRequest(req.id);
        try { await approveAccessRequest(activeParttime.id, req); } finally { setActioningRequest(null); }
    };

    const handleReject = async (req: AccessRequest) => {
        if (!activeParttime) return;
        setActioningRequest(req.id);
        try { await rejectAccessRequest(activeParttime.id, req.id); } finally { setActioningRequest(null); }
    };

    const handleRemoveAdminEmail = async (email: string) => {
        if (!activeParttime) return;
        if (confirmRemoveEmail !== email) { setConfirmRemoveEmail(email); return; }
        await removeAdminEmail(activeParttime.id, email);
        setConfirmRemoveEmail(null);
    };

    if (loading || txLoading) return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;

    return (
        <AppShell>
            <div className="p-6 max-w-5xl mx-auto">
                <PageHeader
                    title="User Management"
                    subtitle="Manage approved employees, admin access, and view active staff"
                    action={
                        activeTab === 'whitelist' ? (
                            <button
                                onClick={() => setShowAdd(true)}
                                className="flex items-center gap-2 bg-blue hover:bg-blue/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
                            >
                                <Plus size={16} /> Add Employee
                            </button>
                        ) : null
                    }
                />

                {/* Tabs */}
                <div className="flex gap-1 mb-5 bg-surface2 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setActiveTab('whitelist')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'whitelist' ? 'bg-blue text-white' : 'text-textSecondary hover:text-white'}`}
                    >
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} /> Mobile Whitelist ({adminUsers.length})
                            {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="bg-red text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                    {accessRequests.filter(r => r.status === 'pending').length}
                                </span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'admins' ? 'bg-purple text-white' : 'text-textSecondary hover:text-white'}`}
                    >
                        <span className="flex items-center gap-1.5"><Shield size={14} /> Admin Access ({adminEmails.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'employees' ? 'bg-green text-white' : 'text-textSecondary hover:text-white'}`}
                    >
                        <span className="flex items-center gap-1.5"><Users size={14} /> Active ({employeesFromTx.length})</span>
                    </button>
                </div>

                {/* ── MOBILE WHITELIST ── */}
                {activeTab === 'whitelist' && (
                    <>
                        <div className="glass-card p-4 mb-4 border-blue/20 bg-blue/5">
                            <div className="flex gap-3">
                                <ShieldCheck size={18} className="text-blue flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-white text-sm font-semibold mb-1">Mobile App Whitelist</p>
                                    <p className="text-textSecondary text-xs">
                                        Only employees listed here can sign in to the mobile app. New sign-in requests appear below for your approval.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Access Requests Queue ── */}
                        {accessRequests.length > 0 && (
                            <div className="glass-card overflow-hidden mb-5">
                                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-semibold text-sm">Access Requests</p>
                                        {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                                            <span className="bg-red text-white text-xs font-bold rounded-full px-2 py-0.5">
                                                {accessRequests.filter(r => r.status === 'pending').length} pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-border/50">
                                    {accessRequests.map(req => (
                                        <div key={req.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface2/30 transition-colors">
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {req.name.charAt(0).toUpperCase()}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{req.name}</p>
                                                <p className="text-textTertiary text-xs truncate">{req.email}</p>
                                                <p className="text-textTertiary text-xs">
                                                    {new Date(req.requestedAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {/* Status / actions */}
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleApprove(req)}
                                                        disabled={actioningRequest === req.id}
                                                        className="flex items-center gap-1.5 bg-green/15 hover:bg-green/25 text-green text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                                    >
                                                        {actioningRequest === req.id ? '…' : '✓ Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(req)}
                                                        disabled={actioningRequest === req.id}
                                                        className="flex items-center gap-1.5 bg-red/10 hover:bg-red/20 text-red text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                                    >
                                                        {actioningRequest === req.id ? '…' : '✕ Reject'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${req.status === 'approved'
                                                    ? 'bg-green/10 text-green'
                                                    : 'bg-red/10 text-red'
                                                    }`}>
                                                    {req.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showAdd && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <div className="glass-card w-full max-w-sm p-6 fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-white font-bold">Add Employee</h2>
                                        <button onClick={() => setShowAdd(false)} className="text-textTertiary hover:text-white transition-colors"><X size={18} /></button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-textSecondary text-xs font-semibold mb-1">Email *</label>
                                            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                placeholder="employee@gmail.com"
                                                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary" />
                                        </div>
                                        <div>
                                            <label className="block text-textSecondary text-xs font-semibold mb-1">Name</label>
                                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                placeholder="Display name"
                                                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary" />
                                        </div>
                                        <div>
                                            <label className="block text-textSecondary text-xs font-semibold mb-1">Firebase UID (optional)</label>
                                            <input value={form.uid} onChange={e => setForm(f => ({ ...f, uid: e.target.value }))}
                                                placeholder="Leave blank to use email as ID"
                                                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary" />
                                        </div>
                                        <button onClick={handleAdd} disabled={saving || !form.email}
                                            className="w-full bg-blue hover:bg-blue/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all mt-2">
                                            {saving ? 'Adding…' : 'Add Employee'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {adminUsers.length === 0 ? (
                            <EmptyState icon="👤" message="No employees added yet. Add your first employee." />
                        ) : (
                            <div className="glass-card overflow-hidden">
                                <table className="w-full min-w-[500px]">
                                    <thead className="border-b border-border">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Employee</th>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Last Sale</th>
                                            <th className="text-right px-5 py-3 text-textTertiary text-xs font-semibold">Total Revenue</th>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Added</th>
                                            <th className="px-5 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminUsers.map((u) => {
                                            const lastSale = getLastSale(u.uid);
                                            const totalRev = getTotalRevenue(u.uid);
                                            return (
                                                <tr key={u.id} className="border-b border-border/50 hover:bg-surface2/40 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center text-blue font-bold text-xs flex-shrink-0">
                                                                {(u.name || u.email)[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-medium text-sm">{u.name || '—'}</p>
                                                                <p className="text-textTertiary text-xs">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-textSecondary text-sm">{lastSale ? lastSale.date : '—'}</td>
                                                    <td className="px-5 py-3 text-right text-blue font-bold text-sm tabular-nums">{formatCurrency(totalRev)}</td>
                                                    <td className="px-5 py-3 text-textSecondary text-xs">
                                                        {u.addedAt ? new Date(u.addedAt).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <button
                                                            onClick={() => handleRemove(u.id)}
                                                            className={`p-1.5 rounded-lg transition-all ${confirmDelete === u.id ? 'bg-red/20 text-red' : 'text-textTertiary hover:text-red hover:bg-red/10'}`}
                                                            title={confirmDelete === u.id ? 'Click again to confirm' : 'Remove Employee'}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ── ADMIN ACCESS ── */}
                {activeTab === 'admins' && (
                    <>
                        <div className="glass-card p-4 mb-5 border-purple/20 bg-purple/5">
                            <div className="flex gap-3">
                                <Shield size={18} className="text-purple flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-white text-sm font-semibold mb-1">Admin Panel Access</p>
                                    <p className="text-textSecondary text-xs">
                                        Only Google accounts with these emails can sign in to this admin dashboard.
                                        Changes take effect on their next login attempt.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Add email row */}
                        <div className="flex gap-2 mb-5">
                            <input
                                type="email"
                                value={adminEmailInput}
                                onChange={e => setAdminEmailInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddAdminEmail()}
                                placeholder="admin@gmail.com"
                                className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple/50 placeholder-textTertiary"
                            />
                            <button
                                onClick={handleAddAdminEmail}
                                disabled={adminEmailSaving || !adminEmailInput.trim() || !adminEmailInput.includes('@')}
                                className="flex items-center gap-2 bg-purple hover:bg-purple/90 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95"
                            >
                                <Plus size={16} />
                                {adminEmailSaving ? 'Adding…' : 'Add Admin'}
                            </button>
                        </div>

                        {adminEmails.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <p className="text-3xl mb-3">🔐</p>
                                <p className="text-white font-semibold mb-1">No admin emails configured</p>
                                <p className="text-textSecondary text-sm">Add at least one email so admins can sign in to this dashboard.</p>
                            </div>
                        ) : (
                            <div className="glass-card overflow-hidden">
                                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                                    <p className="text-textTertiary text-xs font-semibold uppercase tracking-wide">
                                        {adminEmails.length} admin{adminEmails.length !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-textTertiary text-xs">Click trash once → confirms, click again → removes</p>
                                </div>
                                <div className="divide-y divide-border/50">
                                    {adminEmails.map((email) => (
                                        <div key={email} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface2/40 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center text-purple font-bold text-xs flex-shrink-0">
                                                {email[0].toUpperCase()}
                                            </div>
                                            <p className="text-white text-sm flex-1">{email}</p>
                                            <button
                                                onClick={() => handleRemoveAdminEmail(email)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                                    ${confirmRemoveEmail === email
                                                        ? 'bg-red/20 text-red border border-red/30'
                                                        : 'text-textTertiary hover:text-red hover:bg-red/10'}`}
                                                title={confirmRemoveEmail === email ? 'Click again to confirm removal' : 'Remove admin access'}
                                            >
                                                <Trash2 size={13} />
                                                {confirmRemoveEmail === email ? 'Confirm remove' : ''}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── ACTIVE EMPLOYEES ── */}
                {activeTab === 'employees' && (
                    <>
                        <div className="glass-card p-4 mb-4 border-green/20 bg-green/5">
                            <div className="flex gap-3">
                                <Users size={18} className="text-green flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-white text-sm font-semibold mb-1">Active Employees</p>
                                    <p className="text-textSecondary text-xs">
                                        These employees have recorded sales through the mobile app. Derived from transaction history.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {employeesFromTx.length === 0 ? (
                            <EmptyState icon="👥" message="No employee activity found. Once employees record sales, they'll appear here." />
                        ) : (
                            <div className="glass-card overflow-hidden">
                                <table className="w-full min-w-[500px]">
                                    <thead className="border-b border-border">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Employee</th>
                                            <th className="text-left px-5 py-3 text-textTertiary text-xs font-semibold">Last Sale</th>
                                            <th className="text-center px-5 py-3 text-textTertiary text-xs font-semibold">Transactions</th>
                                            <th className="text-right px-5 py-3 text-textTertiary text-xs font-semibold">Total Revenue</th>
                                            <th className="text-right px-5 py-3 text-textTertiary text-xs font-semibold">Avg Sale</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employeesFromTx.map((emp, idx) => (
                                            <tr key={emp.uid} className="border-b border-border/50 hover:bg-surface2/40 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${idx === 0 ? 'bg-yellow/20 text-yellow' : 'bg-surface2 text-textSecondary'}`}>
                                                            {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-white font-medium text-sm">{emp.name}</p>
                                                                {idx === 0 && <Badge color="orange">🏆 Top</Badge>}
                                                            </div>
                                                            <p className="text-textTertiary text-xs">{emp.uid}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-textSecondary text-sm">{emp.lastDate || '—'}</td>
                                                <td className="px-5 py-3 text-center text-textSecondary text-sm">{emp.txCount}</td>
                                                <td className="px-5 py-3 text-right text-blue font-bold text-sm tabular-nums">{formatCurrency(emp.revenue)}</td>
                                                <td className="px-5 py-3 text-right text-textSecondary text-sm tabular-nums">
                                                    {formatCurrency(emp.txCount > 0 ? emp.revenue / emp.txCount : 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppShell>
    );
}
