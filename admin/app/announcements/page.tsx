'use client';
import AppShell from '@/components/AppShell';
import { EmptyState, LoadingSpinner, PageHeader } from '@/components/UI';
import { addAnnouncement, Announcement, deleteAnnouncement, subscribeAnnouncements } from '@/lib/db';
import { useAuth } from '@/lib/AuthContext';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useParttime } from '@/lib/ParttimeContext';

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const { activeParttime } = useParttime();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', body: '' });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!activeParttime) {
            setAnnouncements([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsub = subscribeAnnouncements(activeParttime.id, (data) => {
            setAnnouncements(data);
            setLoading(false);
        });
        return unsub;
    }, [activeParttime]);

    const handleAdd = async () => {
        if (!form.title.trim() || !form.body.trim() || !activeParttime) return;
        setSaving(true);
        try {
            await addAnnouncement(activeParttime.id, {
                title: form.title.trim(),
                body: form.body.trim(),
                createdAt: Date.now(),
                createdBy: user?.displayName || user?.email || 'Admin',
            });
            setForm({ title: '', body: '' });
            setShowAdd(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!activeParttime) return;
        if (confirmDelete !== id) { setConfirmDelete(id); return; }
        await deleteAnnouncement(activeParttime.id, id);
        setConfirmDelete(null);
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;

    return (
        <AppShell>
            <div className="p-6 max-w-3xl mx-auto">
                <PageHeader
                    title="Announcements"
                    subtitle="Post updates visible to all employees on the mobile app"
                    action={
                        <button
                            onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 bg-blue hover:bg-blue/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
                        >
                            <Plus size={16} /> New Announcement
                        </button>
                    }
                />

                {/* Add Modal */}
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card w-full max-w-lg p-6 fade-in">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Megaphone size={18} className="text-blue" />
                                    <h2 className="text-white font-bold">New Announcement</h2>
                                </div>
                                <button onClick={() => { setShowAdd(false); setForm({ title: '', body: '' }); }} className="text-textTertiary hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-textSecondary text-xs font-semibold mb-1.5">Title *</label>
                                    <input
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Holiday Schedule Update"
                                        className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-textSecondary text-xs font-semibold mb-1.5">Message *</label>
                                    <textarea
                                        value={form.body}
                                        onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                        placeholder="Write your announcement here..."
                                        rows={5}
                                        className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => { setShowAdd(false); setForm({ title: '', body: '' }); }}
                                        className="flex-1 bg-surface2 hover:bg-surface3 text-textSecondary font-semibold py-2.5 rounded-xl transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={saving || !form.title.trim() || !form.body.trim()}
                                        className="flex-1 bg-blue hover:bg-blue/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
                                    >
                                        {saving ? 'Posting…' : 'Post Announcement'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Announcements List */}
                {announcements.length === 0 ? (
                    <EmptyState icon="📢" message="No announcements yet. Post your first announcement to notify employees." />
                ) : (
                    <div className="space-y-3">
                        {announcements.map((a) => (
                            <div key={a.id} className="glass-card p-5 fade-in">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-blue/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Megaphone size={16} className="text-blue" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold text-sm mb-1">{a.title}</h3>
                                            <p className="text-textSecondary text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                                            <p className="text-textTertiary text-xs mt-2">
                                                {formatDate(a.createdAt)} · by {a.createdBy}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${confirmDelete === a.id ? 'bg-red/20 text-red' : 'text-textTertiary hover:text-red hover:bg-red/10'}`}
                                        title={confirmDelete === a.id ? 'Click again to confirm delete' : 'Delete'}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
