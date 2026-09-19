import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from '@react-native-firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { getDb } from '../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { Transaction } from '../../hooks/useSalesData';

export default function AdminSales() {
    const { parttimeId } = useAuth();
    const { transactions, loading } = useAdmin();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';

    const [search, setSearch] = useState('');
    const [filterPayment, setFilterPayment] = useState('all');
    const [expanded, setExpanded] = useState<string | null>(null);

    const paymentMethods = [
        { label: 'All', value: 'all' },
        { label: 'Cash', value: 'cash' },
        { label: 'Card', value: 'card' },
        { label: 'UPI', value: 'upi' }
    ];

    const filteredTxns = transactions.filter((tx: Transaction) => {
        const matchesSearch = !search || 
            tx.id.toLowerCase().includes(search.toLowerCase()) || 
            (tx.userName || '').toLowerCase().includes(search.toLowerCase()) ||
            (tx.items || []).some((i: any) => i.productName.toLowerCase().includes(search.toLowerCase()));
            
        const matchesPayment = filterPayment === 'all' || (tx.paymentMethod || '').toLowerCase() === filterPayment;

        return matchesSearch && matchesPayment;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction forever?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    if (!parttimeId) return;
                    try {
                        const db = getDb();
                        await deleteDoc(doc(db, 'parttimes', parttimeId, 'transactions', id));
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete transaction.');
                    }
                } 
            }
        ]);
    };

    const handleExportPDF = async () => {
        if (!filteredTxns.length) {
            Alert.alert('Empty', 'No transactions to export.');
            return;
        }

        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h2>Sales Report</h2>
                    <p>Total Transactions: ${filteredTxns.length}</p>
                    <p>Total Revenue: ${formatCurrency(filteredTxns.reduce((s: number, tx: Transaction) => s + (tx.totalAmount || 0), 0))}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Staff</th>
                                <th>Items</th>
                                <th>Payment</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTxns.map((tx: Transaction) => `
                                <tr>
                                    <td>${tx.date}</td>
                                    <td>${tx.userName || 'Unknown'}</td>
                                    <td>${(tx.items || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0)} items</td>
                                    <td>${tx.paymentMethod || 'cash'}</td>
                                    <td>${formatCurrency(tx.totalAmount || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            }
        } catch (e) {
            Alert.alert('Export Error', 'Could not generate PDF.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
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
                    <Text style={[styles.title, isDark && styles.textDark]}>Sales History</Text>
                    <Text style={styles.subtitle}>{filteredTxns.length} transactions</Text>
                </View>
                <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
                    <Ionicons name="document-text" size={18} color="#0A84FF" />
                    <Text style={styles.exportText}>Export PDF</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, isDark && styles.searchBoxDark]}>
                    <Ionicons name="search" size={18} color="#8e8e93" />
                    <TextInput
                        style={[styles.searchInput, isDark && styles.textDark]}
                        placeholder="Search sales..."
                        placeholderTextColor={isDark ? '#8e8e93' : '#c7c7cc'}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#8e8e93" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.filterScroll}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                        {paymentMethods.map(pm => (
                            <TouchableOpacity
                                key={pm.value}
                                onPress={() => setFilterPayment(pm.value)}
                                style={[styles.pill, filterPayment === pm.value && styles.pillActive]}
                            >
                                <Text style={[styles.pillText, filterPayment === pm.value && styles.pillTextActive, !isDark && filterPayment !== pm.value && { color: '#000' }]}>
                                    {pm.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <FlatList
                data={filteredTxns}
                keyExtractor={(item: Transaction) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }: { item: Transaction }) => {
                    const isExpanded = expanded === item.id;
                    const itemsList: any[] = item.items || (item.productName ? [{ productName: item.productName, price: item.price || 0, quantity: item.quantity || 1 }] : []);
                    const totalQty = itemsList.reduce((s: number, i: any) => s + (i.quantity || 1), 0);

                    return (
                        <View style={[styles.txnCard, isDark && styles.txnCardDark]}>
                            <TouchableOpacity onPress={() => setExpanded(isExpanded ? null : item.id)} style={styles.txnHeader} activeOpacity={0.7}>
                                <View style={styles.txnIconWrap}>
                                    <Ionicons name="receipt-outline" size={20} color="#0A84FF" />
                                </View>
                                <View style={styles.txnInfo}>
                                    <Text style={[styles.txnTime, isDark && styles.textDark]}>{item.date}</Text>
                                    <Text style={styles.txnItemsCount}>{totalQty} item{totalQty !== 1 ? 's' : ''} • {item.paymentMethod || 'cash'}</Text>
                                </View>
                                <View style={styles.txnAmountWrap}>
                                    <Text style={[styles.txnTotal, isDark && styles.textDark]}>{formatCurrency(item.totalAmount || 0)}</Text>
                                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#8e8e93" style={{ marginLeft: 6 }} />
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={[styles.txnBody, isDark && { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                                    <View style={styles.txnMetaLine}>
                                        <Text style={styles.txnLabel}>Staff</Text>
                                        <Text style={[styles.txnValue, isDark && styles.textDark]}>{item.userName || 'Unknown'}</Text>
                                    </View>
                                    <View style={styles.txnMetaLine}>
                                        <Text style={styles.txnLabel}>Tip</Text>
                                        <Text style={[styles.txnValue, isDark && styles.textDark, { color: '#30D158' }]}>{formatCurrency(item.tip || 0)}</Text>
                                    </View>
                                    <View style={styles.txnItemsList}>
                                        {itemsList.map((i: any, idx: number) => (
                                            <View key={idx} style={styles.txnItemRow}>
                                                <Text style={[styles.txnItemName, isDark && styles.textDark]}>{i.quantity || 1}x {i.productName}</Text>
                                                <Text style={[styles.txnItemPrice, isDark && styles.textDark]}>{formatCurrency(i.price * (i.quantity || 1))}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                                        <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                        <Text style={styles.deleteText}>Delete Transaction</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                }}
            />
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
    title: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#8e8e93', fontFamily: 'Outfit_400Regular', marginTop: 2 },
    exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10, 132, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 },
    exportText: { color: '#0A84FF', fontSize: 13, fontFamily: 'Outfit_600SemiBold' },
    searchContainer: { marginBottom: 16 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, paddingHorizontal: 12, height: 44, borderRadius: 12, marginBottom: 12 },
    searchBoxDark: { backgroundColor: '#1c1c1e' },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#000' },
    filterScroll: { paddingVertical: 4 },
    pill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(142, 142, 147, 0.12)' },
    pillActive: { backgroundColor: '#0A84FF' },
    pillText: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: '#8e8e93' },
    pillTextActive: { color: '#fff' },
    listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
    txnCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
    txnCardDark: { backgroundColor: '#1c1c1e' },
    txnHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    txnIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(10, 132, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txnInfo: { flex: 1 },
    txnTime: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    txnItemsCount: { fontSize: 13, color: '#8e8e93', fontFamily: 'Outfit_400Regular', marginTop: 2, textTransform: 'capitalize' },
    txnAmountWrap: { flexDirection: 'row', alignItems: 'center' },
    txnTotal: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#000' },
    txnBody: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', padding: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
    txnMetaLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    txnLabel: { fontSize: 13, color: '#8e8e93', fontFamily: 'Outfit_400Regular' },
    txnValue: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: '#000' },
    txnItemsList: { marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(142,142,147,0.3)', gap: 6 },
    txnItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
    txnItemName: { fontSize: 13, color: '#000', fontFamily: 'Outfit_400Regular' },
    txnItemPrice: { fontSize: 13, color: '#000', fontFamily: 'Outfit_500Medium' },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 10, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 12, gap: 6 },
    deleteText: { color: '#FF3B30', fontSize: 13, fontFamily: 'Outfit_600SemiBold' }
});
