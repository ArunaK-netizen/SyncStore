import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB_O7RUFnaYx_n3eJuQaTiMDdYHx99WDR4',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'rasagnaparttime.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'rasagnaparttime',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'rasagnaparttime.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1013804877154',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1013804877154:android:f0690e3e102e924091183b',
};

export const webApp = getApps().length ? getApp() : initializeApp(firebaseConfig);