'use client';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthContext';
import { useParttime } from '@/lib/ParttimeContext';
import { ShieldAlert } from 'lucide-react';
import { ReactNode } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
    const { user, loading: authLoading, logout } = useAuth();
    const { activeParttime, availableParttimes, loadingParttimes } = useParttime();

    if (authLoading || (user && loadingParttimes)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue flex items-center justify-center pulse-blue">
                        <span className="text-white font-bold text-lg">PT</span>
                    </div>
                    <div className="w-6 h-6 border-2 border-surface3 border-t-blue rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    // Security Gate: If user is logged in but is not an authorized Admin for any Parttime workspace
    if (availableParttimes.length === 0 || !activeParttime) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-textSecondary text-sm mb-6 leading-relaxed">
                        Your account (<span className="text-white font-medium">{user.email}</span>) does not have admin permissions for any Parttime workspace.
                    </p>
                    <button
                        onClick={logout}
                        className="w-full py-3 bg-surface2 hover:bg-surface3 text-white font-semibold rounded-xl transition-all duration-200 border border-border cursor-pointer"
                    >
                        Sign Out & Try Another Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto bg-background">
                <div className="pt-14 lg:pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
