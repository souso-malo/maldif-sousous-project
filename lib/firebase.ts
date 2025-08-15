import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase (projet public de démonstration)
const firebaseConfig = {
  apiKey: "AIzaSyBYZ9QJJ5J5J5J5J5J5J5J5J5J5J5J5J5J",
  authDomain: "coffre-fort-sharing.firebaseapp.com",
  projectId: "coffre-fort-sharing",
  storageBucket: "coffre-fort-sharing.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
export const db = getFirestore(app);

export default app;