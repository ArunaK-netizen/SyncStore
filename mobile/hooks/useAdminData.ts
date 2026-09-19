import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../firebase';
import { Transaction } from './useSalesData';

export type Product = {
    id: string;
    name: string;
    price: number;
    category: string;
    userId?: string;
    userName?: string;
};

export type AdminUser = {
    id: string;
    uid: string;
    email: string;
    name?: string;
    addedAt: number;
};

export type AccessRequest = {
    id: string;
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    requestedAt: number;
    status: 'pending' | 'approved' | 'rejected';
};

export const useAdminData = () => {
    const { parttimeId } = useAuth();
    const db = getDb();

    // Data States
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminEmails, setAdminEmails] = useState<string[]>([]);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!parttimeId) {
            setTransactions([]);
            setProducts([]);
            setAdminUsers([]);
            setAdminEmails([]);
            setAccessRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubTxs = onSnapshot(query(collection(db, 'parttimes', parttimeId, 'transactions'), orderBy('timestamp', 'desc')), (snap) => {
            const txs: Transaction[] = [];
            snap.forEach(d => txs.push({ id: d.id, ...d.data() } as Transaction));
            setTransactions(txs);
        });

        const unsubProducts = onSnapshot(collection(db, 'parttimes', parttimeId, 'products'), (snap) => {
            const prods: Product[] = [];
            snap.forEach(d => prods.push({ id: d.id, ...d.data() } as Product));
            setProducts(prods);
        });

        const unsubAdminUsers = onSnapshot(collection(db, 'parttimes', parttimeId, 'approved_users'), (snap) => {
            const users: AdminUser[] = [];
            snap.forEach(d => users.push({ id: d.id, ...d.data() } as AdminUser));
            setAdminUsers(users);
        });

        const unsubAdminEmails = onSnapshot(collection(db, 'parttimes', parttimeId, 'admin_config'), (snap) => {
            const emails: string[] = [];
            snap.forEach(d => {
                const data = d.data();
                if (Array.isArray(data.adminEmails)) emails.push(...data.adminEmails);
            });
            setAdminEmails([...new Set(emails)]);
        });

        const unsubRequests = onSnapshot(query(collection(db, 'parttimes', parttimeId, 'access_requests'), orderBy('requestedAt', 'desc')), (snap) => {
            const reqs: AccessRequest[] = [];
            snap.forEach(d => reqs.push({ id: d.id, ...d.data() } as AccessRequest));
            setAccessRequests(reqs);
        });

        // Optimistic loading false (it will naturally be very fast since rn-firebase caches locally)
        setTimeout(() => setLoading(false), 500);

        return () => {
            unsubTxs();
            unsubProducts();
            unsubAdminUsers();
            unsubAdminEmails();
            unsubRequests();
        };
    }, [parttimeId]);

    // Actions
    const approveAccessRequest = async (request: AccessRequest) => {
        if (!parttimeId) return;
        await updateDoc(doc(db, 'parttimes', parttimeId, 'access_requests', request.id), { status: 'approved' });
        
        const existing = await getDocs(query(collection(db, 'parttimes', parttimeId, 'approved_users')));
        if (!existing.docs.some(d => d.data().uid === request.uid)) {
            await addDoc(collection(db, 'parttimes', parttimeId, 'approved_users'), {
                uid: request.uid,
                email: request.email,
                name: request.name,
                addedAt: Date.now(),
            });
        }
        await setDoc(doc(db, 'user_routing', request.uid), { parttimeId });
    };

    const rejectAccessRequest = async (id: string) => {
        if (!parttimeId) return;
        await updateDoc(doc(db, 'parttimes', parttimeId, 'access_requests', id), { status: 'rejected' });
    };

    const addAdminUser = async (user: Omit<AdminUser, 'id'>) => {
        if (!parttimeId) return;
        await addDoc(collection(db, 'parttimes', parttimeId, 'approved_users'), user);
        await setDoc(doc(db, 'user_routing', user.uid), { parttimeId }, { merge: true });
    };

    const removeAdminUser = async (id: string, uid?: string) => {
        if (!parttimeId) return;
        await deleteDoc(doc(db, 'parttimes', parttimeId, 'approved_users', id));
        if (uid) await deleteDoc(doc(db, 'user_routing', uid)).catch(() => {});
    };

    const addAdminEmail = async (email: string) => {
        if (!parttimeId) return;
        const snap = await getDocs(collection(db, 'parttimes', parttimeId, 'admin_config'));
        if (snap.empty) {
            await addDoc(collection(db, 'parttimes', parttimeId, 'admin_config'), { adminEmails: [email] });
        } else {
            const docRef = snap.docs[0].ref;
            const existing = snap.docs[0].data().adminEmails || [];
            if (!existing.includes(email)) {
                await updateDoc(docRef, { adminEmails: [...existing, email] });
            }
        }
    };

    const removeAdminEmail = async (email: string) => {
        if (!parttimeId) return;
        const snap = await getDocs(collection(db, 'parttimes', parttimeId, 'admin_config'));
        if (snap.empty) return;
        const docRef = snap.docs[0].ref;
        const existing: string[] = snap.docs[0].data().adminEmails || [];
        await updateDoc(docRef, { adminEmails: existing.filter(e => e !== email) });
    };

    return {
        transactions, products, adminUsers, adminEmails, accessRequests, loading,
        approveAccessRequest, rejectAccessRequest, addAdminUser, removeAdminUser,
        addAdminEmail, removeAdminEmail
    };
};
