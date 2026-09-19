const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const webShims = {
	'@react-native-firebase/auth': path.resolve(__dirname, 'web-shims/firebase-auth.ts'),
	'@react-native-firebase/analytics': path.resolve(__dirname, 'web-shims/firebase-analytics.ts'),
	'@react-native-firebase/firestore': path.resolve(__dirname, 'web-shims/firebase-firestore.ts'),
	'@react-native-google-signin/google-signin': path.resolve(__dirname, 'web-shims/google-signin.ts'),
};

const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (platform === 'web' && webShims[moduleName]) {
		return { type: 'sourceFile', filePath: webShims[moduleName] };
	}

	return resolveRequest
		? resolveRequest(context, moduleName, platform)
		: context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
