import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { addDoc, collection, deleteDoc, doc, updateDoc } from '@react-native-firebase/firestore';
import { getDb } from '../../firebase';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export default function AdminProductsView() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const { parttimeId } = useAuth();
    const { products } = useAdmin();

    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [form, setForm] = useState({ name: '', price: '', category: '' });
    const [isSaving, setIsSaving] = useState(false);

    const productList = useMemo(() => {
        const all = Array.isArray(products) ? products : [];
        if (!search) return all;
        const q = search.toLowerCase();
        return all.filter((p: any) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
    }, [products, search]);

    const categories = useMemo(() => {
        const cats = new Set(productList.map((p: any) => p.category || 'Uncategorized'));
        return Array.from(cats).sort();
    }, [productList]);

    const openAdd = () => {
        setEditingProduct(null);
        setForm({ name: '', price: '', category: '' });
        setModalVisible(true);
    };

    const openEdit = (p: any) => {
        setEditingProduct(p);
        setForm({ name: p.name, price: String(p.price), category: p.category || '' });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!parttimeId || !form.name.trim() || !form.price.trim()) {
            Alert.alert('Missing Fields', 'Name and price are required.');
            return;
        }
        const price = parseFloat(form.price);
        if (isNaN(price) || price < 0) {
            Alert.alert('Invalid Price', 'Please enter a valid price.');
            return;
        }
        setIsSaving(true);
        try {
            const db = getDb();
            const payload = { name: form.name.trim(), price, category: form.category.trim() || 'General' };
            if (editingProduct) {
                await updateDoc(doc(db, 'parttimes', parttimeId, 'products', editingProduct.id), payload);
            } else {
                await addDoc(collection(db, 'parttimes', parttimeId, 'products'), payload);
            }
            setModalVisible(false);
        } catch {
            Alert.alert('Error', 'Failed to save product.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Delete Product', `Remove "${name}" permanently?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    if (!parttimeId) return;
                    const db = getDb();
                    await deleteDoc(doc(db, 'parttimes', parttimeId, 'products', id));
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, isDark && styles.textW]}>Products</Text>
                    <Text style={styles.subtitle}>{productList.length} items</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openAdd(); }}>
                    <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <View style={[styles.searchBar, isDark && styles.cardDark]}>
                    <Ionicons name="search" size={16} color="#8e8e93" />
                    <TextInput
                        style={[styles.searchInput, isDark && styles.textW]}
                        placeholder="Search products..."
                        placeholderTextColor="#8e8e93"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#8e8e93" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Product List grouped by category */}
            <FlatList
                data={categories}
                keyExtractor={c => c}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: cat }) => {
                    const catProducts = productList.filter((p: any) => (p.category || 'Uncategorized') === cat);
                    return (
                        <View style={styles.catGroup}>
                            <Text style={[styles.catLabel, isDark && { color: '#98989d' }]}>{cat.toUpperCase()}</Text>
                            {catProducts.map((p: any) => (
                                <View key={p.id} style={[styles.productCard, isDark && styles.cardDark]}>
                                    <TouchableOpacity style={styles.productRow} onPress={() => openEdit(p)} activeOpacity={0.7}>
                                        <View style={[styles.productIcon, isDark && { backgroundColor: '#2c2c2e' }]}>
                                            <Ionicons name="cube-outline" size={20} color="#007AFF" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.productName, isDark && styles.textW]}>{p.name}</Text>
                                            <Text style={styles.productCat}>{p.category || 'General'}</Text>
                                        </View>
                                        <Text style={[styles.productPrice, isDark && styles.textW]}>{formatCurrency(p.price)}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteIcon} onPress={() => handleDelete(p.id, p.name)}>
                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    );
                }}
            />

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, isDark && styles.modalBoxDark]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, isDark && styles.textW]}>
                                    {editingProduct ? 'Edit Product' : 'New Product'}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Text style={[styles.modalCancel, isDark && styles.textW]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                                        <Text style={styles.modalSaveBtn}>
                                            {isSaving ? '...' : 'Save'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalBody}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} placeholder="Product name" placeholderTextColor="#8e8e93" />

                                <Text style={[styles.label, { marginTop: 16 }]}>Price ($)</Text>
                                <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.price} onChangeText={t => setForm(f => ({ ...f, price: t }))} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#8e8e93" />

                                <Text style={[styles.label, { marginTop: 16 }]}>Category</Text>
                                <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.category} onChangeText={t => setForm(f => ({ ...f, category: t }))} placeholder="e.g. Beer, Spirits" placeholderTextColor="#8e8e93" />
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
    textW: { color: '#fff' },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 34, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 42, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#000' },
    cardDark: { backgroundColor: '#1c1c1e' },
    list: { paddingHorizontal: 20, paddingBottom: 120 },
    catGroup: { marginBottom: 20 },
    catLabel: { fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#8e8e93', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
    productCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
    productRow: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    productIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f2f2f7', alignItems: 'center', justifyContent: 'center' },
    productName: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    productCat: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 2 },
    productPrice: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#000' },
    deleteIcon: { paddingHorizontal: 14, paddingVertical: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBox: { width: '100%', backgroundColor: '#f2f2f7', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
    modalBoxDark: { backgroundColor: '#000', borderWidth: 1, borderColor: '#2c2c2e' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modalTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#000' },
    modalCancel: { fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#8e8e93' },
    modalSaveBtn: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: '#007AFF' },
    modalBody: { padding: 20 },
    label: { fontSize: 13, fontFamily: 'Outfit_600SemiBold', color: '#8e8e93', marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: 'Outfit_400Regular', color: '#000', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    inputDark: { backgroundColor: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' },
});
