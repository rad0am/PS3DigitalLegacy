// Public by design: security comes from Firestore rules and the API key referrer restriction, not from hiding this.
export const firebaseConfig = {
	apiKey: 'AIzaSyDoTuBjEjuZawQZe8I-gH2mFDTzdt9ljf8',
	authDomain: 'ps3digitallegacy.firebaseapp.com',
	projectId: 'ps3digitallegacy',
	storageBucket: 'ps3digitallegacy.firebasestorage.app',
	messagingSenderId: '948010274970',
	appId: '1:948010274970:web:4c62a0fde478e10495cf23'
} as const;
