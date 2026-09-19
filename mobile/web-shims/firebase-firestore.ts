import * as firestore from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { webApp } from './firebase-config';

const db = getFirestore(webApp);

export default () => db;
export const collection = firestore.collection;
export const doc = firestore.doc;
export const getDoc = firestore.getDoc;
export const getDocs = firestore.getDocs;
export const onSnapshot = firestore.onSnapshot;
export const query = firestore.query;
export const where = firestore.where;
export const orderBy = firestore.orderBy;
export const setDoc = firestore.setDoc;
export const addDoc = firestore.addDoc;
export const updateDoc = firestore.updateDoc;
export const deleteDoc = firestore.deleteDoc;
export const serverTimestamp = firestore.serverTimestamp;