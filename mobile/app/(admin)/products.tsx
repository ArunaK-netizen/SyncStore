import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { getDb } from '../../firebase';
import { useTheme } from '../../hooks/useTheme';

export default function AdminProducts() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { products } = useAdmin();
    const { parttimeId } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const confirmDelete = (id: string, name: string) => {
        Alert.alert('Delete Product', `Are you sure you want to delete "${name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                if (!parttimeId) return;
                const db = getDb();
                await deleteDoc(doc(db, 'parttimes', parttimeId, 'products', id));
            }}
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            <View style={styles.headerRow}>
                <View style={[styles.searchBox, isDark && styles.searchBoxDark]}>
                    <Ionicons name="search" size={20} color={isDark ? '#8e8e93' : '#c7c7cc'} />
                    <TextInput
                        style={[styles.searchInput, isDark && styles.textDark]}
                        placeholder="Search products..."
                        placeholderTextColor={isDark ? '#8e8e93' : '#c7c7cc'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-product')}>
                    <Ionicons name="add" size={28} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.card, isDark && styles.cardDark]}>
                        <View style={styles.productInfo}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                                <Ionicons name="cube" size={24} color="#0A84FF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.productName, isDark && styles.textDark]}>{item.name}</Text>
                                <Text style={styles.productCategory}>{item.category}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                <Text style={[styles.productPrice, isDark && styles.textDark]}>${Number(item.price).toFixed(2)}</Text>
                                <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={48} color={isDark ? '#3a3a3c' : '#c7c7cc'} />
                        <Text style={[styles.emptyText, isDark && styles.textDark]}>No products found</Text>
                    </View>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 12,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 14,
        gap: 8,
    },
    searchBoxDark: {
        backgroundColor: '#1c1c1e',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#000000',
    },
    textDark: {
        color: '#ffffff',
    },
    addBtn: {
        backgroundColor: '#0A84FF',
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
    },
    cardDark: {
        backgroundColor: '#1c1c1e',
    },
    productInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        textTransform: 'capitalize',
    },
    productPrice: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    deleteBtn: {
        padding: 6,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#8e8e93',
        marginTop: 12,
    }
});
