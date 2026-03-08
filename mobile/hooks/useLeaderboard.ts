import { collection, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { getDb } from '../firebase';
import { useAuth } from '../context/AuthContext';

export type LeaderboardEntry = {
    uid: string;
    name: string;
    revenue: number;
    txCount: number;
};

export const useLeaderboard = () => {
    const { parttimeId } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!parttimeId) {
            setLeaderboard([]);
            setLoading(false);
            return;
        }

        const db = getDb();
        const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

        const q = query(
            collection(db, 'parttimes', parttimeId, 'transactions'),
            orderBy('timestamp', 'desc'),
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const map: Record<string, LeaderboardEntry> = {};

            snap.forEach((d) => {
                const t = d.data() as any;
                // Only count current month's transactions
                if (!t.date || !t.date.startsWith(currentMonth)) return;
                if (!t.userId) return;

                if (!map[t.userId]) {
                    map[t.userId] = {
                        uid: t.userId,
                        name: t.userName || 'Unknown',
                        revenue: 0,
                        txCount: 0,
                    };
                }
                map[t.userId].revenue += t.totalAmount || 0;
                map[t.userId].txCount += 1;
            });

            const sorted = Object.values(map).sort((a, b) => b.revenue - a.revenue);
            setLeaderboard(sorted);
            setLoading(false);
        }, () => {
            setLoading(false);
        });

        return () => unsubscribe();
    }, [parttimeId]);

    return { leaderboard, loading };
};
