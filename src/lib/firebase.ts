import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDocFromServer,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Investigation, AppUser } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore connection on boot safely without triggering permission-denied errors
async function testConnection() {
  try {
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    }
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}
testConnection();

// Structured Firestore error diagnostic handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Authentication helpers
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInDemoAnalyst(): Promise<FirebaseUser | AppUser> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err: any) {
    console.warn('Firebase Anonymous sign-in not enabled or restricted on project, using demo analyst session:', err?.message);
    const demoAnalyst: AppUser = {
      uid: 'demo-analyst-guest-soc',
      email: 'analyst@sentinel.soc',
      displayName: 'Lead SOC Analyst (Demo Session)',
      photoURL: null,
      isAnonymous: true,
    };
    return demoAnalyst;
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Firestore Investigation Operations under /users/{userId}/investigations/{investigationId}
const LOCAL_STORAGE_KEY_PREFIX = 'sentinel_ai_inv_';
export const DEMO_STORAGE_EVENT = 'sentinel_demo_storage_update';

export function notifyDemoStorageUpdate(userId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEMO_STORAGE_EVENT, { detail: { userId } }));
  }
}

export async function saveInvestigationToFirestore(
  userId: string,
  investigation: Investigation
): Promise<void> {
  const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
  // Always update local cache as immediate safeguard
  try {
    const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
    const existingIndex = cached.findIndex((i: Investigation) => i.id === investigation.id);
    if (existingIndex >= 0) {
      cached[existingIndex] = investigation;
    } else {
      cached.unshift(investigation);
    }
    localStorage.setItem(localKey, JSON.stringify(cached));
  } catch (e) {
    console.warn('Local storage cache error:', e);
  }

  // If Firebase Auth session is active and user ID matches, persist directly to Cloud Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const docRef = doc(db, 'users', userId, 'investigations', investigation.id);
      await setDoc(docRef, {
        ...investigation,
        userId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/investigations/${investigation.id}`);
      throw error;
    }
  } else {
    // For local demo analyst session without an active Firebase Auth token, notify subscribers
    notifyDemoStorageUpdate(userId);
  }
}

export async function updateInvestigationInFirestore(
  userId: string,
  investigationId: string,
  updates: Partial<Investigation>
): Promise<void> {
  const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
  // Update local cache
  try {
    const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
    const index = cached.findIndex((i: Investigation) => i.id === investigationId);
    if (index >= 0) {
      cached[index] = { ...cached[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(localKey, JSON.stringify(cached));
    }
  } catch (e) {
    console.warn('Local storage update cache error:', e);
  }

  // If Firebase Auth session is active and user ID matches, update in Cloud Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const docRef = doc(db, 'users', userId, 'investigations', investigationId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/investigations/${investigationId}`);
      throw error;
    }
  } else {
    notifyDemoStorageUpdate(userId);
  }
}

export async function deleteInvestigationFromFirestore(
  userId: string,
  investigationId: string
): Promise<void> {
  const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
  // Update local cache
  try {
    const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = cached.filter((i: Investigation) => i.id !== investigationId);
    localStorage.setItem(localKey, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Local storage delete cache error:', e);
  }

  // If Firebase Auth session is active and user ID matches, delete from Cloud Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const docRef = doc(db, 'users', userId, 'investigations', investigationId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/investigations/${investigationId}`);
      throw error;
    }
  } else {
    notifyDemoStorageUpdate(userId);
  }
}

export function subscribeUserInvestigations(
  userId: string,
  onData: (investigations: Investigation[]) => void,
  onError?: (error: Error) => void
): () => void {
  const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;

  const loadLocalCache = (): Investigation[] => {
    try {
      return JSON.parse(localStorage.getItem(localKey) || '[]');
    } catch (e) {
      return [];
    }
  };

  // Deliver initial local cache immediately
  const initial = loadLocalCache();
  if (initial.length > 0) {
    onData(initial);
  }

  // Check if active user is authenticated in Firebase Auth
  const isAuthSession = !!(auth.currentUser && auth.currentUser.uid === userId);

  if (isAuthSession) {
    // Firestore real-time listener for authenticated users
    const colRef = collection(db, 'users', userId, 'investigations');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: Investigation[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ ...(docSnap.data() as Investigation), id: docSnap.id });
        });
        
        try {
          localStorage.setItem(localKey, JSON.stringify(results));
        } catch (e) {
          // ignore storage quota errors
        }

        onData(results);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/investigations`);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } else {
    // Demo Analyst session without active Firebase Auth token: react to local updates
    const handleStorageUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string }>;
      if (!customEvent.detail || customEvent.detail.userId === userId) {
        onData(loadLocalCache());
      }
    };

    window.addEventListener(DEMO_STORAGE_EVENT, handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener(DEMO_STORAGE_EVENT, handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }
}
