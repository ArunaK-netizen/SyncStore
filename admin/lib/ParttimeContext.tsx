'use client';

import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';

export interface ParttimeInfo {
    id: string; // The document ID, e.g. "rasagna-parttime" or auto ID
    name: string;
    code: string;
    ownerEmail?: string;
    createdByEmail?: string;
}

interface ParttimeContextType {
    activeParttime: ParttimeInfo | null;
    setActiveParttime: (parttime: ParttimeInfo | null) => void;
    availableParttimes: ParttimeInfo[];
    isSuperAdmin: boolean;
    loadingParttimes: boolean;
}

const ParttimeContext = createContext<ParttimeContextType | undefined>(undefined);

export function ParttimeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activeParttime, setActiveParttime] = useState<ParttimeInfo | null>(null);
    const [availableParttimes, setAvailableParttimes] = useState<ParttimeInfo[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loadingParttimes, setLoadingParttimes] = useState(true);

    useEffect(() => {
        if (!user || !user.email) {
            setActiveParttime(null);
            setAvailableParttimes([]);
            setIsSuperAdmin(false);
            setLoadingParttimes(false);
            return;
        }

        const userEmail = user.email.toLowerCase().trim();
        const _isSuperAdmin = userEmail === 'dasari.durga2022@vitstudent.ac.in';
        setIsSuperAdmin(_isSuperAdmin);
        setLoadingParttimes(true);

        const fetchParttimes = async () => {
            try {
                // 1. Fetch user_routing to get the user's primary/default parttime
                const routingRef = doc(db, 'user_routing', user.uid);
                const routingSnap = await getDoc(routingRef).catch(() => null);
                const routedParttimeId = routingSnap?.exists() ? routingSnap.data()?.parttimeId : null;

                // 2. Fetch all parttimes from Firestore
                const parttimesSnap = await getDocs(query(collection(db, 'parttimes')));
                const authorizedParttimes: ParttimeInfo[] = [];

                for (const pDoc of parttimesSnap.docs) {
                    const pData = pDoc.data();
                    const pInfo: ParttimeInfo = {
                        id: pDoc.id,
                        name: pData.name || pDoc.id,
                        code: pData.code || '',
                        ownerEmail: pData.ownerEmail,
                        createdByEmail: pData.createdByEmail,
                    };

                    if (_isSuperAdmin) {
                        authorizedParttimes.push(pInfo);
                        continue;
                    }

                    // Check if user is owner/creator by email
                    if (
                        (pData.ownerEmail && pData.ownerEmail.toLowerCase().trim() === userEmail) ||
                        (pData.createdByEmail && pData.createdByEmail.toLowerCase().trim() === userEmail)
                    ) {
                        authorizedParttimes.push(pInfo);
                        continue;
                    }

                    // Check admin_config subcollection for this parttime
                    try {
                        const adminConfigSnap = await getDocs(collection(db, 'parttimes', pDoc.id, 'admin_config'));
                        let isAdminForParttime = false;
                        adminConfigSnap.forEach((cDoc) => {
                            const cData = cDoc.data();
                            if (Array.isArray(cData.adminEmails)) {
                                const emails = cData.adminEmails.map((e: string) => String(e).toLowerCase().trim());
                                if (emails.includes(userEmail)) {
                                    isAdminForParttime = true;
                                }
                            }
                        });
                        if (isAdminForParttime) {
                            authorizedParttimes.push(pInfo);
                        }
                    } catch (e) {
                        console.error(`Error checking admin_config for parttime ${pDoc.id}:`, e);
                    }
                }

                setAvailableParttimes(authorizedParttimes);

                if (authorizedParttimes.length === 0) {
                    setActiveParttime(null);
                    setLoadingParttimes(false);
                    return;
                }

                // If user has a routedParttimeId and is authorized for it, pick it; else pick first authorized parttime
                const defaultPt = (routedParttimeId && authorizedParttimes.find(p => p.id === routedParttimeId)) || authorizedParttimes[0];
                setActiveParttime(defaultPt);

            } catch (error) {
                console.error("Error fetching parttimes:", error);
                setAvailableParttimes([]);
                setActiveParttime(null);
            } finally {
                setLoadingParttimes(false);
            }
        };

        fetchParttimes();

    }, [user]);

    return (
        <ParttimeContext.Provider value={{
            activeParttime,
            setActiveParttime,
            availableParttimes,
            isSuperAdmin,
            loadingParttimes
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
