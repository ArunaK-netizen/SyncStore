import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export type TransactionItem = {
    id: string;
    productName: string;
    category: string;
    price: number;
    quantity: number;
};

export type Transaction = {
    id: string;
    date: string;
    timestamp: number;
    items: TransactionItem[];
    totalAmount: number;
    paymentMethod: 'cash' | 'card' | 'upi';
    tip: number;
    userId?: string;
    userName?: string;
    // Legacy
    productName?: string;
    category?: string;
    price?: number;
    quantity?: number;
};

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

export type Announcement = {
    id: string;
    title: string;
    body: string;
    createdAt: number;
    createdBy: string;
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

export type ScheduleEntry = {
    id: string;
    employeeUid: string;
    employeeName: string;
    date: string;        // 'YYYY-MM-DD'
    startTime: string;   // 'HH:MM' 24h
    endTime: string;     // 'HH:MM' 24h
    note?: string;
    createdAt: number;
    createdBy: string;
};

// --- Transactions ---
export function subscribeTransactions(parttimeId: string, callback: (data: Transaction[]) => void) {
    if (!parttimeId) return () => { };
    const q = query(collection(db, 'parttimes', parttimeId, 'transactions'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
        const data: Transaction[] = [];
        const seen = new Set<string>();
        snap.forEach((d) => {
            if (seen.has(d.id)) return;
            seen.add(d.id);
            data.push({ id: d.id, ...d.data() } as Transaction);
        });
        callback(data);
    });
}

export async function deleteTransaction(parttimeId: string, id: string) {
    if (!parttimeId) return;
    await deleteDoc(doc(db, 'parttimes', parttimeId, 'transactions', id));
}

// --- Products ---
export function subscribeProducts(parttimeId: string, callback: (data: Product[]) => void) {
    if (!parttimeId) return () => { };
    const q = query(collection(db, 'parttimes', parttimeId, 'products'));
    return onSnapshot(q, (snap) => {
        const data: Product[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Product));
        callback(data);
    });
}

export async function addProduct(parttimeId: string, data: Omit<Product, 'id'>) {
    if (!parttimeId) throw new Error("parttimeId required");
    await addDoc(collection(db, 'parttimes', parttimeId, 'products'), data);
}

export async function updateProduct(parttimeId: string, id: string, data: Partial<Product>) {
    if (!parttimeId) throw new Error("parttimeId required");
    const { id: _id, ...rest } = data as Partial<Product> & { id?: string };
    await updateDoc(doc(db, 'parttimes', parttimeId, 'products', id), rest as Record<string, unknown>);
}

export async function deleteProduct(parttimeId: string, id: string) {
    if (!parttimeId) return;
    await deleteDoc(doc(db, 'parttimes', parttimeId, 'products', id));
}

// --- Admin Users (Global admin_users for mobile auth, but managed per parttime requested) ---
export function subscribeAdminUsers(parttimeId: string, callback: (data: AdminUser[]) => void) {
    if (!parttimeId) return () => { };
    return onSnapshot(collection(db, 'parttimes', parttimeId, 'approved_users'), (snap) => {
        const data: AdminUser[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() } as AdminUser));
        callback(data);
    });
}

export async function addAdminUser(parttimeId: string, user: Omit<AdminUser, 'id'>) {
    if (!parttimeId) throw new Error("parttimeId required");
    // We add to the parttime's approved_users so they are listed in this parttime's dashboard
    await addDoc(collection(db, 'parttimes', parttimeId, 'approved_users'), user);
    // Also add to global user_routing so mobile knows where to put them when they log in
    await updateDoc(doc(db, 'user_routing', user.uid), { parttimeId } as Record<string, unknown>).catch(async () => {
        // create if it doesn't exist
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'user_routing', user.uid), { parttimeId });
    });
}

export async function removeAdminUser(parttimeId: string, id: string, uid?: string) {
    if (!parttimeId) return;
    await deleteDoc(doc(db, 'parttimes', parttimeId, 'approved_users', id));
    if (uid) {
        await deleteDoc(doc(db, 'user_routing', uid)).catch(() => { });
    }
}

// --- Admin Config (whitelist - Global Super Admins are in Global, Parttime Admins are in Parttime doc) ---
// For now, keeping global config for simplicity during migration, future update will split this
export async function getAdminEmails(parttimeId: string): Promise<string[]> {
    if (!parttimeId) return [];
    const snap = await getDocs(collection(db, 'parttimes', parttimeId, 'admin_config'));
    const emails: string[] = [];
    snap.forEach((d) => {
        const data = d.data();
        if (Array.isArray(data.adminEmails)) {
            emails.push(...data.adminEmails);
        }
    });
    return emails;
}

