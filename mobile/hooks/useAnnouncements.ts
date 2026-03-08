import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { getDb } from '../firebase';
import { useAuth } from '../context/AuthContext';

export type Announcement = {
    id: string;
    title: string;
    body: string;
    createdAt: number;
    createdBy: string;
};

export const useAnnouncements = () => {
    const { parttimeId } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hiddenIds, setHiddenIds] = useState<string[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);

    const checkState = async (anns: Announcement[]) => {
        try {
            const readStr = await AsyncStorage.getItem('readAnnouncements');
            const read = readStr ? JSON.parse(readStr) : [];
            const hiddenStr = await AsyncStorage.getItem('hiddenAnnouncements');
            const hidden = hiddenStr ? JSON.parse(hiddenStr) : [];

            setReadIds(read);
            setHiddenIds(hidden);

            const visible = anns.filter(a => !hidden.includes(a.id));
            setUnreadCount(visible.filter(a => !read.includes(a.id)).length);
        } catch (e) { }
    };

    useEffect(() => {
        if (!parttimeId) {
            setAnnouncements([]);
            setLoading(false);
            return;
        }

        const db = getDb();
        const q = query(
            collection(db, 'parttimes', parttimeId, 'announcements'),
            orderBy('createdAt', 'desc'),
        );

        let latestData: Announcement[] = [];

        const unsubscribe = onSnapshot(q, (snap) => {
            const data: Announcement[] = [];
            snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Announcement));
            latestData = data;
            setAnnouncements(data);
            checkState(data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });

        const subRead = DeviceEventEmitter.addListener('announcementRead', (id: string) => {
            setReadIds(prev => {
                const updated = [...prev, id];
                const visible = latestData.filter(a => !hiddenIds.includes(a.id));
                setUnreadCount(visible.filter(a => !updated.includes(a.id)).length);
                return updated;
            });
        });

        const subHide = DeviceEventEmitter.addListener('announcementHidden', (id: string) => {
            setHiddenIds(prev => {
                const updated = [...prev, id];
                const visible = latestData.filter(a => !updated.includes(a.id));
                setUnreadCount(visible.filter(a => !readIds.includes(a.id)).length);
                return updated;
            });
        });

        return () => {
            unsubscribe();
            subRead.remove();
            subHide.remove();
        };
    }, [hiddenIds, readIds, parttimeId]);

    const markAsRead = async (id: string) => {
        if (readIds.includes(id)) return;
        try {
            const newRead = [...readIds, id];
            setReadIds(newRead);
            await AsyncStorage.setItem('readAnnouncements', JSON.stringify(newRead));
            DeviceEventEmitter.emit('announcementRead', id);
        } catch (e) { }
    };

    const hideAnnouncement = async (id: string) => {
        if (hiddenIds.includes(id)) return;
        try {
            const newHidden = [...hiddenIds, id];
            setHiddenIds(newHidden);
            await AsyncStorage.setItem('hiddenAnnouncements', JSON.stringify(newHidden));
            DeviceEventEmitter.emit('announcementHidden', id);
        } catch (e) { }
    };

    return {
        announcements: announcements.filter(a => !hiddenIds.includes(a.id)),
        readIds,
        loading,
        unreadCount,
        markAsRead,
        hideAnnouncement
    };
};
