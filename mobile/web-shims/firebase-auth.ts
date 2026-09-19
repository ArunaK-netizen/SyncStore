import type { User as FirebaseUser } from 'firebase/auth';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { webApp } from './firebase-config';

const authInstance = getAuth(webApp);
const auth = Object.assign(() => authInstance, { GoogleAuthProvider });

export namespace FirebaseAuthTypes {
	export type User = FirebaseUser;
}
export { GoogleAuthProvider };
export default auth;