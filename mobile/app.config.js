module.exports = {
  "expo": {
    "name": "PartTime",
    "slug": "parttime",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "mobile",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.blackdevil007.parttime",
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON || "./GoogleService-Info.plist",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.blackdevil007.parttime",
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "@react-native-firebase/app",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash_dark.png",
          "resizeMode": "contain",
          "backgroundColor": "#121212",
          "dark": {
            "image": "./assets/images/splash_dark.png",
            "backgroundColor": "#121212"
          }
        }
      ],
      "./plugins/withBundleInDebug.js",
      "expo-web-browser"
    ],
    "updates": {
      "url": "https://u.expo.dev/a078c8db-7c35-4340-99f3-1d02e95e4ac5",
      "checkAutomatically": "NEVER",
      "fallbackToCacheTimeout": 30000
    },
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "changelog": "Bug fixes and performance improvements",
      "router": {},
      "eas": {
        "projectId": "a078c8db-7c35-4340-99f3-1d02e95e4ac5"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
};