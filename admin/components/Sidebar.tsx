'use client';
import { useAuth } from '@/lib/AuthContext';
import {
    BarChart2,
    CalendarDays,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    Package,
    ShoppingBag,
    UserCog,
    Users,
    X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Overview' },
    { href: '/employees', icon: Users, label: 'Employees' },
    { href: '/sales', icon: ShoppingBag, label: 'Sales' },
    { href: '/products', icon: Package, label: 'Products' },
    { href: '/analytics', icon: BarChart2, label: 'Analytics' },
    { href: '/schedule', icon: CalendarDays, label: 'Schedule' },
    { href: '/users', icon: UserCog, label: 'User Management' },
    { href: '/announcements', icon: Megaphone, label: 'Announcements' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);

    const initials = user?.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? 'A';

    const NavContent = () => {
        // We import useParttime inside the component now
        const { activeParttime, availableParttimes, setActiveParttime, isSuperAdmin } = require('@/lib/ParttimeContext').useParttime();

        return (
            <div className="flex flex-col h-full">
                {/* Logo & Context Switcher */}
                <div className="px-6 py-6 border-b border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-blue flex items-center justify-center pulse-blue">
                            <span className="text-white font-bold text-sm">PT</span>
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm leading-tight">Admin</p>
                            <p className="text-textSecondary text-xs">Panel</p>
                        </div>
                    </div>

                    {activeParttime ? (
                        <div className="bg-surface2 rounded-xl border border-border p-3">
                            <p className="text-[10px] uppercase font-bold text-textTertiary tracking-wider mb-1">Active Parttime</p>
                            {isSuperAdmin ? (
                                <select
                                    className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer appearance-none truncate"
                                    value={activeParttime.id}
                                    onChange={(e) => {
                                        const found = availableParttimes.find((p: any) => p.id === e.target.value);
                                        if (found) setActiveParttime(found);
                                    }}
                                >
                                    {availableParttimes.map((p: any) => (
                                        <option key={p.id} value={p.id} className="bg-surface text-white">
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-white text-sm font-semibold truncate">{activeParttime.name}</p>
                            )}
                            <p className="text-blue text-xs font-mono mt-1">Code: {activeParttime.code || 'N/A'}</p>
                        </div>
                    ) : (
                        <div className="bg-orange/10 rounded-xl border border-orange/20 p-3">
                            <p className="text-orange text-xs text-center font-medium">No active parttime</p>
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style dangerouslySetInnerHTML={{ __html: `nav::-webkit-scrollbar { display: none; }` }} />
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${active
                                        ? 'bg-blue/15 text-blue'
                                        : 'text-textSecondary hover:bg-surface2 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} className={active ? 'text-blue' : 'text-textTertiary group-hover:text-white'} strokeWidth={active ? 2.5 : 2} />
                                <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
                                {active && <ChevronRight size={14} className="ml-auto text-blue" />}
                            </Link>
                        );
                    })}

                    {isSuperAdmin && (
                        <div className="pt-4 mt-2 border-t border-border">
                            <p className="px-3 text-[10px] uppercase font-bold text-textTertiary tracking-wider mb-2">Super Admin</p>
                            <Link
                                href="/parttimes"
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                ${pathname === '/parttimes'
                                        ? 'bg-purple/15 text-purple'
                                        : 'text-textSecondary hover:bg-surface2 hover:text-white'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={pathname === '/parttimes' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={pathname === '/parttimes' ? 'text-purple' : 'text-textTertiary group-hover:text-white'}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                <span className={`text-sm font-medium ${pathname === '/parttimes' ? 'font-semibold' : ''}`}>Manage Tenants</span>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* User + Logout */}
                <div className="px-3 py-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center text-blue font-bold text-xs flex-shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{user?.displayName || 'Admin'}</p>
                            <p className="text-textTertiary text-[10px] truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-textSecondary hover:bg-red/10 hover:text-red transition-all duration-200 group"
                    >
                        <LogOut size={16} className="group-hover:text-red" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-surface border-r border-border h-full">
                <NavContent />
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue flex items-center justify-center">
                        <span className="text-white font-bold text-xs">PT</span>
                    </div>
                    <span className="text-white font-semibold text-sm">Admin Panel</span>
                </div>
                <button onClick={() => setOpen(!open)} className="text-textSecondary hover:text-white transition-colors">
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {open && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <aside className="absolute top-0 left-0 bottom-0 w-72 bg-surface border-r border-border pt-14">
                        <NavContent />
                    </aside>
                </div>
            )}
        </>
    );
}
