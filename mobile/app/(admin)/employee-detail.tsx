import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../hooks/useTheme';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

export default function EmployeeDetail() {
    const { id, name } = useLocalSearchParams<{ id: string, name: string }>();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const { transactions } = useAdmin();

    const employeeTxs = useMemo(() => {
        return transactions.filter(t => t.userId === id).sort((a, b) => b.timestamp - a.timestamp);
    }, [transactions, id]);

    const stats = useMemo(() => {
        let revenue = 0;
        let tip = 0;
        const productsMap: Record<string, { name: string; qty: number; total: number }> = {};

        employeeTxs.forEach(t => {
            revenue += t.totalAmount || 0;
            tip += t.tip || 0;
            
            t.items?.forEach(item => {
                const key = item.productName;
                if (!productsMap[key]) productsMap[key] = { name: item.productName, qty: 0, total: 0 };
                productsMap[key].qty += item.quantity;
                productsMap[key].total += item.price * item.quantity;
            });
        });

        const topProducts = Object.values(productsMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

        return { revenue, tip, txCount: employeeTxs.length, topProducts };
    }, [employeeTxs]);

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                    <Text style={[styles.avatarText, { color: '#30D158' }]}>{name?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[styles.name, isDark && styles.textDark]}>{name}</Text>
                <Text style={styles.subtitle}>{stats.txCount} lifetime transactions</Text>
            </View>

            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, isDark && styles.cardDark]}>
                    <Text style={styles.kpiLabel}>Revenue</Text>
                    <Text style={[styles.kpiValue, { color: '#0A84FF' }]}>{formatCurrency(stats.revenue)}</Text>
                </View>
                <View style={[styles.kpiCard, isDark && styles.cardDark]}>
                    <Text style={styles.kpiLabel}>Tips Collected</Text>
                    <Text style={[styles.kpiValue, { color: '#30D158' }]}>{formatCurrency(stats.tip)}</Text>
                </View>
            </View>

            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Top Selling Products</Text>

            <FlatList
                data={stats.topProducts}
                keyExtractor={item => item.name}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <View style={[styles.productRow, isDark && styles.cardDark]}>
                        <View style={styles.rankBadge}><Text style={styles.rankText}>#{index + 1}</Text></View>
                        <Text style={[styles.productName, isDark && styles.textDark]}>{item.name}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.productQty, isDark && styles.textDark]}>{item.qty} sold</Text>
                            <Text style={styles.productTotal}>{formatCurrency(item.total)}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No sales recorded</Text>
                }
            />
        </SafeAreaView>
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
    header: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
    },
    name: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    textDark: {
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        marginTop: 4,
    },
    kpiRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
    },
    cardDark: {
        backgroundColor: '#1c1c1e',
    },
    kpiLabel: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93',
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 22,
        fontFamily: 'Outfit_700Bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    listContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
    },
    rankBadge: {
        backgroundColor: '#f2f2f7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    rankText: {
        fontSize: 12,
        fontFamily: 'Outfit_700Bold',
        color: '#8e8e93',
    },
    productName: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
    },
    productQty: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
    },
    productTotal: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        marginTop: 20,
    }
});
