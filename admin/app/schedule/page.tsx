'use client';
import AppShell from '@/components/AppShell';
import { LoadingSpinner, PageHeader } from '@/components/UI';
import { useAuth } from '@/lib/AuthContext';
import {
    addScheduleEntry,
    deleteScheduleEntry,
    ScheduleEntry,
    subscribeAdminUsers,
    subscribeSchedules,
    updateScheduleEntry,
} from '@/lib/db';
import { useTransactions } from '@/lib/hooks';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit2,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Color palette for employee rows
const EMP_COLORS = [
    { bg: 'bg-blue/15', border: 'border-blue/30', text: 'text-blue', dot: 'bg-blue' },
    { bg: 'bg-green/15', border: 'border-green/30', text: 'text-green', dot: 'bg-green' },
    { bg: 'bg-purple/15', border: 'border-purple/30', text: 'text-purple', dot: 'bg-purple' },
    { bg: 'bg-orange/15', border: 'border-orange/30', text: 'text-orange', dot: 'bg-orange' },
    { bg: 'bg-cyan/15', border: 'border-cyan/30', text: 'text-cyan', dot: 'bg-cyan' },
    { bg: 'bg-red/15', border: 'border-red/30', text: 'text-red', dot: 'bg-red' },
];

function getWeekDates(weekOffset: number): string[] {
    const now = new Date();
    // Go to Monday of current week
    const day = now.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day); // days to Monday
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff + weekOffset * 7);
    mon.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatWeekLabel(dates: string[]) {
    const parse = (d: string) => new Date(d + 'T00:00:00');
    const start = parse(dates[0]);
    const end = parse(dates[6]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (start.getMonth() === end.getMonth()) {
        return `${months[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

interface ShiftFormState {
    employeeUid: string;
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    note: string;
}

const defaultForm: ShiftFormState = {
    employeeUid: '',
    employeeName: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    note: '',
};

import { useParttime } from '@/lib/ParttimeContext';

export default function SchedulePage() {
    const { user } = useAuth();
    const { activeParttime } = useParttime();
    const { transactions, loading: txLoading } = useTransactions(activeParttime?.id);
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [schedLoading, setSchedLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
    const [adminUsersList, setAdminUsersList] = useState<{ uid: string; name: string }[]>([]);

    // Modal state
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [form, setForm] = useState<ShiftFormState>(defaultForm);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!activeParttime) {
            setSchedules([]);
            setAdminUsersList([]);
            setSchedLoading(false);
            return;
        }
        setSchedLoading(true);
        const unsub = subscribeSchedules(activeParttime.id, (data) => {
            setSchedules(data);
            setSchedLoading(false);
        });
        const unsub2 = subscribeAdminUsers(activeParttime.id, (data) => {
            setAdminUsersList(data.map(u => ({ uid: u.uid, name: u.name || u.email })));
        });
        return () => { unsub(); unsub2(); };
    }, [activeParttime]);

    // Merge admin_users whitelist + transaction-derived employees
    // (so employees without sales still appear for scheduling)
    const employees = useMemo(() => {
        const map: Record<string, string> = {};
        // Start with whitelisted admin_users
        for (const u of adminUsersList) {
            if (u.uid && u.name) map[u.uid] = u.name;
        }
        // Layer in anyone who made sales (fills in name if not whitelisted yet)
        for (const t of transactions) {
            if (t.userId && t.userName && !map[t.userId]) {
                map[t.userId] = t.userName;
            }
        }
        return Object.entries(map)
            .map(([uid, name]) => ({ uid, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [adminUsersList, transactions]);

    const getShiftsFor = (uid: string, date: string) =>
        schedules.filter(s => s.employeeUid === uid && s.date === date);

    const openAdd = (uid: string, name: string, date: string) => {
        setForm({ ...defaultForm, employeeUid: uid, employeeName: name, date });
        setEditId(null);
        setModal('add');
    };

    const openEdit = (entry: ScheduleEntry) => {
        setForm({
            employeeUid: entry.employeeUid,
            employeeName: entry.employeeName,
            date: entry.date,
            startTime: entry.startTime,
            endTime: entry.endTime,
            note: entry.note || '',
        });
        setEditId(entry.id);
        setModal('edit');
    };

    const closeModal = () => {
        setModal(null);
        setForm(defaultForm);
        setEditId(null);
    };

    const handleSave = async () => {
        if (!form.startTime || !form.endTime || !form.employeeUid || !activeParttime) return;
        setSaving(true);
        try {
            const payload = {
                employeeUid: form.employeeUid,
                employeeName: form.employeeName,
                date: form.date,
                startTime: form.startTime,
                endTime: form.endTime,
                note: form.note.trim(),
                createdAt: Date.now(),
                createdBy: user?.displayName || user?.email || 'Admin',
            };
            if (modal === 'edit' && editId) {
                await updateScheduleEntry(activeParttime.id, editId, payload);
            } else {
                await addScheduleEntry(activeParttime.id, payload);
            }
            closeModal();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!activeParttime) return;
        if (confirmDelete !== id) { setConfirmDelete(id); return; }
        await deleteScheduleEntry(activeParttime.id, id);
        setConfirmDelete(null);
    };

    const today = new Date().toISOString().split('T')[0];
    const loading = txLoading || schedLoading;

    if (loading) return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;

    return (
        <AppShell>
            <div className="p-6 max-w-full">
                <PageHeader
                    title="Schedule"
                    subtitle="Assign shifts to employees and publish weekly timetables"
                    action={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setWeekOffset(0)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${weekOffset === 0 ? 'bg-blue text-white' : 'bg-surface2 text-textSecondary hover:text-white'}`}
                            >
                                Today
                            </button>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setWeekOffset(w => w - 1)}
                                    className="p-1.5 rounded-lg bg-surface2 text-textSecondary hover:text-white hover:bg-surface3 transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-white text-sm font-medium px-2 min-w-[180px] text-center">
                                    {formatWeekLabel(weekDates)}
                                </span>
                                <button
                                    onClick={() => setWeekOffset(w => w + 1)}
                                    className="p-1.5 rounded-lg bg-surface2 text-textSecondary hover:text-white hover:bg-surface3 transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    }
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Total Shifts This Week', value: weekDates.reduce((s, d) => s + schedules.filter(e => e.date === d).length, 0) },
                        { label: 'Employees Scheduled', value: new Set(schedules.filter(e => weekDates.includes(e.date)).map(e => e.employeeUid)).size },
                        { label: 'Unscheduled Employees', value: employees.filter(emp => !schedules.some(s => weekDates.includes(s.date) && s.employeeUid === emp.uid)).length },
                    ].map(stat => (
                        <div key={stat.label} className="glass-card p-4">
                            <p className="text-textTertiary text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-white text-2xl font-bold">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {employees.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <p className="text-4xl mb-3">📅</p>
                        <p className="text-white font-semibold mb-1">No employees yet</p>
                        <p className="text-textSecondary text-sm">Once employees record sales on the mobile app, they'll appear here for scheduling.</p>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full" style={{ minWidth: `${7 * 140 + 150}px` }}>
                                {/* Header: day columns */}
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left px-4 py-3 text-textTertiary text-xs font-semibold w-36 sticky left-0 bg-surface z-10">
                                            Employee
                                        </th>
                                        {weekDates.map((date, i) => {
                                            const isToday = date === today;
                                            const [, , d] = date.split('-');
                                            return (
                                                <th
                                                    key={date}
                                                    className={`px-3 py-3 text-xs font-semibold text-center min-w-[140px] ${isToday ? 'text-blue' : 'text-textTertiary'}`}
                                                >
                                                    <div className={`inline-flex flex-col items-center gap-0.5`}>
                                                        <span>{DAYS[i]}</span>
                                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${isToday ? 'bg-blue text-white' : 'text-textSecondary'}`}>
                                                            {parseInt(d)}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp, empIdx) => {
                                        const color = EMP_COLORS[empIdx % EMP_COLORS.length];
                                        const initials = emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                        return (
                                            <tr key={emp.uid} className="border-b border-border/50">
                                                {/* Employee label */}
                                                <td className="px-4 py-3 sticky left-0 bg-surface z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full ${color.bg} border ${color.border} flex items-center justify-center ${color.text} font-bold text-xs flex-shrink-0`}>
                                                            {initials}
                                                        </div>
                                                        <p className="text-white text-xs font-medium leading-tight max-w-[80px] truncate">{emp.name}</p>
                                                    </div>
                                                </td>
                                                {/* Day cells */}
                                                {weekDates.map((date) => {
                                                    const shifts = getShiftsFor(emp.uid, date);
                                                    const isToday = date === today;
                                                    return (
                                                        <td
                                                            key={date}
                                                            className={`px-2 py-2 align-top ${isToday ? 'bg-blue/3' : ''}`}
                                                        >
                                                            <div className="space-y-1.5 min-h-[56px]">
                                                                {shifts.map((shift) => (
                                                                    <div
                                                                        key={shift.id}
                                                                        className={`rounded-lg p-2 ${color.bg} border ${color.border} group relative`}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-1">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-1 mb-0.5">
                                                                                    <Clock size={10} className={color.text} />
                                                                                    <span className={`text-[11px] font-semibold ${color.text}`}>
                                                                                        {formatTime(shift.startTime)}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-textTertiary text-[10px]">
                                                                                    → {formatTime(shift.endTime)}
                                                                                </span>
                                                                                {shift.note && (
                                                                                    <p className="text-textSecondary text-[10px] mt-0.5 truncate">{shift.note}</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={() => openEdit(shift)}
                                                                                    className="p-0.5 rounded text-textTertiary hover:text-white transition-colors"
                                                                                >
                                                                                    <Edit2 size={10} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDelete(shift.id)}
                                                                                    className={`p-0.5 rounded transition-colors ${confirmDelete === shift.id ? 'text-red' : 'text-textTertiary hover:text-red'}`}
                                                                                    title={confirmDelete === shift.id ? 'Click again to confirm' : 'Delete shift'}
                                                                                >
                                                                                    <Trash2 size={10} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {/* Add shift button */}
                                                                <button
                                                                    onClick={() => openAdd(emp.uid, emp.name, date)}
                                                                    className="w-full flex items-center justify-center gap-1 py-1 rounded-lg border border-dashed border-border hover:border-blue/50 hover:bg-blue/5 text-textTertiary hover:text-blue transition-all group"
                                                                >
                                                                    <Plus size={12} className="group-hover:text-blue" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Quick Summary below the grid */}
                {schedules.filter(s => weekDates.includes(s.date)).length > 0 && (
                    <div className="mt-4 glass-card p-4">
                        <p className="text-white font-semibold text-sm mb-3">This Week's Summary</p>
                        <div className="space-y-2">
                            {employees.map((emp, empIdx) => {
                                const color = EMP_COLORS[empIdx % EMP_COLORS.length];
                                const empShifts = schedules.filter(s => weekDates.includes(s.date) && s.employeeUid === emp.uid);
                                if (empShifts.length === 0) return null;
                                // Calculate total hours
                                const totalMins = empShifts.reduce((sum, s) => {
                                    const [sh, sm] = s.startTime.split(':').map(Number);
                                    const [eh, em] = s.endTime.split(':').map(Number);
                                    return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
                                }, 0);
                                const hrs = Math.floor(totalMins / 60);
                                const mins = totalMins % 60;
                                return (
                                    <div key={emp.uid} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
                                        <span className="text-white text-sm font-medium w-32 truncate">{emp.name}</span>
                                        <span className="text-textSecondary text-xs">{empShifts.length} shift{empShifts.length !== 1 ? 's' : ''}</span>
                                        <span className={`text-xs font-semibold ${color.text}`}>
                                            {hrs}h{mins > 0 ? ` ${mins}m` : ''} total
                                        </span>
                                        <div className="flex gap-1 flex-wrap">
                                            {empShifts.map(s => (
                                                <span key={s.id} className={`text-[10px] px-1.5 py-0.5 rounded ${color.bg} ${color.text} border ${color.border}`}>
                                                    {DAY_LABELS[weekDates.indexOf(s.date)]?.slice(0, 3)} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-sm p-6 fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-white font-bold">{modal === 'edit' ? 'Edit Shift' : 'Add Shift'}</h2>
                                <p className="text-textSecondary text-xs mt-0.5">{form.employeeName} · {form.date}</p>
                            </div>
                            <button onClick={closeModal} className="text-textTertiary hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Date (only editable when clicking empty cell; locked when editing) */}
                            <div>
                                <label className="block text-textSecondary text-xs font-semibold mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50"
                                />
                            </div>

                            {/* Employee — only show dropdown if NOT pre-filled from grid click */}
                            {modal === 'add' && !form.employeeUid && employees.length > 0 && (
                                <div>
                                    <label className="block text-textSecondary text-xs font-semibold mb-1.5">Employee</label>
                                    <select
                                        value={form.employeeUid}
                                        onChange={e => {
                                            const emp = employees.find(emp => emp.uid === e.target.value);
                                            setForm(f => ({ ...f, employeeUid: e.target.value, employeeName: emp?.name || '' }));
                                        }}
                                        className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50"
                                    >
                                        <option value="">Select employee…</option>
                                        {employees.map(emp => (
                                            <option key={emp.uid} value={emp.uid}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Times */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-textSecondary text-xs font-semibold mb-1.5">Start Time</label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                                        className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-textSecondary text-xs font-semibold mb-1.5">End Time</label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                                        className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50"
                                    />
                                </div>
                            </div>

                            {/* Duration preview */}
                            {form.startTime && form.endTime && (() => {
                                const [sh, sm] = form.startTime.split(':').map(Number);
                                const [eh, em] = form.endTime.split(':').map(Number);
                                const mins = (eh * 60 + em) - (sh * 60 + sm);
                                if (mins <= 0) return <p className="text-red text-xs">⚠️ End time must be after start time</p>;
                                const h = Math.floor(mins / 60), m = mins % 60;
                                return <p className="text-textSecondary text-xs">⏱ Duration: {h}h{m > 0 ? ` ${m}m` : ''}</p>;
                            })()}

                            {/* Note */}
                            <div>
                                <label className="block text-textSecondary text-xs font-semibold mb-1.5">Note (optional)</label>
                                <input
                                    value={form.note}
                                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                                    placeholder="e.g. Opening shift, bring keys"
                                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-surface2 hover:bg-surface3 text-textSecondary font-semibold py-2.5 rounded-xl transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !form.startTime || !form.endTime || !form.employeeUid || !form.date}
                                    className="flex-1 bg-blue hover:bg-blue/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
                                >
                                    {saving ? 'Saving…' : modal === 'edit' ? 'Save Changes' : 'Add Shift'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
