import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA_AdNJGx9sj28qzfxolFBOOLXA7SUFDbU",
  authDomain: "arpanam-f5bf6.firebaseapp.com",
  projectId: "arpanam-f5bf6",
  storageBucket: "arpanam-f5bf6.firebasestorage.app",
  messagingSenderId: "917560714289",
  appId: "1:917560714289:web:16252ab20122909ae0e110",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

const provider = new GoogleAuthProvider()

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function signInWithGoogle() {
  return signInWithPopup(auth, provider)
}

export function signOut() {
  return firebaseSignOut(auth)
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

// ─── Firestore ────────────────────────────────────────────────────────────────
function userDoc(uid) {
  return doc(db, 'users', uid, 'data', 'arpanam')
}

export async function pushToCloud(uid, data) {
  try {
    await setDoc(userDoc(uid), data)
    return true
  } catch (err) {
    console.error('Push failed:', err)
    return false
  }
}

export async function pullFromCloud(uid) {
  try {
    const snap = await getDoc(userDoc(uid))
    if (snap.exists()) return snap.data()
    return null
  } catch (err) {
    console.error('Pull failed:', err)
    return null
  }
}
