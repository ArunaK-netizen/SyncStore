
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';


export default function Login() {
  const router = useRouter();
  const { signInWithGoogle, loading: authLoading, user } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[isDark ? 'dark' : 'light'];

  const [loadingGoogle, setLoadingGoogle] = useState(false);


  const handleGoogleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoadingGoogle(true);
      await signInWithGoogle();
      router.replace('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  // If we're already authenticated, never show the login UI.
  if (!authLoading && user) {
    return <Redirect href="/" />;
  }

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#11181C' }]}>Welcome to Parttime</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#ECEDEE' : '#687076', fontWeight: '400' }]}>Sign in to continue</Text>

      <TouchableOpacity
        style={[
          styles.googleButton,
          {
            backgroundColor: '#007AFF',
            borderRadius: 16,
            marginTop: 24,
            marginBottom: 16,
          },
        ]}
        onPress={handleGoogleSignIn}
        disabled={loadingGoogle}
      >
        <Ionicons
          name="logo-google"
          size={22}
          color={'#fff'}
          style={styles.buttonIcon}
        />
        <Text style={[styles.googleButtonText, { color: '#fff', fontWeight: '600' }]}>
          {loadingGoogle ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.footerText, { color: isDark ? '#9BA1A6' : '#687076' }]}>By continuing, you agree to our Terms of Service and Privacy Policy.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#151718',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 18,
    textAlign: 'center',
    opacity: 0.85,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
    fontWeight: '600',
  },
  footerText: {
    marginTop: 18,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
    opacity: 0.7,
  },
});