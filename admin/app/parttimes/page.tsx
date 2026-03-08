'use client';
import AppShell from '@/components/AppShell';
import { formatShortDate, LoadingSpinner, PageHeader } from '@/components/UI';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { Building2, Plus, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

type Parttime = {
    id: string;
    name: string;
    code: string;
    createdAt: number;
    active: boolean;
};

export default function ParttimesPage() {
    const { user, isAdmin } = useAuth();
    const isSuperAdmin = user?.email?.toLowerCase() === 'dasari.durga2022@vitstudent.ac.in';

    const [parttimes, setParttimes] = useState<Parttime[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newId, setNewId] = useState('');

    useEffect(() => {
        if (!isSuperAdmin) {
            setLoading(false);
            return;
        }

        const fetchAll = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'parttimes')));
                const list: Parttime[] = [];
                snap.forEach(d => {
                    list.push({ id: d.id, ...d.data() } as Parttime);
                });

                // Sort by creation date
                list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setParttimes(list);
            } catch (err) {
                console.error("Failed to load parttimes:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [isSuperAdmin]);

    // Format new ID as user types the name
    const handleNameChange = (val: string) => {
        setNewName(val);
        // Create an ID like "xyz-parttime"
        const formattedId = val.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-parttime';
        setNewId(formattedId);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newId) return;

        setCreating(true);
        try {
            // Generate a random 4 char code
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const prefix = newName.substring(0, 4).toUpperCase();
            const joinCode = `${prefix}-${randomSuffix}`;

            const newPt: Omit<Parttime, 'id'> = {
                name: newName,
                code: joinCode,
                createdAt: Date.now(),
                active: true
            };

            await setDoc(doc(db, 'parttimes', newId), newPt);

            setParttimes(prev => [{ id: newId, ...newPt }, ...prev]);
            setShowForm(false);
            setNewName('');
            setNewId('');
        } catch (error) {
            console.error("Failed to create parttime:", error);
            alert("Error creating parttime. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <AppShell>
                <div className="p-6 flex items-center justify-center h-full">
                    <p className="text-textSecondary">You do not have permission to view this page.</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <PageHeader
                        title="Manage Tenants"
                        subtitle="View and create parttime organizational units"
                    />
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue hover:bg-blue/90 text-white font-medium py-2 px-4 rounded-xl transition-all shadow-lg flex items-center gap-2 max-w-fit"
                    >
                        {showForm ? 'Cancel' : <><Plus size={18} /> New Parttime</>}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreate} className="glass-card p-6 mb-6 border-purple/20 animate-fade-in">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="text-purple" size={18} />
                            Create New Parttime
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-textSecondary">Organization Name</label>
                                <input
                                    value={newName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g. Vintage Parttime"
                                    required
                                    className="bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder:text-textTertiary focus:outline-none focus:border-blue/50"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-textSecondary">Database ID (Auto-generated)</label>
                                <input
                                    value={newId}
                                    readOnly
                                    className="bg-surface border border-border rounded-xl px-4 py-2.5 text-white opacity-70"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={creating}
                                className="bg-purple hover:bg-purple/90 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-xl transition-all shadow-lg"
                            >
                                {creating ? 'Creating...' : 'Create Tenant'}
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner /></div>
                ) : parttimes.length === 0 ? (
                    <div className="glass-card p-12 flex flex-col items-center justify-center border-border">
                        <Building2 size={48} className="text-textTertiary mb-4" />
                        <h3 className="text-white font-medium text-lg mb-1">No Tenants Found</h3>
                        <p className="text-textSecondary text-sm mb-6">Create your first parttime to get started.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-blue hover:bg-blue/90 text-white font-medium py-2 px-4 rounded-xl transition-all shadow-lg flex items-center gap-2"
                        >
                            <Plus size={18} /> Create Parttime
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parttimes.map(pt => (
                            <div key={pt.id} className="glass-card p-6 border-border hover:border-purple/30 transition-colors flex flex-col h-full relative overflow-hidden">
                                {pt.id === 'rasagna-parttime' && (
                                    <div className="absolute top-0 right-0 bg-blue/20 text-blue text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                                        Primary
                                    </div>
                                )}

                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">{pt.name}</h3>
                                        <p className="text-textSecondary text-xs">{pt.id}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-textTertiary tracking-wider mb-1">Join Code</p>
                                        <div className="flex items-center gap-2">
                                            <QrCode size={14} className="text-blue" />
                                            <span className="text-white font-mono font-bold tracking-widest">{pt.code || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-textTertiary tracking-wider mb-1">Created</p>
                                        <p className="text-textSecondary text-xs">{pt.createdAt ? formatShortDate(new Date(pt.createdAt).toISOString().split('T')[0]) : 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
