import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getDb } from '../../firebase';
import { useTheme } from '../../hooks/useTheme';

type Announcement = {
    id: string;
    title: string;
    body: string;
    createdAt: number;
    createdBy: string;
};

export default function AdminAnnouncements() {
    const { user, parttimeId } = useAuth();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const db = getDb();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ title: '', body: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!parttimeId) return;
        setLoading(true);
        const q = query(collection(db, 'parttimes', parttimeId, 'announcements'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            const data: Announcement[] = [];
            snap.forEach(d => data.push({ id: d.id, ...d.data() } as Announcement));
            setAnnouncements(data);
            setLoading(false);
        });
        return () => unsub();
    }, [parttimeId]);

    const handleSave = async () => {
        if (!parttimeId || !user) return;
        if (!form.title.trim() || !form.body.trim()) {
            Alert.alert('Missing Fields', 'Title and message are required.');
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, 'parttimes', parttimeId, 'announcements'), {
                title: form.title.trim(),
                body: form.body.trim(),
                createdAt: Date.now(),
                createdBy: user.displayName || user.email || 'Admin',
            });
            setForm({ title: '', body: '' });
            setModalVisible(false);
        } catch (e) {
            Alert.alert('Error', 'Failed to post announcement.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string, title: string) => {
        Alert.alert('Delete Announcement', `Are you sure you want to delete "${title}"? This will remove it from all employee devices.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (!parttimeId) return;
                    await deleteDoc(doc(db, 'parttimes', parttimeId, 'announcements', id));
                }
            }
        ]);
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
                <View style={styles.center}><ActivityIndicator size="large" color="#0A84FF" /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            <View style={styles.pageHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, isDark && styles.textDark]}>Announcements</Text>
                    <Text style={styles.subtitle}>Broadcast to all staff</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.postBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.postText}>Post</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={announcements}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={() => (
                    <View style={styles.emptyWrap}>
                        <Ionicons name="megaphone-outline" size={48} color="#c7c7cc" />
                        <Text style={[styles.emptyTitle, isDark && styles.textDark]}>No Announcements</Text>
                        <Text style={styles.emptySub}>Post your first announcement to notify employees.</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <View style={[styles.card, isDark && styles.cardDark]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIconWrap}>
                                <Ionicons name="megaphone" size={20} color="#0A84FF" />
                            </View>
                            <View style={styles.cardMeta}>
                                <Text style={[styles.cardTitle, isDark && styles.textDark]}>{item.title}</Text>
                                <Text style={styles.cardDate}>{formatDate(item.createdAt)} • {item.createdBy}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.delBtn}>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.cardBody, isDark && styles.textDark]}>{item.body}</Text>
                    </View>
                )}
            />

            <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, isDark && styles.modalBoxDark]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, isDark && styles.textDark]}>New Post</Text>
                                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Text style={[styles.headerBtn, { color: '#8e8e93' }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                                        <Text style={[styles.headerBtn, { color: '#0A84FF', fontFamily: 'Outfit_700Bold' }]}>{isSaving ? '...' : 'Post'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.modalBody}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput 
                                    style={[styles.input, isDark && styles.inputDark]} 
                                    placeholder="e.g. Holiday Schedule" 
                                    placeholderTextColor="#8e8e93"
                                    value={form.title}
                                    onChangeText={t => setForm(f => ({ ...f, title: t }))}
                                />
                                <Text style={[styles.label, { marginTop: 16 }]}>Message</Text>
                                <TextInput 
                                    style={[styles.input, isDark && styles.inputDark, { minHeight: 120, textAlignVertical: 'top' }]} 
                                    placeholder="Type your announcement here..." 
                                    placeholderTextColor="#8e8e93"
                                    multiline
                                    value={form.body}
                                    onChangeText={t => setForm(f => ({ ...f, body: t }))}
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    containerDark: { backgroundColor: '#000' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    textDark: { color: '#fff' },
    pageHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    title: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#8e8e93', fontFamily: 'Outfit_400Regular', marginTop: 2 },
    postBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A84FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
    postText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit_600SemiBold' },
    list: { padding: 16, paddingBottom: 100 },
    emptyWrap: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', color: '#000', marginTop: 16 },
    emptySub: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: '#8e8e93', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
    cardDark: { backgroundColor: '#1c1c1e' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(10, 132, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cardMeta: { flex: 1 },
    cardTitle: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    cardDate: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 4 },
    delBtn: { padding: 4 },
    cardBody: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: '#000', lineHeight: 22 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#f2f2f7', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
    modalBoxDark: { backgroundColor: '#000', borderWidth: 1, borderColor: '#2c2c2e' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modalTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#000' },
    headerBtn: { fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#000' },
    modalBody: { padding: 20 },
    label: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: '#8e8e93', marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: 'Outfit_400Regular', color: '#000', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    inputDark: { backgroundColor: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }
});
