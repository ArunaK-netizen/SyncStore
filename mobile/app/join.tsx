import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../firebase';
import { collection, doc, getDocs, query, setDoc, where } from '@react-native-firebase/firestore';

export default function JoinScreen() {
    const { user, logout, refreshAccessStatus } = useAuth();
    const router = useRouter();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (code.trim().length === 0) {
            Alert.alert('Error', 'Please enter a valid Join Code.');
            return;
        }

        const validCode = code.trim().toUpperCase();

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLoading(true);

            const db = getDb();
            // 1. Find Parttime by Code
            const parttimesQ = query(collection(db, 'parttimes'), where('code', '==', validCode));
            const parttimesSnap = await getDocs(parttimesQ);

            if (parttimesSnap.empty) {
                Alert.alert('Invalid Code', 'No parttime found with that join code. Please try again.');
                setLoading(false);
                return;
            }

            const parttimeDoc = parttimesSnap.docs[0];
            const parttimeId = parttimeDoc.id;

            // 2. Add to user_routing
            await setDoc(doc(db, 'user_routing', user!.uid), {
                parttimeId: parttimeId
            });

            // 3. Create access request in that specific parttime
            await setDoc(doc(db, 'parttimes', parttimeId, 'access_requests', user!.uid), {
                uid: user!.uid,
                email: user!.email || '',
                name: user!.displayName || user!.email || 'Unknown',
                photoURL: user!.photoURL || '',
                requestedAt: Date.now(),
                status: 'pending',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 4. Refresh Auth Context: this will handle redirecting us to the pending screen
            await refreshAccessStatus();
            router.replace('/');

        } catch (error) {
            console.error('Join Error:', error);
            Alert.alert('Error', 'An error occurred while joining. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            router.replace('/login' as any);
        } catch { }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.inner}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.content}>
                        {/* Icon */}
                        <View style={styles.iconWrap}>
                            <Ionicons name="link" size={48} color="#0A84FF" />
                        </View>

                        {/* Title & body */}
                        <Text style={styles.title}>Join a Parttime</Text>
                        <Text style={styles.subtitle}>
                            Enter the unique Join Code provided by your manager to request access to their database.
                        </Text>

                        {/* Input Area */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="key-outline" size={20} color="#8e8e93" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Join Code..."
                                placeholderTextColor="#8e8e93"
                                value={code}
                                onChangeText={setCode}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.joinBtn, loading || code.length === 0 ? styles.joinBtnDisabled : {}]}
                            onPress={handleJoin}
                            disabled={loading || code.trim().length === 0}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.joinText}>Request Access</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Log out button */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loading}>
                        <Ionicons name="log-out-outline" size={18} color="#FF453A" />
                        <Text style={styles.logoutText}>Sign out</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    inner: { flex: 1 },
    keyboardView: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingBottom: 24 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    iconWrap: {
        width: 88, height: 88, borderRadius: 28,
        backgroundColor: 'rgba(10,132,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
    },

    title: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: '#fff', marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: 16, fontFamily: 'Outfit_400Regular', color: '#8e8e93', textAlign: 'center', lineHeight: 24, marginBottom: 36 },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1c1c1e', borderRadius: 16,
        paddingHorizontal: 16, paddingVertical: 14,
        width: '100%', marginBottom: 24,
        borderWidth: 1, borderColor: '#333',
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#fff', fontSize: 18, fontFamily: 'Outfit_600SemiBold', letterSpacing: 1 },

    joinBtn: {
        backgroundColor: '#0A84FF', borderRadius: 16,
        width: '100%', paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#0A84FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    joinBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
    joinText: { fontSize: 17, fontFamily: 'Outfit_600SemiBold', color: '#fff' },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14,
    },
    logoutText: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#FF453A' },
});
