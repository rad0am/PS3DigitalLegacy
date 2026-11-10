import type { Auth } from 'firebase/auth';
import { getFirebaseAuth } from '#lib/firebase/client.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage';
import { sync } from './sync.svelte';

export type ProviderId = 'google' | 'discord' | 'facebook' | 'reddit';

export interface ProviderInfo {
	id: ProviderId;
	/** shown in the buttons and not translated */
	name: string;
	/** neutral monogram, not the provider's logo (CLAUDE.md, "Sign-in providers") */
	mark: string;
	/**
	 * Firebase supports Google and Facebook directly. Discord and Reddit need a token-exchange
	 * backend (see "Sign-in providers" in CLAUDE.md), so they stay off until the owner decides.
	 */
	enabled: boolean;
}

export const PROVIDERS: readonly ProviderInfo[] = [
	{ id: 'google', name: 'Google', mark: 'G', enabled: true }
];

export interface AuthUser {
	uid: string;
	name: string | null;
	email: string | null;
}

export type AuthError = 'popup_blocked' | 'exists' | 'network' | 'generic';

class AuthStore {
	user = $state<AuthUser | null>(null);
	busy = $state(false);
	error = $state<AuthError | null>(null);
	#started = false;
	#ready: { auth: Auth; firebaseAuth: typeof import('firebase/auth') } | undefined;

	/** Restores a previous session. Firebase Auth is only loaded if the user signed in before. */
	async init(): Promise<void> {
		if (this.#started || readStorage(STORAGE_KEYS.signedIn) !== '1') return;
		await this.#start();
	}

	async #start(): Promise<void> {
		if (this.#started) return;
		this.#started = true;
		try {
			const [auth, { onAuthStateChanged }] = await Promise.all([
				getFirebaseAuth(),
				import('firebase/auth')
			]);
			onAuthStateChanged(auth, (user) => {
				if (user) {
					this.user = { uid: user.uid, name: user.displayName, email: user.email };
					void sync.attach(user.uid);
				} else {
					this.user = null;
					sync.detach();
					writeStorage(STORAGE_KEYS.signedIn, null);
				}
			});
		} catch (error) {
			console.error(error);
			this.#started = false;
		}
	}

	/**
	 * Loads Firebase Auth ahead of the click. Browsers only allow a pop-up opened directly from a tap,
	 * so signInWithPopup must run before any `await`: loading the SDK first would get it blocked.
	 */
	async preload(): Promise<void> {
		if (this.#ready) return;
		try {
			const [auth, firebaseAuth] = await Promise.all([getFirebaseAuth(), import('firebase/auth')]);
			this.#ready = { auth, firebaseAuth };
		} catch (error) {
			console.error(error);
		}
	}

	async signIn(id: ProviderId): Promise<boolean> {
		const provider = PROVIDERS.find((p) => p.id === id);
		if (!provider?.enabled || this.busy) return false;
		this.error = null;
		if (!this.#ready) {
			await this.preload();
			if (!this.#ready) {
				this.error = 'network';
				return false;
			}
		}
		this.busy = true;
		const { auth, firebaseAuth } = this.#ready;
		const authProvider =
			id === 'facebook'
				? new firebaseAuth.FacebookAuthProvider()
				: new firebaseAuth.GoogleAuthProvider();
		try {
			// No await before this call, so the browser still treats it as a direct result of the tap.
			await firebaseAuth.signInWithPopup(auth, authProvider);
			writeStorage(STORAGE_KEYS.signedIn, '1');
			await this.#start();
			return true;
		} catch (error) {
			const code = (error as { code?: string } | null)?.code;
			if (code === 'auth/popup-blocked') {
				// Fall back to a full-page redirect. The session is restored on return (see init()).
				try {
					writeStorage(STORAGE_KEYS.signedIn, '1');
					await firebaseAuth.signInWithRedirect(auth, authProvider);
					return true;
				} catch (redirectError) {
					writeStorage(STORAGE_KEYS.signedIn, null);
					this.error = this.#classify(redirectError);
					return false;
				}
			}
			this.error = this.#classify(error);
			return false;
		} finally {
			this.busy = false;
		}
	}

	async signOut(): Promise<void> {
		try {
			const [auth, { signOut }] = await Promise.all([getFirebaseAuth(), import('firebase/auth')]);
			await signOut(auth);
		} catch (error) {
			console.error(error);
		}
		this.user = null;
		sync.detach();
		writeStorage(STORAGE_KEYS.signedIn, null);
	}

	#classify(error: unknown): AuthError | null {
		const code =
			typeof error === 'object' && error !== null && 'code' in error
				? String((error as { code: unknown }).code)
				: '';
		switch (code) {
			// The user closed the popup: not an error worth showing.
			case 'auth/popup-closed-by-user':
			case 'auth/cancelled-popup-request':
				return null;
			case 'auth/popup-blocked':
				return 'popup_blocked';
			case 'auth/account-exists-with-different-credential':
				return 'exists';
			case 'auth/network-request-failed':
				return 'network';
			default:
				console.error(error);
				return 'generic';
		}
	}
}

export const auth = new AuthStore();
