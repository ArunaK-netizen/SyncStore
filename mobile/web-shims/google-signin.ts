import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { webApp } from './firebase-config';

const provider = new GoogleAuthProvider();
const auth = getAuth(webApp);

export const GoogleSignin = {
    configure: () => undefined,
    hasPlayServices: async () => true,
    signIn: async () => {
        const result = await signInWithPopup(auth, provider);
        return { data: { idToken: await result.user.getIdToken(), serverAuthCode: undefined } };
    },
    signOut: async () => signOut(auth),
};

export default { GoogleSignin };