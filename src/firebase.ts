import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAyPU7Li00Uge5TZ_hBX9KPWgBIRuHlg7o",
  authDomain: "cosmic-epsilon-g9brs.firebaseapp.com",
  projectId: "cosmic-epsilon-g9brs",
  storageBucket: "cosmic-epsilon-g9brs.firebasestorage.app",
  messagingSenderId: "1076544165763",
  appId: "1:1076544165763:web:edd214e4de13bad5af08b6"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-35048ceb-d095-4fd9-a56a-d7f1aa0d23b0");
export const storage = getStorage(app);

