'use client';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';

export interface ParttimeInfo {
    id: string; // The document ID, e.g., "rasagna-parttime"
    name: string;
    code: string;
}

interface ParttimeContextType {
    activeParttime: ParttimeInfo | null;
    setActiveParttime: (parttime: ParttimeInfo | null) => void;
    availableParttimes: ParttimeInfo[];
    isSuperAdmin: boolean;
}

const ParttimeContext = createContext<ParttimeContextType | undefined>(undefined);

export function ParttimeProvider({ children }: { children: ReactNode }) {
    const { user, isAdmin } = useAuth();
    const [activeParttime, setActiveParttime] = useState<ParttimeInfo | null>(null);
    const [availableParttimes, setAvailableParttimes] = useState<ParttimeInfo[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        if (!user || !isAdmin) {
            setActiveParttime(null);
            setAvailableParttimes([]);
            setIsSuperAdmin(false);
            return;
        }

        const email = user.email?.toLowerCase();
        const _isSuperAdmin = email === 'dasari.durga2022@vitstudent.ac.in';
        setIsSuperAdmin(_isSuperAdmin);

        const fetchParttimes = async () => {
            try {
                let parttimesSnap;
                if (_isSuperAdmin) {
                    // Super Admin sees all active parttimes
                    parttimesSnap = await getDocs(query(collection(db, 'parttimes')));
                } else {
                    // Later: regular admins would only query where they are an admin
                    // For now, super admin is the only use case we are fully supporting
                    parttimesSnap = await getDocs(query(collection(db, 'parttimes')));
                }

                const loaded: ParttimeInfo[] = [];
                parttimesSnap.forEach(doc => {
                    loaded.push({ id: doc.id, ...doc.data() } as ParttimeInfo);
                });

                if (loaded.length === 0) {
                    setAvailableParttimes([]);
                    setActiveParttime(null);
                    return;
                }

                setAvailableParttimes(loaded);

                // Set default active parttime to rasagna-parttime if available, else first one
                const defaultPt = loaded.find(p => p.id === 'rasagna-parttime') || loaded[0];
                setActiveParttime(defaultPt);

            } catch (error) {
                console.error("Error fetching parttimes:", error);
                setAvailableParttimes([]);
                setActiveParttime(null);
            }
        };

        fetchParttimes();

    }, [user, isAdmin]);

    return (
        <ParttimeContext.Provider value={{
            activeParttime,
            setActiveParttime,
            availableParttimes,
            isSuperAdmin
        }}>
            {children}
        </ParttimeContext.Provider>
    );
}

export function useParttime() {
    const ctx = useContext(ParttimeContext);
    if (!ctx) throw new Error('useParttime must be used within a ParttimeProvider');
    return ctx;
}
