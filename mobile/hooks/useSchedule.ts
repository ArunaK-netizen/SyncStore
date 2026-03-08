import { collection, onSnapshot, query, where } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../firebase';

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

/** Returns the current week's Mon–Sun dates as 'YYYY-MM-DD' strings. */
export function getWeekDates(weekOffset = 0): string[] {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // days to Monday
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff + weekOffset * 7);
    mon.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

export function formatShiftTime(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export const useSchedule = () => {
    const { user, parttimeId } = useAuth();
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !parttimeId) {
            setSchedules([]);
            setLoading(false);
            return;
        }

        const db = getDb();
        // Using only `where` (no orderBy) avoids the Firestore composite index requirement.
        // We sort client-side instead.
        const q = query(
            collection(db, 'parttimes', parttimeId, 'schedules'),
            where('employeeUid', '==', user.uid),
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data: ScheduleEntry[] = [];
            snap.forEach((d) => data.push({ id: d.id, ...d.data() } as ScheduleEntry));
            // Sort by date ascending client-side
            data.sort((a, b) => a.date.localeCompare(b.date));
            setSchedules(data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, parttimeId]);

    return { schedules, loading };
};
