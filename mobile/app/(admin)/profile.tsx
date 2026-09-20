import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS, saveData } from '../../utils/storage';

function MenuItem({
    icon,
    iconBg,
    label,
    sublabel,
    badge,
    onPress,
    isDark,
    danger,
}: {
    icon: string;
    iconBg: string;
    label: string;
    sublabel?: string;
    badge?: string | number;
    onPress: () => void;
    isDark: boolean;
    danger?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, isDark && styles.menuItemDark]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name={icon as any} size={18} color="#fff" />
            </View>
            <View style={styles.menuLabelWrap}>
                <Text style={[styles.menuLabel, isDark && styles.menuLabelDark, danger && styles.menuLabelDanger]}>
                    {label}
                </Text>
                {sublabel ? (
                    <Text style={[styles.menuSublabel, isDark && styles.menuSublabelDark]} numberOfLines={1}>
                        {sublabel}
                    </Text>
                ) : null}
            </View>
            {badge !== undefined && (
                <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            {!danger && (
                <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDark ? '#48484a' : '#c7c7cc'}
                    style={{ marginLeft: 4 }}
                />
            )}
        </TouchableOpacity>
    );
}

function SectionLabel({ title, isDark }: { title: string; isDark: boolean }) {
    return (
        <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>{title}</Text>
    );
}

export default function AdminProfileTab() {
    const { user, logout } = useAuth();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const handleLogout = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await saveData(STORAGE_KEYS.THEME, colorScheme);
            await logout();
            router.replace('/login' as any);
        } catch (err) {
            console.error('Logout:', err);
        }
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                >
                    <View style={styles.pageHeader}>
                        <Text style={[styles.pageTitle, isDark && styles.pageTitleDark]}>Profile</Text>
                    </View>

                    <View style={[styles.userCard, isDark && styles.userCardDark]}>
                        <View style={styles.avatarSection}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarText}>
                                        {user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text style={[styles.userName, isDark && styles.userNameDark]}>
                            {user?.displayName || 'Administrator'}
                        </Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>

                        <View style={styles.roleBadge}>
                            <Ionicons name="shield-checkmark" size={12} color="#0A84FF" />
                            <Text style={styles.roleText}>Store Admin</Text>
                        </View>
                    </View>

                    <SectionLabel title="SWITCH MODE" isDark={isDark} />
                    <View style={[styles.menuGroup, isDark && styles.menuGroupDark]}>
                        <MenuItem
                            icon="person"
                            iconBg={isDark ? "#30D158" : "#34C759"}
                            label="Switch to Employee View"
                            sublabel="View your personal schedule and leaderboard"
                            onPress={() => router.replace('/(tabs)' as any)}
                            isDark={isDark}
                        />
                    </View>

                    <SectionLabel title="ACCOUNT" isDark={isDark} />
                    <View style={[styles.menuGroup, isDark && styles.menuGroupDark]}>
                        <TouchableOpacity
                            style={[styles.menuItem, isDark && styles.menuItemDark]}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                handleLogout();
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconWrap, { backgroundColor: '#FF453A' }]}>
                                <Ionicons name="log-out-outline" size={18} color="#fff" />
                            </View>
                            <View style={styles.menuLabelWrap}>
                                <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Log Out</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    containerDark: { backgroundColor: '#000000' },
    pageHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    pageTitle: { fontSize: 34, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.5 },
    pageTitleDark: { color: '#fff' },
    scroll: { paddingHorizontal: 16 },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    userCardDark: { backgroundColor: '#1c1c1e' },
    avatarSection: { marginBottom: 14 },
    avatar: { width: 88, height: 88, borderRadius: 44 },
    avatarPlaceholder: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: '#0A84FF',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 36, fontFamily: 'Outfit_700Bold', color: '#fff' },
    userName: { fontSize: 22, fontFamily: 'Outfit_700Bold', color: '#000', letterSpacing: -0.3, marginBottom: 4 },
    userNameDark: { color: '#fff' },
    userEmail: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginBottom: 12 },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(10,132,255,0.10)',
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    },
    roleText: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', color: '#0A84FF' },
    sectionLabel: {
        fontSize: 12, fontFamily: 'Outfit_600SemiBold',
        color: '#8e8e93', letterSpacing: 0.8,
        marginBottom: 8, marginLeft: 4,
        textTransform: 'uppercase',
    },
    sectionLabelDark: { color: '#636366' },
    menuGroup: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    menuGroupDark: { backgroundColor: '#1c1c1e' },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: 'transparent',
        gap: 13,
    },
    menuItemDark: {},
    menuIconWrap: {
        width: 34, height: 34, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center',
    },
    menuLabelWrap: { flex: 1 },
    menuLabel: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#000' },
    menuLabelDark: { color: '#fff' },
    menuLabelDanger: { color: '#FF453A' },
    menuSublabel: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#8e8e93', marginTop: 1 },
    menuSublabelDark: { color: '#636366' },
    badgePill: {
        backgroundColor: '#0A84FF',
        borderRadius: 10, minWidth: 20, height: 20,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: { fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#fff' },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e5ea', marginLeft: 62 },
    separatorDark: { backgroundColor: '#2c2c2e' },
});
