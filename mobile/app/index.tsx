import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

export default function Index() {
  const { user, loading, accessStatus } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color={isDark ? '#0A84FF' : '#007AFF'} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  // User is signed in but not yet approved
  if (accessStatus === 'needsCode') {
    return <Redirect href={'/join' as any} />;
  }

  if (accessStatus === 'pending' || accessStatus === 'rejected' || accessStatus === 'checking') {
    return <Redirect href={'/pending' as any} />;
  }

  // Fully approved — go to dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}