export function subscribeAdminEmails(parttimeId: string, callback: (emails: string[]) => void) {
    if (!parttimeId) return () => { };
    return onSnapshot(collection(db, 'parttimes', parttimeId, 'admin_config'), (snap) => {
        const emails: string[] = [];
        snap.forEach((d) => {
            const data = d.data();
            if (Array.isArray(data.adminEmails)) emails.push(...data.adminEmails);
        });
        callback([...new Set(emails)]);
    });
}

export async function addAdminEmail(parttimeId: string, email: string) {
    if (!parttimeId) return;
    const snap = await getDocs(collection(db, 'parttimes', parttimeId, 'admin_config'));
    if (snap.empty) {
        await addDoc(collection(db, 'parttimes', parttimeId, 'admin_config'), { adminEmails: [email] });
    } else {
        const docRef = snap.docs[0].ref;
        const existing: string[] = snap.docs[0].data().adminEmails || [];
        if (!existing.includes(email)) {
            await updateDoc(docRef, { adminEmails: [...existing, email] } as Record<string, unknown>);
        }
    }
}

export async function removeAdminEmail(parttimeId: string, email: string) {
    if (!parttimeId) return;
    const snap = await getDocs(collection(db, 'parttimes', parttimeId, 'admin_config'));
    if (snap.empty) return;
    const docRef = snap.docs[0].ref;
    const existing: string[] = snap.docs[0].data().adminEmails || [];
    await updateDoc(docRef, { adminEmails: existing.filter(e => e !== email) } as Record<string, unknown>);
}

// --- Access Requests ---
export function subscribeAccessRequests(parttimeId: string, callback: (data: AccessRequest[]) => void) {
    if (!parttimeId) return () => { };
    const q = query(collection(db, 'parttimes', parttimeId, 'access_requests'), orderBy('requestedAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const data: AccessRequest[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() } as AccessRequest));
        callback(data);
    });
}

export async function approveAccessRequest(parttimeId: string, request: AccessRequest) {
    if (!parttimeId) throw new Error("parttimeId required");
    // 1. Mark the request as approved
    await updateDoc(doc(db, 'parttimes', parttimeId, 'access_requests', request.id), { status: 'approved' } as Record<string, unknown>);

    // 2. Add to parttime's approved_users
    const existing = await getDocs(query(collection(db, 'parttimes', parttimeId, 'approved_users')));
    const alreadyAdded = existing.docs.some(d => d.data().uid === request.uid);
    if (!alreadyAdded) {
        await addDoc(collection(db, 'parttimes', parttimeId, 'approved_users'), {
            uid: request.uid,
            email: request.email,
            name: request.name,
            addedAt: Date.now(),
        });
    }

    // 3. Update global routing
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'user_routing', request.uid), { parttimeId });
}

export async function rejectAccessRequest(parttimeId: string, id: string) {
    if (!parttimeId) return;
    await updateDoc(doc(db, 'parttimes', parttimeId, 'access_requests', id), { status: 'rejected' } as Record<string, unknown>);
}

// --- Announcements ---
export function subscribeAnnouncements(parttimeId: string, callback: (data: Announcement[]) => void) {
    if (!parttimeId) return () => { };
    const q = query(collection(db, 'parttimes', parttimeId, 'announcements'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const data: Announcement[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Announcement));
        callback(data);
    });
}

export async function addAnnouncement(parttimeId: string, data: Omit<Announcement, 'id'>) {
    if (!parttimeId) throw new Error("parttimeId required");
    await addDoc(collection(db, 'parttimes', parttimeId, 'announcements'), data);
}

export async function deleteAnnouncement(parttimeId: string, id: string) {
    if (!parttimeId) return;
    await deleteDoc(doc(db, 'parttimes', parttimeId, 'announcements', id));
}

// --- Schedules ---
export function subscribeSchedules(parttimeId: string, callback: (data: ScheduleEntry[]) => void) {
    if (!parttimeId) return () => { };
    const q = query(collection(db, 'parttimes', parttimeId, 'schedules'), orderBy('date', 'asc'));
    return onSnapshot(q, (snap) => {
        const data: ScheduleEntry[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() } as ScheduleEntry));
        callback(data);
    });
}

export async function addScheduleEntry(parttimeId: string, entry: Omit<ScheduleEntry, 'id'>) {
    if (!parttimeId) throw new Error("parttimeId required");
    await addDoc(collection(db, 'parttimes', parttimeId, 'schedules'), entry);
}

export async function updateScheduleEntry(parttimeId: string, id: string, data: Partial<ScheduleEntry>) {
    if (!parttimeId) throw new Error("parttimeId required");
    const { id: _id, ...rest } = data as Partial<ScheduleEntry> & { id?: string };
    await updateDoc(doc(db, 'parttimes', parttimeId, 'schedules', id), rest as Record<string, unknown>);
}

export async function deleteScheduleEntry(parttimeId: string, id: string) {
    if (!parttimeId) return;
    await deleteDoc(doc(db, 'parttimes', parttimeId, 'schedules', id));
}
