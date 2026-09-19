import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface UpdateModalProps {
    visible: boolean;
    onUpdate: () => void;
    onCancel: () => void;
    isDownloading: boolean;
    manifest: any; // Expo Update manifest type
}

export function UpdateModal({ visible, onUpdate, onCancel, isDownloading, manifest }: UpdateModalProps) {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';

    // Try to extract a message or fallback from EAS Update or Classic Updates
    const m = manifest?.manifest || {};
    const expoClient = m.extra?.expoClient || {};
    
    const updateMessage =
        m.message || // Often EAS puts the update message directly on the manifest object
        expoClient.extra?.updateMessage ||
        expoClient.extra?.message ||
        m.extra?.message ||
        m.extra?.changelog ||
        m.metadata?.message ||
        "A new update is available with performance improvements and bug fixes.";

    const version = expoClient.version || m.version || "Latest";

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.centeredView}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 40 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.modalView, isDark && styles.modalViewDark]}>
                    {/* Header / Icon */}
                    <LinearGradient
                        colors={['#007AFF', '#5856D6']}
                        style={styles.iconContainer}
                    >
                        <Ionicons name="rocket" size={32} color="#fff" />
                    </LinearGradient>

                    <Text style={[styles.title, isDark && styles.titleDark]}>
                        Update Available!
                    </Text>

                    <View style={[styles.versionBadge, isDark && styles.versionBadgeDark]}>
                        <Text style={styles.versionText}>v{version}</Text>
                    </View>

                    <View style={styles.changelogContainer}>
                        <Text style={[styles.changelogLabel, isDark && styles.changelogLabelDark]}>
                            What's New:
                        </Text>
                        <Text style={[styles.changelogText, isDark && styles.changelogTextDark]}>
                            {updateMessage}
                        </Text>
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={onUpdate}
                        disabled={isDownloading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#007AFF', '#0063CC']}
                            style={styles.updateButtonGradient}
                        >
                            <Text style={styles.updateButtonText}>
                                {isDownloading ? 'Downloading...' : 'Update Now'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {!isDownloading && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                        >
                            <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>
                                Not Now
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '85%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    modalViewDark: {
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 22,
        fontFamily: 'Outfit_700Bold', // Assuming global font
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#000',
    },
    titleDark: {
        color: '#fff',
    },
    versionBadge: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 20,
    },
    versionBadgeDark: {
        backgroundColor: '#2C2C2E',
    },
    versionText: {
        fontSize: 13,
        color: '#8E8E93',
        fontFamily: 'Outfit_600SemiBold',
        fontWeight: '600',
    },
    changelogContainer: {
        width: '100%',
        marginBottom: 24,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
        padding: 12,
    },
    changelogLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
        fontFamily: 'Outfit_600SemiBold',
    },
    changelogLabelDark: {
        color: '#98989D',
    },
    changelogText: {
        fontSize: 15,
        color: '#3A3A3C',
        lineHeight: 20,
        fontFamily: 'Outfit_400Regular',
    },
    changelogTextDark: {
        color: '#E5E5EA',
    },
    updateButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 12,
    },
    updateButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    updateButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    cancelButtonText: {
        color: '#8E8E93',
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    cancelButtonTextDark: {
        color: '#98989D',
    },
});
