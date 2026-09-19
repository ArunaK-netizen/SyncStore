import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { getDb } from '../../firebase';
import { useTheme } from '../../hooks/useTheme';

export type ScheduleEntry = {
    id: string;
    employeeUid: string;
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    note?: string;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(weekOffset = 0): string[] {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff + weekOffset * 7);
    mon.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

function formatShiftTime(t: string): string {
    if (!t || !t.includes(':')) return t;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function AdminSchedule() {
    const { parttimeId } = useAuth();
    const { adminUsers, transactions } = useAdmin();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const db = getDb();

    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [weekOffset, setWeekOffset] = useState(0);
    const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
    const [selectedDate, setSelectedDate] = useState(weekDates[0]);

    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState<Partial<ScheduleEntry>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!parttimeId) return;
        setLoading(true);
        const q = collection(db, 'parttimes', parttimeId, 'schedules');
        const unsub = onSnapshot(q, snap => {
            const data: ScheduleEntry[] = [];
            snap.forEach(d => data.push({ id: d.id, ...d.data() } as ScheduleEntry));
            setSchedules(data);
            setLoading(false);
        });
        return () => unsub();
    }, [parttimeId]);

    useEffect(() => {
        const newDates = getWeekDates(weekOffset);
        if (!newDates.includes(selectedDate)) {
            setSelectedDate(newDates[0]);
        }
    }, [weekOffset]);

    const employeesList = useMemo(() => {
        const map: Record<string, string> = {};
        adminUsers.forEach(u => u.uid && (map[u.uid] = u.name || u.email));
        transactions.forEach(t => t.userId && t.userName && !map[t.userId] && (map[t.userId] = t.userName));
        return Object.entries(map).map(([uid, name]) => ({ uid, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [adminUsers, transactions]);

    const handleSaveShift = async () => {
        if (!parttimeId) return;
        if (!form.startTime || !form.endTime) {
            Alert.alert('Missing Info', 'Start and end time are required.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                employeeUid: form.employeeUid,
                employeeName: form.employeeName,
                date: selectedDate,
                startTime: form.startTime,
                endTime: form.endTime,
                note: form.note || '',
            };

            if (form.id) {
                await updateDoc(doc(db, 'parttimes', parttimeId, 'schedules', form.id), payload);
            } else {
                await addDoc(collection(db, 'parttimes', parttimeId, 'schedules'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
            }
            setModalVisible(false);
        } catch (e) {
            Alert.alert('Error', 'Failed to save shift.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteShift = (id: string) => {
        Alert.alert('Delete Shift', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (!parttimeId) return;
                    await deleteDoc(doc(db, 'parttimes', parttimeId, 'schedules', id));
                    setModalVisible(false);
                }
            }
        ]);
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
                <Text style={[styles.title, isDark && styles.textDark, { flex: 1 }]}>Schedule</Text>
                
                <View style={styles.weekControl}>
                    <TouchableOpacity onPress={() => setWeekOffset(o => o - 1)} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={20} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.weekLabel, isDark && styles.textDark]}>
                        {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} Wks`}
                    </Text>
                    <TouchableOpacity onPress={() => setWeekOffset(o => o + 1)} style={styles.iconBtn}>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.strip, isDark && styles.stripDark]}>
                {getWeekDates(weekOffset).map((dStr, idx) => {
                    const isSelected = selectedDate === dStr;
                    const dateObj = new Date(dStr + 'T00:00:00');
                    return (
                        <TouchableOpacity
                            key={dStr}
                            style={[styles.dayCol, isSelected && styles.dayColSelected]}
                            onPress={() => setSelectedDate(dStr)}
                        >
                            <Text style={[styles.dayName, isSelected && styles.textSelected, isDark && !isSelected && styles.textDark]}>
                                {DAYS[idx]}
                            </Text>
                            <Text style={[styles.dayNum, isSelected && styles.textSelected, isDark && !isSelected && styles.textDark]}>
                                {dateObj.getDate()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={employeesList}
                keyExtractor={e => e.uid}
                contentContainerStyle={styles.list}
                renderItem={({ item: emp }) => {
                    const empShifts = schedules.filter(s => s.employeeUid === emp.uid && s.date === selectedDate);
                    
                    return (
                        <View style={[styles.empCard, isDark && styles.empCardDark]}>
                            <View style={styles.empHeader}>
                                <View style={styles.empNameWrap}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{emp.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <Text style={[styles.empName, isDark && styles.textDark]}>{emp.name}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.addBtn}
                                    onPress={() => {
                                        setForm({ employeeUid: emp.uid, employeeName: emp.name, startTime: '09:00', endTime: '17:00' });
                                        setModalVisible(true);
                                    }}
                                >
                                    <Ionicons name="add" size={16} color="#0A84FF" />
                                    <Text style={styles.addText}>Add Shift</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.shiftsWrap}>
                                {empShifts.length === 0 ? (
                                    <Text style={styles.emptyShifts}>No shifts scheduled</Text>
                                ) : (
                                    empShifts.map(shift => (
                                        <TouchableOpacity 
                                            key={shift.id} 
                                            style={styles.shiftPill}
                                            onPress={() => {
                                                setForm(shift);
                                                setModalVisible(true);
                                            }}
                                        >
                                            <Ionicons name="time-outline" size={14} color="#5E5CE6" />
                                            <Text style={styles.shiftTime}>{formatShiftTime(shift.startTime)} – {formatShiftTime(shift.endTime)}</Text>
                                            {!!shift.note && <Text style={styles.shiftNote} numberOfLines={1}>• {shift.note}</Text>}
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, isDark && styles.modalBoxDark]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, isDark && styles.textDark]}>{form.id ? 'Edit Shift' : 'New Shift'}</Text>
                                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Text style={[styles.headerBtn, { color: '#8e8e93' }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSaveShift} disabled={isSaving}>
                                        <Text style={[styles.headerBtn, { color: '#0A84FF', fontFamily: 'Outfit_700Bold' }]}>{isSaving ? '...' : 'Save'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Employee</Text>
                                <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.employeeName} editable={false} />

                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Start (HH:MM)</Text>
                                        <TextInput 
                                            style={[styles.input, isDark && styles.inputDark]} 
                                            value={form.startTime} 
                                            onChangeText={t => setForm(f => ({ ...f, startTime: t }))}
                                            placeholder="09:00"
                                            keyboardType="numbers-and-punctuation"
                                            placeholderTextColor="#8e8e93"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>End (HH:MM)</Text>
                                        <TextInput 
                                            style={[styles.input, isDark && styles.inputDark]} 
                                            value={form.endTime} 
                                            onChangeText={t => setForm(f => ({ ...f, endTime: t }))}
                                            placeholder="17:00"
                                            keyboardType="numbers-and-punctuation"
                                            placeholderTextColor="#8e8e93"
                                        />
                                    </View>
                                </View>

                                <Text style={[styles.label, { marginTop: 16 }]}>Notes (Optional)</Text>
                                <TextInput 
                                    style={[styles.input, isDark && styles.inputDark, { minHeight: 80, textAlignVertical: 'top' }]} 
                                    value={form.note} 
                                    onChangeText={t => setForm(f => ({ ...f, note: t }))}
                                    multiline 
                                    placeholder="e.g. Opening shift"
                                    placeholderTextColor="#8e8e93"
                                />

                                {form.id && (
                                    <TouchableOpacity onPress={() => handleDeleteShift(form.id!)} style={styles.deleteFormBtn}>
                                        <Ionicons name="trash" size={18} color="#FF3B30" />
                                        <Text style={styles.deleteFormText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
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
    weekControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(142,142,147,0.12)', borderRadius: 20, paddingHorizontal: 4, paddingVertical: 4 },
    iconBtn: { padding: 4 },
    weekLabel: { fontSize: 13, fontFamily: 'Outfit_600SemiBold', width: 70, textAlign: 'center', color: '#000' },
    strip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    stripDark: { borderBottomColor: '#2c2c2e' },
    dayCol: { alignItems: 'center', paddingVertical: 10, flex: 1, borderRadius: 12 },
    dayColSelected: { backgroundColor: '#0A84FF' },
    dayName: { fontSize: 11, fontFamily: 'Outfit_500Medium', color: '#8e8e93', marginBottom: 4 },
    dayNum: { fontSize: 17, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    textSelected: { color: '#fff' },
    list: { padding: 16, paddingBottom: 100 },
    empCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
    empCardDark: { backgroundColor: '#1c1c1e' },
    empHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    empNameWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(10, 132, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    avatarText: { color: '#0A84FF', fontFamily: 'Outfit_700Bold', fontSize: 14 },
    empName: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10,132,255,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
    addText: { color: '#0A84FF', fontSize: 12, fontFamily: 'Outfit_600SemiBold' },
    shiftsWrap: { gap: 8 },
    emptyShifts: { fontSize: 13, color: '#8e8e93', fontFamily: 'Outfit_400Regular' },
    shiftPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(94, 92, 230, 0.1)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
    shiftTime: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', color: '#5E5CE6', marginLeft: 8 },
    shiftNote: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginLeft: 8, flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#f2f2f7', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10, maxHeight: '80%' },
    modalBoxDark: { backgroundColor: '#000', borderWidth: 1, borderColor: '#2c2c2e' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modalTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#000' },
    headerBtn: { fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#000' },
    modalBody: { padding: 20 },
    label: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: '#8e8e93', marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: 'Outfit_400Regular', color: '#000', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    inputDark: { backgroundColor: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' },
    deleteFormBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingVertical: 14, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 16, gap: 8 },
    deleteFormText: { color: '#FF3B30', fontSize: 16, fontFamily: 'Outfit_600SemiBold' }
});
