import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../hooks/useTheme';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

type EmployeeAgg = {
    uid: string;
    name: string;
    revenue: number;
    tips: number;
    txCount: number;
    lastDate: string;
};

export default function AdminStaffView() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { transactions, adminUsers } = useAdmin();
    const [search, setSearch] = useState('');

    const employees = useMemo(() => {
        const map: Record<string, EmployeeAgg> = {};
        for (const t of transactions) {
            if (!t.userId) continue;
            if (!map[t.userId]) {
                map[t.userId] = { uid: t.userId, name: t.userName || 'Unknown', revenue: 0, tips: 0, txCount: 0, lastDate: '' };
            }
            map[t.userId].revenue += t.totalAmount || 0;
            map[t.userId].tips += t.tip || 0;
            map[t.userId].txCount += 1;
            if (t.date > map[t.userId].lastDate) map[t.userId].lastDate = t.date;
        }
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [transactions]);

    const totalRevenue = useMemo(() => transactions.reduce((s, t) => s + (t.totalAmount || 0), 0), [transactions]);

    const filtered = employees.filter(e =>
        !search || e.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, isDark && styles.textW]}>Staff</Text>
                    <Text style={styles.subtitle}>{employees.length} team members</Text>
                </View>
                <TouchableOpacity
                    style={[styles.manageBtn, isDark && { backgroundColor: '#1c1c1e' }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/admin-users' as any);
                    }}
                >
                    <Ionicons name="settings-outline" size={16} color="#007AFF" />
                    <Text style={styles.manageBtnText}>Manage</Text>
                </TouchableOpacity>
            </View>

            {/* Total Revenue Banner */}
            <View style={[styles.revCard, isDark && styles.cardDark]}>
                <Text style={[styles.revLabel, isDark && { color: '#98989d' }]}>TOTAL SALES REVENUE</Text>
                <Text style={[styles.revValue, isDark && styles.textW]}>{formatCurrency(totalRevenue)}</Text>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <View style={[styles.searchBar, isDark && styles.cardDark]}>
                    <Ionicons name="search" size={16} color="#8e8e93" />
                    <TextInput
                        style={[styles.searchInput, isDark && styles.textW]}
                        placeholder="Search staff..."
                        placeholderTextColor="#8e8e93"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Employee List */}
            <FlatList
                data={filtered}
                keyExtractor={e => e.uid}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                    const contribution = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
                    const isTop = index === 0 && employees.length > 1;
                    return (
                        <TouchableOpacity
                            style={[styles.empCard, isDark && styles.cardDark]}
                            activeOpacity={0.7}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push({ pathname: '/admin-employee-detail', params: { uid: item.uid, name: item.name } } as any);
                            }}
                        >
                            <View style={styles.empTop}>
                                <View style={styles.empNameRow}>
                                    <View style={[styles.avatar, { backgroundColor: isTop ? '#FF9F0A20' : '#007AFF18' }]}>
                                        <Text style={[styles.avatarText, { color: isTop ? '#FF9F0A' : '#007AFF' }]}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={[styles.empName, isDark && styles.textW]}>{item.name}</Text>
                                            {isTop && <Text style={{ fontSize: 14 }}>🏆</Text>}
                                            {isTop && <Text style={styles.topLabel}>Top Seller</Text>}
                                        </View>
                                        <Text style={styles.empSub}>{item.txCount} transaction{item.txCount !== 1 ? 's' : ''}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? '#48484a' : '#c7c7cc'} />
                            </View>

                            <View style={[styles.empDivider, isDark && { backgroundColor: '#2c2c2e' }]} />

                            <View style={styles.empStats}>
                                <View style={styles.empStat}>
                                    <Text style={styles.empStatLabel}>Revenue</Text>
                                    <Text style={[styles.empStatVal, { color: '#007AFF' }]}>{formatCurrency(item.revenue)}</Text>
                                </View>
                                <View style={styles.empStat}>
                                    <Text style={styles.empStatLabel}>Tips</Text>
                                    <Text style={[styles.empStatVal, { color: '#30D158' }]}>{formatCurrency(item.tips)}</Text>
                                </View>
                                <View style={styles.empStat}>
                                    <Text style={styles.empStatLabel}>Contribution</Text>
                                    <Text style={[styles.empStatVal, isDark && styles.textW]}>{contribution}%</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    containerDark: { backgroundColor: '#000' },
    textW: { color: '#fff' },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 34, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },
    manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    manageBtnText: { fontSize: 13, fontFamily: 'Outfit_600SemiBold', color: '#007AFF' },
    revCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardDark: { backgroundColor: '#1c1c1e' },
    revLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: '#8e8e93', letterSpacing: 0.5, marginBottom: 4 },
    revValue: { fontSize: 36, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.5 },
    searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 42, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#000' },
    list: { paddingHorizontal: 20, paddingBottom: 120 },
    empCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    empTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    empNameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontFamily: 'Outfit_700Bold' },
    empName: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    topLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: '#FF9F0A' },
    empSub: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },
    empDivider: { height: 1, backgroundColor: '#f2f2f7', marginVertical: 14 },
    empStats: { flexDirection: 'row', justifyContent: 'space-between' },
    empStat: { flex: 1 },
    empStatLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
    empStatVal: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#000' },
});
