// src/lib/firebase.js
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const cfg =
  Constants?.expoConfig?.extra?.firebase ||
  Constants?.manifest?.extra?.firebase; // compat legacy

const app = getApps().length ? getApp() : initializeApp(cfg);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
