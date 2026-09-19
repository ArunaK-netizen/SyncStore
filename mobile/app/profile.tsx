import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { STORAGE_KEYS, saveData } from '../utils/storage';

export default function Profile() {
    const router = useRouter();
    const { user, logout, updateDisplayName, parttimeId } = useAuth();
    const { isAdmin, emailsList } = useAdminAccess();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';

    const [name, setName] = useState(user?.displayName || '');
    const [savingName, setSavingName] = useState(false);

    useEffect(() => {
        setName(user?.displayName || '');
    }, [user?.displayName]);

    const handleLogout = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Persist current theme to AsyncStorage before logging out
            await saveData(STORAGE_KEYS.THEME, colorScheme);
            await logout();
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleNameBlur = async () => {
        const trimmed = name.trim();
        if (!user || !trimmed || trimmed === user.displayName) return;
        try {
            setSavingName(true);
            await updateDisplayName(trimmed);
        } catch (error) {
            console.error('Failed to update name', error);
            setName(user.displayName || '');
        } finally {
            setSavingName(false);
        }
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <LinearGradient
                colors={isDark ? ['#1c1c1e', '#2c2c2e'] : ['#f2f2f7', '#e5e5ea']}
                style={styles.headerGradient}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, isDark && styles.backButtonDark]}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#0A84FF" : "#007AFF"} />
                </TouchableOpacity>
                <Text style={[styles.title, isDark && styles.titleDark]}>Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={[styles.card, isDark && styles.cardDark]}>
                    <View style={styles.avatarContainer}>
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
                                <Text style={styles.avatarText}>
                                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.label, isDark && styles.labelDark]}>Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            onBlur={handleNameBlur}
                            placeholder="Your name"
                            placeholderTextColor={isDark ? '#8e8e93' : '#c7c7cc'}
                            style={[styles.input, isDark && styles.inputDark]}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.label, isDark && styles.labelDark]}>Email</Text>
                        <TextInput
                            value={user?.email || ''}
                            editable={false}
                            style={[styles.input, isDark && styles.inputDark]}
                        />
                    </View>

                    {isAdmin && (
                        <TouchableOpacity style={[styles.adminButton, isDark && styles.adminButtonDark]} onPress={() => router.push('/(admin)' as any)}>
                            <Ionicons name="shield-checkmark" size={20} color={isDark ? "#0A84FF" : "#007AFF"} />
                            <Text style={[styles.adminText, isDark && styles.adminTextDark]}>Admin Dashboard</Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ padding: 16, backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7', marginTop: 20, borderRadius: 12 }}>
                        <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Outfit_700Bold', marginBottom: 4 }}>Access Debug</Text>
                        <Text style={{ color: '#8e8e93', fontSize: 12 }}>Email: {user?.email}</Text>
                        <Text style={{ color: '#8e8e93', fontSize: 12 }}>Parttime: {parttimeId || 'NULL'}</Text>
                        <Text style={{ color: '#8e8e93', fontSize: 12 }}>Admins: {emailsList?.join(', ') || 'None found'}</Text>
                        <Text style={{ color: '#8e8e93', fontSize: 12 }}>Match: {isAdmin.toString()}</Text>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 280,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    backButtonDark: {
        backgroundColor: '#2c2c2e',
        shadowOpacity: 0.3,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#000000',
    },
    titleDark: {
        color: '#ffffff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    cardDark: {
        backgroundColor: '#1c1c1e',
        shadowOpacity: 0.3,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPlaceholderDark: {
        backgroundColor: '#0A84FF',
    },
    avatarText: {
        fontSize: 40,
        fontFamily: 'Outfit_700Bold',
        color: '#ffffff',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#000000',
        marginBottom: 8,
    },
    labelDark: {
        color: '#ffffff',
    },
    input: {
        backgroundColor: '#f2f2f7',
        padding: 14,
        borderRadius: 12,
        fontSize: 17,
        fontFamily: 'Outfit_400Regular',
        color: '#000000',
    },
    inputDark: {
        backgroundColor: '#2c2c2e',
        color: '#ffffff',
    },
    adminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 14,
        marginTop: 12,
        gap: 8,
    },
    adminButtonDark: {
        backgroundColor: 'rgba(10, 132, 255, 0.15)',
    },
    adminText: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        color: '#007AFF',
    },
    adminTextDark: {
        color: '#0A84FF',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 14,
        marginTop: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        color: '#ff3b30',
    },
});
