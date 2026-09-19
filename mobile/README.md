# Rasagna Parttime Mobile App

A highly aesthetic React Native Expo app for tracking daily sales.

## Features
- **Daily Sales Tracking**: Add transactions with quantity, payment method (Cash/Card/UPI), and tips.
- **History**: Calendar view to track sales history.
- **Reports**: Weekly sales visualization.
- **Aesthetic UI**: Apple-inspired design with dark/light mode support.
- **Persistence**: Data is stored locally on the device.

## Tech Stack
- React Native (Expo)
- NativeWind (Tailwind CSS)
- Expo Router
- AsyncStorage
- React Native Calendars
- React Native Gifted Charts

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npx expo start
   ```

3. Scan the QR code with Expo Go on your phone.

## Web

Run the browser version locally:

```bash
npx expo start --web
```

Build static files for deployment:

```bash
npx expo export --platform web
```

The output is written to `dist/`. Web builds use the Firebase JavaScript SDK through the shims in `web-shims/`, while native builds continue to use React Native Firebase. For production, set these public Expo variables using the Web App configuration from Firebase Console:

```text
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

Use `npx expo export --platform web` as the Vercel or Netlify build command and `dist` as the output directory.
