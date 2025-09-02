// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDyTaws6Zn6F46X_mSTWQl7Axly03DNmPM",
  authDomain: "fixit-6b215.firebaseapp.com",
  projectId: "fixit-6b215",
  storageBucket: "fixit-6b215.appspot.com",
  messagingSenderId: "684763574365",
  appId: "1:684763574365:web:f9e40fefc3b76ae7475db4"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Initialize Firebase services
let auth, db, storage;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log("Firebase services initialized successfully");
} catch (error) {
  console.error("Firebase services initialization error:", error);
  throw error;
}

export { auth, db, storage };
export default app;