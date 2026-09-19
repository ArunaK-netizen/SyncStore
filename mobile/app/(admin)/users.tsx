import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../hooks/useTheme';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

type TabName = 'whitelist' | 'admins' | 'employees';

export default function AdminUsers() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const {
        adminUsers, adminEmails, accessRequests, transactions,
        approveAccessRequest, rejectAccessRequest, removeAdminUser,
        addAdminEmail, removeAdminEmail
    } = useAdmin();

    const [activeTab, setActiveTab] = useState<TabName>('whitelist');
    const [newAdminEmail, setNewAdminEmail] = useState('');

    const employeesFromTx = useMemo(() => {
        const map: Record<string, { uid: string; name: string; revenue: number; txCount: number; lastDate: string }> = {};
        for (const t of transactions) {
            if (!t.userId) continue;
            if (!map[t.userId]) map[t.userId] = { uid: t.userId, name: t.userName || 'Unknown', revenue: 0, txCount: 0, lastDate: '' };
            map[t.userId].revenue += t.totalAmount || 0;
            map[t.userId].txCount += 1;
            if (t.date > map[t.userId].lastDate) map[t.userId].lastDate = t.date;
        }
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [transactions]);

    const pendingRequests = accessRequests.filter(r => r.status === 'pending');

    const handleConfirmRemoveWhitelist = (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Remove Employee', 'Revoke mobile app access?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeAdminUser(id) }
        ]);
    };

    const handleConfirmRemoveAdmin = (email: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Remove Admin', 'Revoke admin dashboard access?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeAdminEmail(email) }
        ]);
    };

    const handleAddAdmin = () => {
        if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addAdminEmail(newAdminEmail.trim().toLowerCase());
        setNewAdminEmail('');
    };

    const tabs: { key: TabName; label: string; count: number }[] = [
        { key: 'whitelist', label: 'Whitelist', count: adminUsers.length },
        { key: 'admins', label: 'Admins', count: adminEmails.length },
        { key: 'employees', label: 'Active', count: employeesFromTx.length },
    ];

    return (
        <SafeAreaView style={[st.container, isDark && st.containerDark]} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Custom Header */}
                <View style={st.header}>
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={st.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[st.headerTitle, isDark && st.w]}>Users & Access</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tab Pills */}
                <View style={st.tabRow}>
                    {tabs.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(t.key); }}
                            style={[st.tabPill, activeTab === t.key && st.tabPillActive]}
                        >
                            <Text style={[st.tabPillText, activeTab === t.key && st.tabPillTextActive]}>{t.label}</Text>
                            <View style={[st.tabCount, activeTab === t.key && st.tabCountActive]}>
                                <Text style={[st.tabCountText, activeTab === t.key && st.tabCountTextActive]}>{t.count}</Text>
                            </View>
                            {t.key === 'whitelist' && pendingRequests.length > 0 && activeTab !== 'whitelist' && (
                                <View style={st.redDot} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* WHITELIST TAB */}
                {activeTab === 'whitelist' && (
                    <FlatList
                        data={adminUsers}
                        keyExtractor={item => item.id}
                        contentContainerStyle={st.list}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <>
                                {pendingRequests.length > 0 && (
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={[st.sectionLbl, isDark && st.dim]}>PENDING REQUESTS</Text>
                                        {pendingRequests.map(req => (
                                            <View key={req.id} style={[st.card, isDark && st.cardDark]}>
                                                <View style={st.row}>
                                                    <View style={[st.avatar, { backgroundColor: '#FF375F15' }]}>
                                                        <Text style={[st.avatarText, { color: '#FF375F' }]}>{req.name.charAt(0).toUpperCase()}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[st.name, isDark && st.w]}>{req.name}</Text>
                                                        <Text style={st.email}>{req.email}</Text>
                                                    </View>
                                                    <TouchableOpacity style={st.rejectBtn} onPress={() => rejectAccessRequest(req.id)}>
                                                        <Ionicons name="close" size={18} color="#FF3B30" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={st.approveBtn} onPress={() => approveAccessRequest(req)}>
                                                        <Ionicons name="checkmark" size={18} color="#30D158" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <Text style={[st.sectionLbl, isDark && st.dim]}>APPROVED ({adminUsers.length})</Text>
                            </>
                        }
                        renderItem={({ item }) => (
                            <View style={[st.card, isDark && st.cardDark]}>
                                <View style={st.row}>
                                    <View style={[st.avatar, { backgroundColor: '#007AFF15' }]}>
                                        <Text style={[st.avatarText, { color: '#007AFF' }]}>{(item.name || item.email).charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[st.name, isDark && st.w]}>{item.name || 'Unknown'}</Text>
                                        <Text style={st.email}>{item.email}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleConfirmRemoveWhitelist(item.id)} style={st.deleteBtn}>
                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={st.emptyText}>No whitelisted employees</Text>}
                    />
                )}

                {/* ADMINS TAB */}
                {activeTab === 'admins' && (
                    <FlatList
                        data={adminEmails}
                        keyExtractor={item => item}
                        contentContainerStyle={st.list}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={[st.addRow, isDark && st.cardDark]}>
                                <TextInput
                                    style={[st.addInput, isDark && st.w]}
                                    placeholder="admin@gmail.com"
                                    placeholderTextColor="#8e8e93"
                                    value={newAdminEmail}
                                    onChangeText={setNewAdminEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                <TouchableOpacity style={st.addBtn} onPress={handleAddAdmin}>
                                    <Text style={st.addBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={[st.card, isDark && st.cardDark]}>
                                <View style={st.row}>
                                    <View style={[st.avatar, { backgroundColor: '#5E5CE615' }]}>
                                        <Text style={[st.avatarText, { color: '#5E5CE6' }]}>{item.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <Text style={[st.name, isDark && st.w, { flex: 1 }]}>{item}</Text>
                                    <TouchableOpacity onPress={() => handleConfirmRemoveAdmin(item)} style={st.deleteBtn}>
                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                )}

                {/* ACTIVE EMPLOYEES TAB */}
                {activeTab === 'employees' && (
                    <FlatList
                        data={employeesFromTx}
                        keyExtractor={item => item.uid}
                        contentContainerStyle={st.list}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => {
                            const isTop = index === 0 && employeesFromTx.length > 1;
                            return (
                                <View style={[st.card, isDark && st.cardDark]}>
                                    <View style={st.row}>
                                        <View style={[st.avatar, { backgroundColor: isTop ? '#FF9F0A15' : '#30D15815' }]}>
                                            <Text style={[st.avatarText, { color: isTop ? '#FF9F0A' : '#30D158' }]}>{item.name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={[st.name, isDark && st.w]}>{item.name}</Text>
                                                {isTop && <Text style={{ fontSize: 14 }}>🏆</Text>}
                                            </View>
                                            <Text style={st.email}>{item.txCount} sales · Last: {item.lastDate ? new Date(item.lastDate).toLocaleDateString() : 'N/A'}</Text>
                                        </View>
                                        <Text style={[st.revVal, isDark && st.w]}>{formatCurrency(item.revenue)}</Text>
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={<Text style={st.emptyText}>No active employees found</Text>}
                    />
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    containerDark: { backgroundColor: '#000' },
    w: { color: '#fff' },
    dim: { color: '#8e8e93' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#000' },

    tabRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
    tabPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'transparent' },
    tabPillActive: { backgroundColor: '#007AFF' },
    tabPillText: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', color: '#8e8e93' },
    tabPillTextActive: { color: '#fff' },
    tabCount: { backgroundColor: '#e5e5ea', borderRadius: 10, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    tabCountText: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: '#8e8e93' },
    tabCountTextActive: { color: '#fff' },
    redDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },

    list: { paddingHorizontal: 20, paddingBottom: 120 },
    sectionLbl: { fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#8e8e93', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },

    card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardDark: { backgroundColor: '#1c1c1e' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 17, fontFamily: 'Outfit_700Bold' },
    name: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    email: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },
    revVal: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: '#000' },

    deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FF3B3010', alignItems: 'center', justifyContent: 'center' },
    rejectBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FF3B3010', alignItems: 'center', justifyContent: 'center' },
    approveBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#30D15810', alignItems: 'center', justifyContent: 'center' },

    addRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 6, marginBottom: 20, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    addInput: { flex: 1, height: 42, paddingHorizontal: 14, fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#000' },
    addBtn: { backgroundColor: '#007AFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
    addBtnText: { fontSize: 14, fontFamily: 'Outfit_700Bold', color: '#fff' },

    emptyText: { textAlign: 'center', fontFamily: 'Outfit_400Regular', color: '#8e8e93', paddingVertical: 32, fontSize: 14 },
});
