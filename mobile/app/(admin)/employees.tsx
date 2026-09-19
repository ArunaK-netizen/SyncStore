import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../hooks/useTheme';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

export default function AdminEmployees() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { transactions } = useAdmin();

    const employees = useMemo(() => {
        const map: Record<string, { uid: string; name: string; revenue: number; txCount: number; tip: number }> = {};
        for (const t of transactions) {
            if (!t.userId) continue;
            if (!map[t.userId]) {
                map[t.userId] = { uid: t.userId, name: t.userName || 'Unknown', revenue: 0, txCount: 0, tip: 0 };
            }
            map[t.userId].revenue += t.totalAmount || 0;
            map[t.userId].txCount += 1;
            map[t.userId].tip += t.tip || 0;
        }
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [transactions]);

    const totalRevenue = employees.reduce((acc, curr) => acc + curr.revenue, 0);

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <View style={[styles.headerCard, isDark && styles.cardDark]}>
                <Text style={styles.headerLabel}>Total Sales Revenue</Text>
                <Text style={[styles.headerValue, isDark && styles.textDark]}>{formatCurrency(totalRevenue)}</Text>
            </View>

            <FlatList
                data={employees}
                keyExtractor={item => item.uid}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => {
                    const contribution = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0;
                    return (
                        <TouchableOpacity 
                            style={[styles.card, isDark && styles.cardDark]}
                            onPress={() => router.push({ pathname: '/(admin)/employee-detail' as any, params: { id: item.uid, name: item.name } })}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.userInfo}>
                                    <View style={[styles.avatar, index === 0 ? { backgroundColor: 'rgba(255, 159, 10, 0.2)' } : { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                                        <Text style={[styles.avatarText, index === 0 ? { color: '#FF9F0A' } : { color: '#30D158' }]}>{item.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={[styles.userName, isDark && styles.textDark]}>{item.name}</Text>
                                            {index === 0 && <Text style={{ fontSize: 14 }}>🏆 Top Seller</Text>}
                                        </View>
                                        <Text style={styles.userStats}>{item.txCount} transactions</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Revenue</Text>
                                    <Text style={[styles.statValue, { color: '#0A84FF' }]}>{formatCurrency(item.revenue)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Tips</Text>
                                    <Text style={[styles.statValue, { color: '#30D158' }]}>{formatCurrency(item.tip)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Contribution</Text>
                                    <Text style={[styles.statValue, isDark && styles.textDark]}>{contribution}%</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f7',
    },
    containerDark: {
        backgroundColor: '#000000',
    },
    headerCard: {
        backgroundColor: '#ffffff',
        padding: 24,
        margin: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardDark: {
        backgroundColor: '#1c1c1e',
    },
    headerLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    headerValue: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    textDark: {
        color: '#ffffff',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 12,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f7',
        paddingBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    userName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
    },
    userStats: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 15,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    }
});
