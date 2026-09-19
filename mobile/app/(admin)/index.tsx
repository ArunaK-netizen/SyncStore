import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../hooks/useTheme';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export default function AdminDashboard() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { transactions, adminUsers, accessRequests, loading } = useAdmin();

    const stats = useMemo(() => {
        const totalRev = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
        
        const today = new Date().toISOString().split('T')[0];
        const todayRev = transactions
            .filter(t => t.date === today)
            .reduce((acc, t) => acc + (t.totalAmount || 0), 0);

        const thisMonth = today.slice(0, 7);
        const monthRev = transactions
            .filter(t => t.date?.startsWith(thisMonth))
            .reduce((acc, t) => acc + (t.totalAmount || 0), 0);
            
        return { totalRev, todayRev, monthRev };
    }, [transactions]);

    if (loading) {
        return (
            <View style={[styles.container, isDark && styles.containerDark, { justifyContent: 'center' }]}>
                <Text style={[styles.loadingText, isDark && styles.textDark]}>Loading Dashboard...</Text>
            </View>
        );
    }

    const unreadRequests = accessRequests.filter(r => r.status === 'pending').length;

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                <Text style={[styles.greeting, isDark && styles.textDark]}>Overview</Text>
                <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>

            <View style={styles.kpiContainer}>
                <View style={[styles.kpiCard, isDark && styles.cardDark]}>
                    <Text style={styles.kpiLabel}>Today's Revenue</Text>
                    <Text style={[styles.kpiValue, { color: '#0A84FF' }]}>{formatCurrency(stats.todayRev)}</Text>
                </View>
                <View style={[styles.kpiCard, isDark && styles.cardDark]}>
                    <Text style={styles.kpiLabel}>This Month</Text>
                    <Text style={[styles.kpiValue, { color: '#30D158' }]}>{formatCurrency(stats.monthRev)}</Text>
                </View>
            </View>

            <View style={styles.kpiContainer}>
                <View style={[styles.kpiCard, isDark && styles.cardDark]}>
                    <Text style={styles.kpiLabel}>Total Revenue</Text>
                    <Text style={[styles.kpiValue, isDark && styles.textDark]}>{formatCurrency(stats.totalRev)}</Text>
                </View>
                <View style={[styles.kpiCard, isDark && styles.cardDark]}>
                    <Text style={styles.kpiLabel}>Total Sales</Text>
                    <Text style={[styles.kpiValue, isDark && styles.textDark]}>{transactions.length}</Text>
                </View>
            </View>

            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Management</Text>

            <View style={styles.navGrid}>
                <TouchableOpacity 
                    style={[styles.navCard, isDark && styles.cardDark]} 
                    onPress={() => router.push('/(admin)/users' as any)}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(94, 92, 230, 0.15)' }]}>
                        <Ionicons name="people" size={24} color="#5E5CE6" />
                        {unreadRequests > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadRequests}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.navTitle, isDark && styles.textDark]}>Users & Access</Text>
                    <Text style={styles.navDesc}>{adminUsers.length} active users</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.navCard, isDark && styles.cardDark]} 
                    onPress={() => router.push('/(admin)/products' as any)}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                        <Ionicons name="cube" size={24} color="#FF9F0A" />
                    </View>
                    <Text style={[styles.navTitle, isDark && styles.textDark]}>Products</Text>
                    <Text style={styles.navDesc}>Manage catalog</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.navCard, isDark && styles.cardDark]} 
                    onPress={() => router.push('/(admin)/employees' as any)}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                        <Ionicons name="briefcase" size={24} color="#30D158" />
                    </View>
                    <Text style={[styles.navTitle, isDark && styles.textDark]}>Employees</Text>
                    <Text style={styles.navDesc}>Sales performance</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.navCard, isDark && styles.cardDark]} 
                    onPress={() => router.push('/(admin)/analytics' as any)}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                        <Ionicons name="bar-chart" size={24} color="#0A84FF" />
                    </View>
                    <Text style={[styles.navTitle, isDark && styles.textDark]}>Analytics</Text>
                    <Text style={styles.navDesc}>Charts & trends</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.navCard, isDark && styles.cardDark]} 
                    onPress={() => router.push('/(admin)/sales' as any)}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                        <Ionicons name="receipt" size={24} color="#34C759" />
                    </View>
                    <Text style={[styles.navTitle, isDark && styles.textDark]}>Sales History</Text>
                    <Text style={styles.navDesc}>History & exports</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.navCard, isDark && styles.cardDark]} 
                    onPress={() => router.push('/(admin)/schedule' as any)}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(175, 82, 222, 0.15)' }]}>
                        <Ionicons name="calendar" size={24} color="#AF52DE" />
                    </View>
                    <Text style={[styles.navTitle, isDark && styles.textDark]}>Scheduler</Text>
                    <Text style={styles.navDesc}>Staff shifts</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.navCard, isDark && styles.cardDark]} 
                    onPress={() => router.push('/(admin)/announcements' as any)}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                        <Ionicons name="megaphone" size={24} color="#FF9F0A" />
                    </View>
                    <Text style={[styles.navTitle, isDark && styles.textDark]}>Announcements</Text>
                    <Text style={styles.navDesc}>Broadcast updates</Text>
                </TouchableOpacity>
            </View>
                <View style={{ height: 120 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f7',
        paddingHorizontal: 16,
    },
    containerDark: {
        backgroundColor: '#000000',
    },
    header: {
        marginVertical: 20,
    },
    greeting: {
        fontSize: 28,
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
    kpiContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardDark: {
        backgroundColor: '#1c1c1e',
    },
    kpiLabel: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 22,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
        marginTop: 24,
        marginBottom: 16,
    },
    navGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    navCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    navTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
        marginBottom: 4,
    },
    navDesc: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
    },
    loadingText: {
        textAlign: 'center',
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 16,
        color: '#8e8e93',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
    }
});
