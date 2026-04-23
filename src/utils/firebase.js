// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDyTaws6Zn6F46X_mSTWQl7Axly03DNmPM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fixit-6b215.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fixit-6b215",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fixit-6b215.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "684763574365",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:684763574365:web:f9e40fefc3b76ae7475db4"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  throw error;
}

// Initialize Firebase services
let auth, db, storage;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  throw error;
}

export { auth, db, storage };
export default app;