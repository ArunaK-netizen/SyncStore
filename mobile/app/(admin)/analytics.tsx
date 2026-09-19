import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../hooks/useTheme';

const screenWidth = Dimensions.get('window').width;

const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

type Period = '7d' | '30d' | 'all';

export default function AdminAnalyticsView() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const { transactions } = useAdmin();
    const [period, setPeriod] = useState<Period>('7d');
    const [periodModal, setPeriodModal] = useState(false);

    const periodLabel: Record<Period, string> = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', all: 'All Time' };

    const filteredTxs = useMemo(() => {
        const now = Date.now();
        const cutoff = period === '7d' ? now - 7 * 86400000
                     : period === '30d' ? now - 30 * 86400000
                     : 0;
        return transactions.filter(t => t.timestamp >= cutoff);
    }, [transactions, period]);

    const stats = useMemo(() => {
        const totalRev = filteredTxs.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
        const totalTips = filteredTxs.reduce((acc, t) => acc + (t.tip || 0), 0);
        const avgPerTransaction = filteredTxs.length > 0 ? totalRev / filteredTxs.length : 0;

        const paymentMap: Record<string, number> = {};
        filteredTxs.forEach(t => {
            paymentMap[t.paymentMethod] = (paymentMap[t.paymentMethod] || 0) + (t.totalAmount || 0);
        });

        const catMap: Record<string, { qty: number; revenue: number }> = {};
        const productMap: Record<string, { qty: number; revenue: number }> = {};
        
        filteredTxs.forEach(t => {
            t.items?.forEach(item => {
                // categories
                if (!catMap[item.category]) catMap[item.category] = { qty: 0, revenue: 0 };
                catMap[item.category].qty += item.quantity;
                catMap[item.category].revenue += item.price * item.quantity;
                
                // products
                const pName = item.productName || 'Unknown';
                if (!productMap[pName]) productMap[pName] = { qty: 0, revenue: 0 };
                productMap[pName].qty += item.quantity;
                productMap[pName].revenue += item.price * item.quantity;
            });
        });
        
        const topCategories = Object.entries(catMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
			
        const topProducts = Object.entries(productMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Pie chart colors
        const pieColors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
        const pieData = topProducts.map((p, idx) => ({
            value: p.revenue,
            color: pieColors[idx % pieColors.length],
            text: p.name,
            qty: p.qty
        }));

        return { totalRev, totalTips, avgPerTransaction, paymentMap, topCategories, topProducts, pieData, pieColors, txCount: filteredTxs.length };
    }, [filteredTxs]);

    const chartData = useMemo(() => {
        if (period === 'all') {
            const monthlyMap: Record<string, number> = {};
            if (filteredTxs.length === 0) return [];
            
            const firstTx = [...filteredTxs].sort((a, b) => a.timestamp - b.timestamp)[0];
            const startMonth = new Date(firstTx.timestamp);
            startMonth.setDate(1);
            startMonth.setHours(0,0,0,0);
            const nowMonth = new Date();
            nowMonth.setDate(1);
            nowMonth.setHours(0,0,0,0);

            let curr = new Date(startMonth);
            while (curr <= nowMonth) {
                monthlyMap[curr.toISOString().substring(0, 7)] = 0;
                curr.setMonth(curr.getMonth() + 1);
            }

            filteredTxs.forEach(t => {
                if (t.date) {
                    const mKey = t.date.substring(0, 7);
                    if (monthlyMap[mKey] !== undefined) {
                        monthlyMap[mKey] += t.totalAmount || 0;
                    }
                }
            });
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return Object.entries(monthlyMap).map(([mKey, value]) => ({
                value,
                label: monthNames[parseInt(mKey.split('-')[1]) - 1] + " '" + mKey.substring(2, 4),
                frontColor: '#0A84FF',
            }));
        }

        const days = period === '7d' ? 7 : 30;
        const now = new Date();
        const dailyMap: Record<string, number> = {};
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            dailyMap[d.toISOString().split('T')[0]] = 0;
        }
        filteredTxs.forEach(t => {
            if (t.date && dailyMap[t.date] !== undefined) {
                dailyMap[t.date] += t.totalAmount || 0;
            }
        });
        return Object.entries(dailyMap).map(([date, value], i) => ({
            value,
            label: period === '30d' ? (i % 5 === 0 ? new Date(date).getDate().toString() : '') : new Date(date).getDate().toString(),
            frontColor: '#0A84FF',
        }));
    }, [filteredTxs, period]);

    const paymentColors: Record<string, string> = { cash: '#30D158', card: '#5E5CE6', upi: '#FF9F0A' };

    return (
        <SafeAreaView style={[st.container, isDark && st.containerDark]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
                {/* Header & Period Switcher */}
                <View style={st.headerRow}>
                    <Text style={[st.title, isDark && st.w]}>Analytics</Text>
                    <TouchableOpacity onPress={() => setPeriodModal(true)} style={[st.periodPill, isDark && st.periodPillDark]}>
                        <Text style={[st.periodPillText, isDark && st.w]}>{periodLabel[period]}</Text>
                        <Ionicons name="chevron-down" size={14} color={isDark ? '#8e8e93' : '#3c3c43'} />
                    </TouchableOpacity>
                </View>

                {/* KPI Row */}
                <View style={st.kpiRow}>
                    <View style={[st.kpiCard, isDark && st.cardDark]}>
                        <View style={[st.kpiIcon, { backgroundColor: '#007AFF15' }]}>
                            <Ionicons name="cash-outline" size={18} color="#007AFF" />
                        </View>
                        <Text style={[st.kpiVal, { color: '#007AFF' }]}>{fmt(stats.totalRev)}</Text>
                        <Text style={[st.kpiLbl, isDark && st.dim]}>REVENUE</Text>
                    </View>
                    <View style={[st.kpiCard, isDark && st.cardDark]}>
                        <View style={[st.kpiIcon, { backgroundColor: '#30D15815' }]}>
                            <Ionicons name="heart-outline" size={18} color="#30D158" />
                        </View>
                        <Text style={[st.kpiVal, { color: '#30D158' }]}>{fmt(stats.totalTips)}</Text>
                        <Text style={[st.kpiLbl, isDark && st.dim]}>TIPS</Text>
                    </View>
                </View>
                <View style={st.kpiRow}>
                    <View style={[st.kpiCard, isDark && st.cardDark]}>
                        <View style={[st.kpiIcon, { backgroundColor: '#5E5CE615' }]}>
                            <Ionicons name="receipt-outline" size={18} color="#5E5CE6" />
                        </View>
                        <Text style={[st.kpiVal, isDark && st.w]}>{stats.txCount}</Text>
                        <Text style={[st.kpiLbl, isDark && st.dim]}>TRANSACTIONS</Text>
                    </View>
                    <View style={[st.kpiCard, isDark && st.cardDark]}>
                        <View style={[st.kpiIcon, { backgroundColor: '#FF9F0A15' }]}>
                            <Ionicons name="analytics-outline" size={18} color="#FF9F0A" />
                        </View>
                        <Text style={[st.kpiVal, isDark && st.w]}>{fmt(stats.avgPerTransaction)}</Text>
                        <Text style={[st.kpiLbl, isDark && st.dim]}>AVG / TXN</Text>
                    </View>
                </View>

                {/* Revenue Chart */}
                <View style={[st.card, isDark && st.cardDark]}>
                    <View style={st.cardHeader}>
                        <Ionicons name="trending-up" size={18} color="#007AFF" />
                        <Text style={[st.cardTitle, isDark && st.w]}>Revenue Trend</Text>
                    </View>
                    {chartData.length > 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 4 }}>
                            {period === '30d' ? (
                                <LineChart
                                    data={chartData}
                                    color="#0A84FF"
                                    thickness={3}
                                    dataPointsColor="#0A84FF"
                                    hideRules
                                    xAxisThickness={0} yAxisThickness={0}
                                    yAxisTextStyle={{ color: '#8e8e93', fontSize: 10, fontFamily: 'Outfit_400Regular' }}
                                    xAxisLabelTextStyle={{ color: '#8e8e93', fontSize: 10, fontFamily: 'Outfit_400Regular' }}
                                    width={screenWidth - 80}
                                    isAnimated
                                    yAxisLabelPrefix="$"
                                    curved
                                    hideDataPoints={false}
                                />
                            ) : (
                                <BarChart
                                    data={chartData}
                                    barWidth={period === 'all' ? Math.max(8, (screenWidth - 120) / chartData.length) : 20}
                                    spacing={period === 'all' ? 4 : 14}
                                    roundedTop roundedBottom
                                    noOfSections={4}
                                    hideRules
                                    xAxisThickness={0} yAxisThickness={0}
                                    yAxisTextStyle={{ color: '#8e8e93', fontSize: 10, fontFamily: 'Outfit_400Regular' }}
                                    xAxisLabelTextStyle={{ color: '#8e8e93', fontSize: 10, fontFamily: 'Outfit_400Regular' }}
                                    width={screenWidth - 90}
                                    isAnimated
                                    yAxisLabelPrefix="$"
                                />
                            )}
                        </View>
                    ) : (
                        <Text style={st.emptyText}>No data for this period</Text>
                    )}
                </View>

                {/* Payment Methods */}
                <View style={[st.card, isDark && st.cardDark]}>
                    <Text style={[st.cardTitle, isDark && st.w, { marginBottom: 16 }]}>Payment Methods</Text>
                    {Object.keys(stats.paymentMap).length === 0 ? (
                        <Text style={st.emptyText}>No payment data</Text>
                    ) : (
                        Object.entries(stats.paymentMap).map(([method, amount]) => {
                            const pct = stats.totalRev > 0 ? (amount / stats.totalRev * 100) : 0;
                            return (
                                <View key={method} style={st.barRow}>
                                    <View style={st.barLabel}>
                                        <View style={[st.dot, { backgroundColor: paymentColors[method] || '#8e8e93' }]} />
                                        <Text style={[st.barLabelText, isDark && st.w]}>{method.toUpperCase()}</Text>
                                    </View>
                                    <View style={[st.barTrack, isDark && { backgroundColor: '#2c2c2e' }]}>
                                        <View style={[st.barFill, { width: `${pct}%` as any, backgroundColor: paymentColors[method] || '#8e8e93' }]} />
                                    </View>
                                    <Text style={[st.barValue, isDark && st.w]}>{fmt(amount)}</Text>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Top Products (Drilldown) */}
                <View style={[st.card, isDark && st.cardDark]}>
                    <Text style={[st.cardTitle, isDark && st.w, { marginBottom: 16 }]}>Top Products</Text>
                    {stats.topProducts.length === 0 ? (
                        <Text style={st.emptyText}>No product data</Text>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <View style={{ marginBottom: 20 }}>
                                <PieChart
                                    data={stats.pieData}
                                    donut
                                    radius={80}
                                    innerRadius={50}
                                    innerCircleColor={isDark ? '#1c1c1e' : '#fff'}
                                    centerLabelComponent={() => (
                                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ fontSize: 18, fontFamily: 'Outfit_700Bold', color: isDark ? '#fff' : '#000' }}>
                                                {stats.topProducts.length}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: '#8e8e93', fontFamily: 'Outfit_600SemiBold' }}>ITEMS</Text>
                                        </View>
                                    )}
                                />
                            </View>
                            <View style={{ width: '100%' }}>
                                {stats.pieData.map((item, idx) => (
                                    <View key={item.text} style={st.pieLegendRow}>
                                        <View style={st.pieLegendLeft}>
                                            <View style={[st.dot, { backgroundColor: item.color, marginRight: 8 }]} />
                                            <Text style={[st.catName, isDark && st.w]} numberOfLines={1}>{item.text}</Text>
                                        </View>
                                        <View style={st.pieLegendRight}>
                                            <Text style={[st.catRev, isDark && st.w]}>{fmt(item.value)}</Text>
                                            <Text style={[st.catQty, isDark && st.dim]}>{item.qty} sold</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Top Categories */}
                <View style={[st.card, isDark && st.cardDark]}>
                    <Text style={[st.cardTitle, isDark && st.w, { marginBottom: 16 }]}>Top Categories</Text>
                    {stats.topCategories.length === 0 ? (
                        <Text style={st.emptyText}>No category data</Text>
                    ) : (
                        stats.topCategories.map((cat, index) => (
                            <View key={cat.name} style={[st.catRow, index < stats.topCategories.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                                <View style={[st.rankBadge, isDark && { backgroundColor: '#2c2c2e' }]}>
                                    <Text style={st.rankText}>#{index + 1}</Text>
                                </View>
                                <Text style={[st.catName, isDark && st.w]}>{cat.name}</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[st.catRev, isDark && st.w]}>{fmt(cat.revenue)}</Text>
                                    <Text style={[st.catQty, isDark && st.dim]}>{cat.qty} sold</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Period Selection Modal */}
            <Modal visible={periodModal} transparent animationType="fade" onRequestClose={() => setPeriodModal(false)}>
                <View style={st.modalOverlay}>
                    <View style={[st.modalBox, isDark && st.cardDark]}>
                        <Text style={[st.modalTitle, isDark && st.w]}>Select Period</Text>
                        {(['7d', '30d', 'all'] as Period[]).map((p, idx) => (
                            <TouchableOpacity 
                                key={p} 
                                style={[st.modalRow, idx < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? '#2c2c2e' : '#e5e5ea' }]}
                                onPress={() => { setPeriod(p); setPeriodModal(false); }}
                            >
                                <Text style={[st.modalRowText, isDark && st.w, period === p && { color: '#0A84FF', fontFamily: 'Outfit_600SemiBold' }]}>
                                    {periodLabel[p]}
                                </Text>
                                {period === p && <Ionicons name="checkmark" size={20} color="#0A84FF" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={{ flex: 1, width: '100%' }} activeOpacity={1} onPress={() => setPeriodModal(false)} />
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    containerDark: { backgroundColor: '#000' },
    scroll: { padding: 20, paddingBottom: 0 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 34, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.5 },
    w: { color: '#fff' },
    dim: { color: '#8e8e93' },
    cardDark: { backgroundColor: '#1c1c1e' },

    periodPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
    periodPillDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
    periodPillText: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', color: '#000' },

    kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    kpiVal: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: '#000', marginBottom: 3 },
    kpiLbl: { fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#8e8e93', letterSpacing: 0.5 },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#000' },

    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    barLabel: { flexDirection: 'row', alignItems: 'center', width: 65, gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    barLabelText: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: '#000' },
    barTrack: { flex: 1, height: 8, backgroundColor: '#f2f2f7', borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    barValue: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', color: '#000', width: 65, textAlign: 'right' },

    catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    rankBadge: { backgroundColor: '#f2f2f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
    rankText: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: '#8e8e93' },
    catName: { flex: 1, fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#000', textTransform: 'capitalize' },
    catRev: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: '#000' },
    catQty: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },

    pieLegendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(142,142,147,0.3)' },
    pieLegendLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    pieLegendRight: { alignItems: 'flex-end' },

    emptyText: { textAlign: 'center', fontFamily: 'Outfit_400Regular', color: '#8e8e93', paddingVertical: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 },
    modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
    modalTitle: { fontSize: 13, fontFamily: 'Outfit_700Bold', color: '#8e8e93', textTransform: 'uppercase', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, letterSpacing: 0.5 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 },
    modalRowText: { fontSize: 16, fontFamily: 'Outfit_500Medium', color: '#000' }
});
