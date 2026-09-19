import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - 40 - CARD_GAP) / 2;

const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export default function AdminDashboardView() {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const { transactions, adminUsers } = useAdmin();

    const today = format(new Date(), 'yyyy-MM-dd');
    const thisMonth = format(new Date(), 'yyyy-MM');

    // ── Computed stats ──────────────────────────────────────────────
    const stats = useMemo(() => {
        const todayTx = transactions.filter(t => t.date === today);
        const monthTx = transactions.filter(t => t.date?.startsWith(thisMonth));
        const todayRev = todayTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
        const monthRev = monthTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
        const todayTips = todayTx.reduce((s, t) => s + (t.tip || 0), 0);
        const avgTx = todayTx.length > 0 ? todayRev / todayTx.length : 0;
        return { todayRev, monthRev, todayTips, todayCount: todayTx.length, avgTx };
    }, [transactions, today, thisMonth]);

    // ── Revenue sparkline (last 7 days) ─────────────────────────────
    const sparkData = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            return { val: transactions.filter(t => t.date === dateStr).reduce((s, t) => s + (t.totalAmount || 0), 0), day: format(d, 'EEE').charAt(0) };
        });
    }, [transactions]);
    const maxSpark = Math.max(...sparkData.map(s => s.val), 1);

    // ── Top performer today ─────────────────────────────────────────
    const topPerformer = useMemo(() => {
        const todayTx = transactions.filter(t => t.date === today);
        const perf: Record<string, { name: string; rev: number; count: number }> = {};
        todayTx.forEach(t => {
            if (!t.userId) return;
            if (!perf[t.userId]) perf[t.userId] = { name: t.userName || 'Unknown', rev: 0, count: 0 };
            perf[t.userId].rev += t.totalAmount || 0;
            perf[t.userId].count += 1;
        });
        return Object.values(perf).sort((a, b) => b.rev - a.rev)[0] || null;
    }, [transactions, today]);

    // ── Recent transactions (last 5) ────────────────────────────────
    const recentTx = useMemo(() => {
        return [...transactions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
    }, [transactions]);

    const nav = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(route as any);
    };

    return (
        <SafeAreaView style={[s.container, isDark && s.containerDark]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={[s.dateText, isDark && s.dim]}>{format(new Date(), 'EEEE, MMMM do')}</Text>
                    <Text style={[s.title, isDark && s.w]}>Dashboard</Text>
                </View>

                {/* ── Today's KPIs ── */}
                <View style={s.kpiGrid}>
                    {[
                        { label: "TODAY'S REVENUE", val: fmt(stats.todayRev), color: '#007AFF', icon: 'cash-outline' },
                        { label: 'SALES COUNT', val: String(stats.todayCount), color: '#30D158', icon: 'cart-outline' },
                        { label: 'AVG TRANSACTION', val: fmt(stats.avgTx), color: '#FF9F0A', icon: 'analytics-outline' },
                        { label: 'TIPS EARNED', val: fmt(stats.todayTips), color: '#AF52DE', icon: 'heart-outline' },
                    ].map((k, i) => (
                        <View key={i} style={[s.kpiCard, isDark && s.cardDark]}>
                            <View style={[s.kpiIcon, { backgroundColor: k.color + '15' }]}>
                                <Ionicons name={k.icon as any} size={18} color={k.color} />
                            </View>
                            <Text style={[s.kpiVal, { color: k.color }]}>{k.val}</Text>
                            <Text style={[s.kpiLbl, isDark && s.dim]}>{k.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── 7-Day Revenue Trend ── */}
                <View style={[s.card, isDark && s.cardDark]}>
                    <View style={s.cardHeader}>
                        <Text style={[s.cardTitle, isDark && s.w]}>Weekly Revenue</Text>
                        <Text style={[s.cardSub, isDark && s.dim]}>{fmt(sparkData.reduce((s, d) => s + d.val, 0))}</Text>
                    </View>
                    <View style={s.sparkRow}>
                        {sparkData.map((d, i) => {
                            const h = Math.max((d.val / maxSpark) * 56, 4);
                            const isToday = i === 6;
                            return (
                                <View key={i} style={s.sparkCol}>
                                    <View style={[s.sparkBar, { height: h, backgroundColor: isToday ? '#007AFF' : isDark ? '#2c2c2e' : '#e5e5ea', borderRadius: 6 }]} />
                                    <Text style={[s.sparkLbl, isDark && s.dim, isToday && { color: '#007AFF', fontFamily: 'Outfit_700Bold' }]}>{d.day}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ── Top Performer Today ── */}
                {topPerformer && (
                    <View style={[s.card, isDark && s.cardDark]}>
                        <View style={s.cardHeader}>
                            <Text style={[s.cardTitle, isDark && s.w]}>Top Performer Today</Text>
                            <Text style={{ fontSize: 18 }}>🏆</Text>
                        </View>
                        <View style={s.perfRow}>
                            <View style={[s.perfAvatar, { backgroundColor: '#FF9F0A18' }]}>
                                <Text style={s.perfAvatarText}>{topPerformer.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.perfName, isDark && s.w]}>{topPerformer.name}</Text>
                                <Text style={[s.perfSub, isDark && s.dim]}>{topPerformer.count} sale{topPerformer.count !== 1 ? 's' : ''} today</Text>
                            </View>
                            <Text style={s.perfVal}>{fmt(topPerformer.rev)}</Text>
                        </View>
                    </View>
                )}

                {/* ── Quick Actions (only sub-screens NOT in tabs) ── */}
                <Text style={[s.sectionTitle, isDark && s.w]}>Quick Actions</Text>
                <View style={s.actionRow}>
                    {[
                        { label: 'Sales', icon: 'receipt-outline', color: '#FF9F0A', route: '/admin-sales' },
                        { label: 'Schedule', icon: 'calendar-outline', color: '#AF52DE', route: '/admin-schedule' },
                        { label: 'Announce', icon: 'megaphone-outline', color: '#FF375F', route: '/admin-announcements' },
                        { label: 'Users', icon: 'people-outline', color: '#007AFF', route: '/admin-users' },
                    ].map((a, i) => (
                        <TouchableOpacity key={i} style={[s.actionItem, isDark && s.cardDark]} onPress={() => nav(a.route)} activeOpacity={0.7}>
                            <View style={[s.actionIcon, { backgroundColor: a.color + '15' }]}>
                                <Ionicons name={a.icon as any} size={20} color={a.color} />
                            </View>
                            <Text style={[s.actionLbl, isDark && s.w]}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Recent Activity ── */}
                <Text style={[s.sectionTitle, isDark && s.w, { marginTop: 24 }]}>Recent Activity</Text>
                {recentTx.length === 0 ? (
                    <View style={[s.card, isDark && s.cardDark, { alignItems: 'center', paddingVertical: 32 }]}>
                        <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
                        <Text style={[s.emptyText, isDark && s.dim]}>No transactions yet</Text>
                    </View>
                ) : (
                    <View style={[s.card, isDark && s.cardDark, { padding: 0, overflow: 'hidden' }]}>
                        {recentTx.map((tx, i) => {
                            const itemCount = (tx.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
                            return (
                                <View key={tx.id || i} style={[s.txRow, i < recentTx.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                                    <View style={[s.txIcon, { backgroundColor: tx.paymentMethod === 'cash' ? '#30D15815' : tx.paymentMethod === 'card' ? '#5E5CE615' : '#FF9F0A15' }]}>
                                        <Ionicons name={tx.paymentMethod === 'cash' ? 'cash-outline' : tx.paymentMethod === 'card' ? 'card-outline' : 'phone-portrait-outline'} size={16} color={tx.paymentMethod === 'cash' ? '#30D158' : tx.paymentMethod === 'card' ? '#5E5CE6' : '#FF9F0A'} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.txName, isDark && s.w]}>{tx.userName || 'Unknown'}</Text>
                                        <Text style={[s.txSub, isDark && s.dim]}>{tx.date} · {itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
                                    </View>
                                    <Text style={s.txAmt}>{fmt(tx.totalAmount || 0)}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* ── Month Overview ── */}
                <View style={[s.card, isDark && s.cardDark, { marginTop: 16 }]}>
                    <Text style={[s.cardTitle, isDark && s.w]}>This Month</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                        <View>
                            <Text style={[s.kpiLbl, isDark && s.dim]}>REVENUE</Text>
                            <Text style={[s.monthVal, { color: '#007AFF' }]}>{fmt(stats.monthRev)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[s.kpiLbl, isDark && s.dim]}>TEAM SIZE</Text>
                            <Text style={[s.monthVal, isDark && s.w]}>{adminUsers.length}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    containerDark: { backgroundColor: '#000' },
    scroll: { paddingHorizontal: 20 },
    header: { paddingTop: 8, paddingBottom: 20 },
    dateText: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: '#8e8e93', letterSpacing: -0.1 },
    title: { fontSize: 34, fontFamily: 'Outfit_700Bold', color: '#000', marginTop: 2, letterSpacing: -0.5 },
    w: { color: '#fff' },
    dim: { color: '#8e8e93' },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, marginBottom: 16 },
    kpiCard: { width: CARD_W, backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardDark: { backgroundColor: '#1c1c1e' },
    kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    kpiVal: { fontSize: 20, fontFamily: 'Outfit_700Bold', letterSpacing: -0.3, marginBottom: 3 },
    kpiLbl: { fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#8e8e93', letterSpacing: 0.5 },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#000' },
    cardSub: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', color: '#8e8e93' },

    sparkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 72 },
    sparkCol: { alignItems: 'center', flex: 1, gap: 4 },
    sparkBar: { width: 22 },
    sparkLbl: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: '#8e8e93' },

    perfRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    perfAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    perfAvatarText: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#FF9F0A' },
    perfName: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    perfSub: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },
    perfVal: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#007AFF' },

    sectionTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#000', marginBottom: 12, letterSpacing: -0.3 },

    actionRow: { flexDirection: 'row', gap: 10 },
    actionItem: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLbl: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', color: '#000' },

    txRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    txName: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    txSub: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },
    txAmt: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: '#007AFF' },

    monthVal: { fontSize: 22, fontFamily: 'Outfit_700Bold', color: '#000', marginTop: 4 },
    emptyText: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: '#8e8e93' },
});
