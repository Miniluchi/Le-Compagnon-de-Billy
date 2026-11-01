import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { deleteDoc, doc, getFirestore, runTransaction } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { useStore } from './store';
import { mergeSave, type Save } from './sync';

// Clés publiques par conception : la sécurité vient des règles Firestore (firestore.rules à la racine).
const firebaseConfig = {
  apiKey: 'AIzaSyDgxh1iNxlSWYBETt0jH3FeO2co-NKbi2g',
  authDomain: 'billyhelper-87007.firebaseapp.com',
  projectId: 'billyhelper-87007',
  appId: '1:365028606612:web:588a30a7bc0bf4b3d1aa81',
};

/** Sans configuration, l'appli reste purement locale. */
export const cloudEnabled = !!firebaseConfig.apiKey;
const app = cloudEnabled ? initializeApp(firebaseConfig) : undefined;
const auth = app && getAuth(app);
const db = app && getFirestore(app);

export type SyncStatus = 'idle' | 'syncing' | 'error';
let cloud: { user: User | null; status: SyncStatus } = { user: null, status: 'idle' };
const listeners = new Set<() => void>();

function setCloud(next: Partial<typeof cloud>) {
  cloud = { ...cloud, ...next };
  listeners.forEach(l => l());
}

export function useCloud() {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cloud,
  );
}

const localSave = (): Save => {
  const { games, achievements, deleted } = useStore.getState();
  return { games, achievements, deleted };
};

let applying = false;
function apply(save: Save) {
  applying = true;
  // On refusionne avec l'état courant : on garde ce qui a été joué pendant l'aller-retour réseau.
  useStore.getState().applySync(mergeSave(localSave(), save));
  applying = false;
}

/** Lit la sauvegarde distante, la fusionne avec l'appareil et réécrit le tout, en une transaction. */
async function sync(uid: string) {
  setCloud({ status: 'syncing' });
  try {
    const ref = doc(db!, 'users', uid);
    const merged = await runTransaction(db!, async tx => {
      const raw = (await tx.get(ref)).data()?.data;
      const save = mergeSave(localSave(), typeof raw === 'string' ? JSON.parse(raw) : undefined);
      // En texte JSON : Firestore refuse les valeurs undefined et les tableaux imbriqués.
      tx.set(ref, { data: JSON.stringify(save), updatedAt: new Date().toISOString() });
      return save;
    });
    apply(merged);
    setCloud({ status: 'idle' });
  } catch (e) {
    // L'état local n'est jamais touché en cas d'échec : on réessaiera au prochain changement.
    console.error('[sync]', e);
    setCloud({ status: 'error' });
  }
}

let queue = Promise.resolve();
let timer: ReturnType<typeof setTimeout> | undefined;

function schedule(delay = 1500) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const uid = cloud.user?.uid;
    if (uid) queue = queue.then(() => sync(uid));
  }, delay);
}

export function startSync() {
  if (!auth) return;
  onAuthStateChanged(auth, user => {
    setCloud({ user, status: 'idle' });
    if (user) schedule(0);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') schedule(0);
  });
  useStore.subscribe((s, prev) => {
    if (!applying && (s.games !== prev.games || s.achievements !== prev.achievements || s.deleted !== prev.deleted)) schedule();
  });
}

export const signIn = () => signInWithPopup(auth!, new GoogleAuthProvider());
export const signOut = () => firebaseSignOut(auth!);

/** Efface la sauvegarde distante puis déconnecte, sinon la prochaine synchro la recréerait. Les données locales restent. */
export async function deleteCloudData() {
  const uid = cloud.user?.uid;
  if (!uid) return;
  clearTimeout(timer);
  await queue;
  await deleteDoc(doc(db!, 'users', uid));
  await firebaseSignOut(auth!);
}
