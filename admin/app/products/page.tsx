'use client';
import AppShell from '@/components/AppShell';
import { Badge, EmptyState, formatCurrency, LoadingSpinner, PageHeader } from '@/components/UI';
import { addProduct, deleteProduct, Product, updateProduct } from '@/lib/db';
import { useProducts } from '@/lib/hooks';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useParttime } from '@/lib/ParttimeContext';

export default function ProductsPage() {
    const { activeParttime } = useParttime();
    const { products, loading } = useProducts(activeParttime?.id);
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', price: '', category: '' });
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        let arr = products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
        arr.sort((a, b) => {
            let cmp = 0;
            if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortBy === 'price') cmp = a.price - b.price;
            else if (sortBy === 'category') cmp = a.category.localeCompare(b.category);
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [products, search, sortBy, sortDir]);

    const toggleSort = (col: typeof sortBy) => {
        if (sortBy === col) setSortDir((d: 'asc' | 'desc') => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const SortIcon = ({ col }: { col: typeof sortBy }) => {
        if (sortBy !== col) return <ArrowUpDown size={12} className="text-textTertiary" />;
        return sortDir === 'asc' ? <ArrowUp size={12} className="text-blue" /> : <ArrowDown size={12} className="text-blue" />;
    };

    const handleAdd = async () => {
        if (!form.name || !form.price || !form.category || !activeParttime) return;
        setSaving(true);
        try {
            await addProduct(activeParttime.id, { name: form.name.trim(), price: parseFloat(form.price), category: form.category.trim().toLowerCase() });
            setForm({ name: '', price: '', category: '' });
            setShowAdd(false);
        } finally { setSaving(false); }
    };

    const handleEdit = async (id: string) => {
        if (!editForm.name || !editForm.price || !editForm.category || !activeParttime) return;
        setSaving(true);
        try { await updateProduct(activeParttime.id, id, editForm); setEditing(null); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!activeParttime) return;
        if (confirmDelete !== id) { setConfirmDelete(id); return; }
        await deleteProduct(activeParttime.id, id);
        setConfirmDelete(null);
    };

    if (loading) return <AppShell><div className="p-6"><LoadingSpinner /></div></AppShell>;

    return (
        <AppShell>
            <div className="p-6 max-w-7xl mx-auto">
                <PageHeader
                    title="Products"
                    subtitle={`${filtered.length} of ${products.length} products`}
                    action={
                        <button onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 bg-blue hover:bg-blue/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">
                            <Plus size={16} /> Add Product
                        </button>
                    }
                />

                {/* Add Product Modal */}
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card w-full max-w-sm p-6 fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-white font-bold">Add New Product</h2>
                                <button onClick={() => setShowAdd(false)} className="text-textTertiary hover:text-white transition-colors"><X size={18} /></button>
                            </div>
                            <div className="space-y-3">
                                {(['name', 'price', 'category'] as const).map(field => (
                                    <div key={field}>
                                        <label className="block text-textSecondary text-xs font-semibold mb-1 capitalize">{field}</label>
                                        <input
                                            value={form[field]}
                                            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                            type={field === 'price' ? 'number' : 'text'}
                                            placeholder={field === 'price' ? '0.00' : field === 'category' ? 'e.g. snacks' : ''}
                                            className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary"
                                        />
                                    </div>
                                ))}
                                <button onClick={handleAdd} disabled={saving || !form.name || !form.price || !form.category}
                                    className="w-full bg-blue hover:bg-blue/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all mt-2">
                                    {saving ? 'Saving…' : 'Add Product'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search bar */}
                <div className="relative mb-4">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textTertiary pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search products or categories…"
                        className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue/50 placeholder-textTertiary"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-textTertiary hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <EmptyState icon="📦" message={search ? `No products matching "${search}"` : 'No products yet. Add your first product!'} />
                ) : (
                    <div className="glass-card overflow-hidden">
                        <table className="w-full">
                            <thead className="border-b border-border">
                                <tr>
                                    <th className="text-left px-5 py-3">
                                        <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 text-textTertiary text-xs font-semibold hover:text-white transition-colors">
                                            Product <SortIcon col="name" />
                                        </button>
                                    </th>
                                    <th className="text-left px-5 py-3">
                                        <button onClick={() => toggleSort('category')} className="flex items-center gap-1.5 text-textTertiary text-xs font-semibold hover:text-white transition-colors">
                                            Category <SortIcon col="category" />
                                        </button>
                                    </th>
                                    <th className="text-right px-5 py-3">
                                        <button onClick={() => toggleSort('price')} className="flex items-center gap-1.5 ml-auto text-textTertiary text-xs font-semibold hover:text-white transition-colors">
                                            Price <SortIcon col="price" />
                                        </button>
                                    </th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => {
                                    const isEditing = editing === p.id;
                                    return (
                                        <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/40 transition-colors">
                                            <td className="px-5 py-3">
                                                {isEditing ? (
                                                    <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                        className="bg-surface2 border border-border rounded-lg px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue/50" />
                                                ) : (
                                                    <p className="text-white font-medium text-sm">{p.name}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {isEditing ? (
                                                    <input value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                                                        className="bg-surface2 border border-border rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:border-blue/50 text-white" />
                                                ) : (
                                                    <Badge color="blue">{p.category}</Badge>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editForm.price ?? ''} onChange={e => setEditForm(f => ({ ...f, price: parseFloat(e.target.value) }))}
                                                        className="bg-surface2 border border-border rounded-lg px-2 py-1 text-sm w-20 focus:outline-none focus:border-blue/50 text-white text-right" />
                                                ) : (
                                                    <span className="text-white font-semibold text-sm tabular-nums">{formatCurrency(p.price)}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1 justify-end">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => handleEdit(p.id)} className="p-1.5 rounded-lg text-green hover:bg-green/10 transition-colors"><Check size={14} /></button>
                                                            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-textTertiary hover:bg-surface3 transition-colors"><X size={14} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => { setEditing(p.id); setEditForm({ name: p.name, price: p.price, category: p.category }); setConfirmDelete(null); }}
                                                                className="p-1.5 rounded-lg text-textTertiary hover:text-blue hover:bg-blue/10 transition-colors"><Pencil size={14} /></button>
                                                            <button onClick={() => handleDelete(p.id)}
                                                                className={`p-1.5 rounded-lg transition-all ${confirmDelete === p.id ? 'bg-red/20 text-red' : 'text-textTertiary hover:text-red hover:bg-red/10'}`}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
