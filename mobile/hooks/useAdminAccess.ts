import { collection, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../firebase';

export const useAdminAccess = () => {
    const { user, parttimeId } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [emailsList, setEmailsList] = useState<string[]>([]);

    useEffect(() => {
        if (!user || !user.email || !parttimeId) {
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        const db = getDb();
        const unsub = onSnapshot(collection(db, 'parttimes', parttimeId, 'admin_config'), (snap) => {
            const emails: string[] = [];
            snap.forEach((d) => {
                const data = d.data();
                if (Array.isArray(data.adminEmails)) {
                    emails.push(...data.adminEmails.map((e: string) => e.toLowerCase().trim()));
                }
            });
            const userEmail = user.email!.toLowerCase().trim();
            console.log('[useAdminAccess] Fetched admin emails:', emails, 'User email:', userEmail);
            setEmailsList(emails);
            setIsAdmin(emails.includes(userEmail));
            setLoading(false);
        });

        return unsub;
    }, [user, parttimeId]);

    return { isAdmin, loading, emailsList };
};
