import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// All routes are prerendered, so Firebase must only run in the browser.
// SDK modules are imported lazily to keep them out of the initial bundle,
// and the app works fully without signing in (local-first).

let appPromise: Promise<FirebaseApp> | undefined;
let authPromise: Promise<Auth> | undefined;
let dbPromise: Promise<Firestore> | undefined;

function assertBrowser(): void {
	if (typeof window === 'undefined') {
		throw new Error('Firebase is only available in the browser.');
	}
}

export function getFirebaseApp(): Promise<FirebaseApp> {
	assertBrowser();
	appPromise ??= import('firebase/app').then(({ initializeApp, getApps, getApp }) =>
		getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
	);
	return appPromise;
}

export function getFirebaseAuth(): Promise<Auth> {
	authPromise ??= Promise.all([getFirebaseApp(), import('firebase/auth')]).then(
		([app, { getAuth }]) => getAuth(app)
	);
	return authPromise;
}

export function getFirestoreDb(): Promise<Firestore> {
	dbPromise ??= Promise.all([getFirebaseApp(), import('firebase/firestore')]).then(
		([app, { getFirestore }]) => getFirestore(app)
	);
	return dbPromise;
}
