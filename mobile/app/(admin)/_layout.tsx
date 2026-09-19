import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export default function AdminLayout() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === 'dark';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    borderTopWidth: 0.5,
                    borderTopColor: isDark ? 'rgba(84, 84, 88, 0.65)' : 'rgba(0, 0, 0, 0.12)',
                    height: Platform.OS === 'ios' ? 88 : 72,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 8,
                },
                tabBarActiveTintColor: '#0A84FF',
                tabBarInactiveTintColor: isDark ? '#8e8e93' : '#8e8e93',
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: 'Outfit_600SemiBold',
                    marginTop: 4,
                    letterSpacing: -0.1,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="employees"
                options={{
                    title: 'Staff',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "cube" : "cube-outline"} size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                        </View>
                    ),
                }}
            />

            {/* Hidden screens in the Tab Navigator that act as inner pages */}
            <Tabs.Screen name="users" options={{ href: null, headerShown: true, title: 'Manage Users', headerTitleStyle: { fontFamily: 'Outfit_700Bold' }, headerStyle: { backgroundColor: isDark ? '#1c1c1e' : '#fff' }, headerTintColor: isDark ? '#fff' : '#000' }} />
            <Tabs.Screen name="sales" options={{ href: null, headerShown: true, title: 'Sales History', headerTitleStyle: { fontFamily: 'Outfit_700Bold' }, headerStyle: { backgroundColor: isDark ? '#1c1c1e' : '#fff' }, headerTintColor: isDark ? '#fff' : '#000' }} />
            <Tabs.Screen name="schedule" options={{ href: null, headerShown: true, title: 'Scheduler', headerTitleStyle: { fontFamily: 'Outfit_700Bold' }, headerStyle: { backgroundColor: isDark ? '#1c1c1e' : '#fff' }, headerTintColor: isDark ? '#fff' : '#000' }} />
            <Tabs.Screen name="announcements" options={{ href: null, headerShown: true, title: 'Announcements', headerTitleStyle: { fontFamily: 'Outfit_700Bold' }, headerStyle: { backgroundColor: isDark ? '#1c1c1e' : '#fff' }, headerTintColor: isDark ? '#fff' : '#000' }} />
            <Tabs.Screen name="employee-detail" options={{ href: null, headerShown: true, title: 'Employee Performance', headerTitleStyle: { fontFamily: 'Outfit_700Bold' }, headerStyle: { backgroundColor: isDark ? '#1c1c1e' : '#fff' }, headerTintColor: isDark ? '#fff' : '#000' }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 52,
        height: 32,
    },
});
