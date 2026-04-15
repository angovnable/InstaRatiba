import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'

// ── Replace these with your Firebase project config ──────────────────────────
// Get from: Firebase Console → Project Settings → Your apps → SDK setup
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'REPLACE.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'REPLACE_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'REPLACE.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000:web:000',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Enable offline persistence (IndexedDB) — works for PWA offline use
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firebase offline persistence: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Firebase offline persistence not supported in this browser')
  }
})

// ── Firestore helpers ─────────────────────────────────────────────────────────

export {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, query, where, orderBy, serverTimestamp, onSnapshot
}

export const TIMETABLES_COL = 'timetables'
