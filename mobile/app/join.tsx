import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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

type OnboardingStep = 'selectRole' | 'adminSetup' | 'employeeJoin';

export default function JoinScreen() {
    const { user, logout, refreshAccessStatus } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<OnboardingStep>('selectRole');
    
    // Employee flow state
    const [employeeCode, setEmployeeCode] = useState('');

    // Admin flow state
    const [parttimeName, setParttimeName] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [isCodeCustomized, setIsCodeCustomized] = useState(false);

    const [loading, setLoading] = useState(false);

    // Intelligent Join Code Suggestion Engine
    const suggestions = useMemo(() => {
        const clean = parttimeName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
        if (!clean) return [];

        const words = clean.split(/\s+/).filter(Boolean);
        const year = new Date().getFullYear().toString().slice(-2); // e.g. "26"
        const candidates: string[] = [];

        if (words.length === 1) {
            const word = words[0];
            candidates.push(word.slice(0, 8));
            if (word.length <= 6) {
                candidates.push(`${word}${year}`);
            } else {
                candidates.push(`${word.slice(0, 6)}${year}`);
            }
            candidates.push(`${word.slice(0, 5)}101`);
        } else {
            const first = words[0];
            const last = words[words.length - 1];
            
            candidates.push((first.slice(0, 4) + last.slice(0, 4)));
            const initials = words.map(w => w[0]).join('');
            candidates.push(`${initials}${year}`);
            candidates.push(`${first.slice(0, 6)}${year}`);
            candidates.push(`${initials}-88`);
        }

        return Array.from(new Set(candidates)).slice(0, 4);
    }, [parttimeName]);

    // Handle auto-selecting first suggestion if user hasn't explicitly edited code
    const handleNameChange = (text: string) => {
        setParttimeName(text);
        if (!isCodeCustomized) {
            const clean = text.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
            if (!clean) {
                setAdminCode('');
            } else {
                const words = clean.split(/\s+/).filter(Boolean);
                let autoCode = words[0].slice(0, 8);
                if (words.length > 1) {
                    autoCode = (words[0].slice(0, 4) + words[words.length - 1].slice(0, 4));
                }
                setAdminCode(autoCode);
            }
        }
    };

    const handleSelectSuggestion = (codeSuggestion: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAdminCode(codeSuggestion);
        setIsCodeCustomized(true);
    };

    // Employee Join Action
    const handleEmployeeJoin = async () => {
        if (employeeCode.trim().length === 0) {
            Alert.alert('Error', 'Please enter a valid Join Code.');
            return;
        }

        const validCode = employeeCode.trim().toUpperCase();

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLoading(true);

            const db = getDb();
            // 1. Find Parttime by Code
            const parttimesQ = query(collection(db, 'parttimes'), where('code', '==', validCode));
            const parttimesSnap = await getDocs(parttimesQ);

            if (parttimesSnap.empty) {
                Alert.alert('Invalid Code', 'No parttime found with that join code. Please check with your manager and try again.');
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

    // Admin Creation Action
    const handleAdminCreate = async () => {
        if (!parttimeName.trim()) {
            Alert.alert('Missing Name', 'Please enter your Parttime / business name.');
            return;
        }
        if (!adminCode.trim()) {
            Alert.alert('Missing Code', 'Please enter or select a Join Code for your employees.');
            return;
        }

        const formattedCode = adminCode.trim().toUpperCase();

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLoading(true);

            const db = getDb();

            // 1. Check if join code is already taken across all parttimes
            const existingQ = query(collection(db, 'parttimes'), where('code', '==', formattedCode));
            const existingSnap = await getDocs(existingQ);

            if (!existingSnap.empty) {
                Alert.alert('Code Taken', `The join code "${formattedCode}" is already in use by another workspace. Please select or enter a different code.`);
                setLoading(false);
                return;
            }

            // 2. Create new parttime document
            const newParttimeRef = doc(collection(db, 'parttimes'));
            const newParttimeId = newParttimeRef.id;

            await setDoc(newParttimeRef, {
                id: newParttimeId,
                name: parttimeName.trim(),
                code: formattedCode,
                createdAt: Date.now(),
                ownerUid: user!.uid,
                ownerEmail: user!.email || '',
            });

            // 3. Add current user as Admin in admin_config
            const userEmail = (user!.email || '').toLowerCase().trim();
            await setDoc(doc(db, 'parttimes', newParttimeId, 'admin_config', 'config'), {
                adminEmails: [userEmail],
                updatedAt: Date.now(),
            });

            // 4. Add current user directly to approved_users
            await setDoc(doc(db, 'parttimes', newParttimeId, 'approved_users', user!.uid), {
                uid: user!.uid,
                email: userEmail,
                name: user!.displayName || user!.email || 'Admin Owner',
                addedAt: Date.now(),
                role: 'owner',
            });

            // 5. Update user_routing
            await setDoc(doc(db, 'user_routing', user!.uid), {
                parttimeId: newParttimeId
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 6. Refresh Auth Context: routes directly to Dashboard with Admin rights
            await refreshAccessStatus();
            router.replace('/');

        } catch (error) {
            console.error('Create Parttime Error:', error);
            Alert.alert('Error', 'Failed to create your Parttime workspace. Please try again.');
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
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* STEP 1: SELECT ROLE */}
                        {step === 'selectRole' && (
                            <View style={styles.stepContainer}>
                                <View style={styles.iconWrap}>
                                    <Ionicons name="business" size={44} color="#0A84FF" />
                                </View>

                                <Text style={styles.title}>Welcome to Parttime</Text>
                                <Text style={styles.subtitle}>
                                    Choose how you would like to set up your account.
                                </Text>

                                <TouchableOpacity
                                    style={styles.roleCard}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setStep('adminSetup');
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
                                        <Ionicons name="shield-checkmark" size={28} color="#0A84FF" />
                                    </View>
                                    <View style={styles.roleInfo}>
                                        <View style={styles.roleTitleRow}>
                                            <Text style={styles.roleTitle}>I am an Admin / Owner</Text>
                                            <View style={styles.adminBadge}>
                                                <Text style={styles.badgeText}>Owner</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.roleDesc}>
                                            Create a new Parttime workspace for your store, cafe, or business.
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.roleCard}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setStep('employeeJoin');
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                                        <Ionicons name="person-add" size={28} color="#30D158" />
                                    </View>
                                    <View style={styles.roleInfo}>
                                        <View style={styles.roleTitleRow}>
                                            <Text style={styles.roleTitle}>I am an Employee</Text>
                                            <View style={styles.employeeBadge}>
                                                <Text style={styles.badgeText}>Staff</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.roleDesc}>
                                            Join an existing Parttime using a code provided by your manager.
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STEP 2A: ADMIN SETUP */}
                        {step === 'adminSetup' && (
                            <View style={styles.stepContainer}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setStep('selectRole')}
                                    disabled={loading}
                                >
                                    <Ionicons name="chevron-back" size={20} color="#0A84FF" />
                                    <Text style={styles.backButtonText}>Back to Roles</Text>
                                </TouchableOpacity>

                                <View style={styles.iconWrap}>
                                    <Ionicons name="briefcase" size={44} color="#0A84FF" />
                                </View>

                                <Text style={styles.title}>Create Your Parttime</Text>
                                <Text style={styles.subtitle}>
                                    Enter your business name. We will suggest an intelligent join code for your staff.
                                </Text>

                                {/* Parttime Name Input */}
                                <Text style={styles.fieldLabel}>PARTTIME / BUSINESS NAME</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="storefront-outline" size={20} color="#8e8e93" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Starbucks Downtown, Antigravity Cafe"
                                        placeholderTextColor="#8e8e93"
                                        value={parttimeName}
                                        onChangeText={handleNameChange}
                                        autoCapitalize="words"
                                        editable={!loading}
                                    />
                                </View>

                                {/* Intelligent Code Suggestions */}
                                {suggestions.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        <Text style={styles.suggestionsTitle}>💡 INTELLIGENT CODE SUGGESTIONS</Text>
                                        <View style={styles.chipRow}>
                                            {suggestions.map((codeChip) => {
                                                const isSelected = adminCode === codeChip;
                                                return (
                                                    <TouchableOpacity
                                                        key={codeChip}
                                                        style={[styles.chip, isSelected && styles.chipSelected]}
                                                        onPress={() => handleSelectSuggestion(codeChip)}
                                                        disabled={loading}
                                                    >
                                                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                                            {codeChip}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Join Code Field */}
                                <Text style={styles.fieldLabel}>JOIN CODE FOR EMPLOYEES</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="key-outline" size={20} color="#8e8e93" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="JOIN CODE"
                                        placeholderTextColor="#8e8e93"
                                        value={adminCode}
                                        onChangeText={(val) => {
                                            setAdminCode(val.toUpperCase());
                                            setIsCodeCustomized(true);
                                        }}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        editable={!loading}
                                    />
                                </View>
                                <Text style={styles.inputHint}>
                                    Employees will enter this code during signup to request access to your menu & sales.
                                </Text>

                                <TouchableOpacity
                                    style={[styles.primaryBtn, loading || !parttimeName.trim() || !adminCode.trim() ? styles.btnDisabled : {}]}
                                    onPress={handleAdminCreate}
                                    disabled={loading || !parttimeName.trim() || !adminCode.trim()}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Create & Start Parttime</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STEP 2B: EMPLOYEE JOIN */}
                        {step === 'employeeJoin' && (
                            <View style={styles.stepContainer}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setStep('selectRole')}
                                    disabled={loading}
                                >
                                    <Ionicons name="chevron-back" size={20} color="#0A84FF" />
                                    <Text style={styles.backButtonText}>Back to Roles</Text>
                                </TouchableOpacity>

                                <View style={styles.iconWrap}>
                                    <Ionicons name="link" size={44} color="#30D158" />
                                </View>

                                <Text style={styles.title}>Join a Parttime</Text>
                                <Text style={styles.subtitle}>
                                    Enter the unique Join Code provided by your manager to request access.
                                </Text>

                                <Text style={styles.fieldLabel}>ENTER JOIN CODE</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="key-outline" size={20} color="#8e8e93" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. STARBDOWN"
                                        placeholderTextColor="#8e8e93"
                                        value={employeeCode}
                                        onChangeText={setEmployeeCode}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        editable={!loading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.primaryBtn, { backgroundColor: '#30D158' }, loading || employeeCode.trim().length === 0 ? styles.btnDisabled : {}]}
                                    onPress={handleEmployeeJoin}
                                    disabled={loading || employeeCode.trim().length === 0}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Request Access</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                    </ScrollView>

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
    keyboardView: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 16 },
    scrollContent: { paddingVertical: 16, flexGrow: 1, justifyContent: 'center' },
    stepContainer: { width: '100%', alignItems: 'center' },

    backButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    backButtonText: { color: '#0A84FF', fontSize: 16, fontFamily: 'Outfit_600SemiBold', marginLeft: 4 },

    iconWrap: {
        width: 80, height: 80, borderRadius: 26,
        backgroundColor: 'rgba(10,132,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
    },

    title: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 15, fontFamily: 'Outfit_400Regular', color: '#8e8e93', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 12 },

    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        borderRadius: 20,
        padding: 18,
        width: '100%',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2c2c2e',
    },
    roleIconWrap: {
        width: 52, height: 52, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 16,
    },
    roleInfo: { flex: 1, marginRight: 8 },
    roleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    roleTitle: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: '#fff' },
    roleDesc: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: '#8e8e93', lineHeight: 18 },

    adminBadge: { backgroundColor: 'rgba(10,132,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    employeeBadge: { backgroundColor: 'rgba(48,209,88,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 11, fontFamily: 'Outfit_600SemiBold' },

    fieldLabel: {
        alignSelf: 'flex-start',
        fontSize: 12,
        fontFamily: 'Outfit_700Bold',
        color: '#8e8e93',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1c1c1e', borderRadius: 16,
        paddingHorizontal: 16, paddingVertical: 14,
        width: '100%', marginBottom: 16,
        borderWidth: 1, borderColor: '#333',
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#fff', fontSize: 16, fontFamily: 'Outfit_600SemiBold' },
    inputHint: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', alignSelf: 'flex-start', marginLeft: 4, marginBottom: 24, marginTop: -8 },

    suggestionsContainer: { width: '100%', marginBottom: 20 },
    suggestionsTitle: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: '#0A84FF', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        backgroundColor: '#1c1c1e',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    chipSelected: {
        backgroundColor: '#0A84FF',
        borderColor: '#0A84FF',
    },
    chipText: { color: '#8e8e93', fontSize: 13, fontFamily: 'Outfit_600SemiBold' },
    chipTextSelected: { color: '#fff' },

    primaryBtn: {
        backgroundColor: '#0A84FF', borderRadius: 16,
        width: '100%', paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#0A84FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
        marginTop: 8,
    },
    btnDisabled: { opacity: 0.5, shadowOpacity: 0 },
    primaryBtnText: { fontSize: 17, fontFamily: 'Outfit_600SemiBold', color: '#fff' },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12,
    },
    logoutText: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#FF453A' },
});
